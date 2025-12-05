use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

/// Represents a Claude Skill with metadata from SKILL.md
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Skill {
    pub name: String,
    pub description: String,
    pub version: Option<String>,
    pub path: PathBuf,
    /// Source feed name (e.g., "local", "official", "community")
    #[serde(default)]
    pub source: String,
}

/// Frontmatter metadata from SKILL.md
#[derive(Debug, Deserialize)]
struct SkillFrontmatter {
    name: String,
    description: String,
    #[serde(default)]
    version: Option<String>,
}

/// Discovers all skills in a given directory
pub fn discover_skills(base_path: &Path) -> Result<Vec<Skill>> {
    let mut skills = Vec::new();

    // Iterate through all subdirectories
    for entry in WalkDir::new(base_path)
        .max_depth(2)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();

        // Only check direct subdirectories
        if path.is_dir() && entry.depth() == 1 {
            let skill_md_path = path.join("SKILL.md");

            if skill_md_path.exists() {
                match parse_skill(&skill_md_path, path.to_path_buf()) {
                    Ok(skill) => skills.push(skill),
                    Err(e) => eprintln!("Warning: Failed to parse skill at {:?}: {}", path, e),
                }
            }
        }
    }

    // Sort by name for consistent output
    skills.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(skills)
}

/// Parses a SKILL.md file and extracts metadata
fn parse_skill(skill_md_path: &Path, path: PathBuf) -> Result<Skill> {
    parse_skill_with_source(skill_md_path, path, "local".to_string())
}

/// Parses a SKILL.md file and extracts metadata with source information
fn parse_skill_with_source(skill_md_path: &Path, path: PathBuf, source: String) -> Result<Skill> {
    let content = fs::read_to_string(skill_md_path).context("Failed to read SKILL.md")?;

    // Extract frontmatter
    let frontmatter =
        extract_frontmatter(&content).context("Failed to extract frontmatter from SKILL.md")?;

    Ok(Skill {
        name: frontmatter.name,
        description: frontmatter.description,
        version: frontmatter.version,
        path,
        source,
    })
}

/// Discovers skills from multiple sources (local directory + feeds)
pub fn discover_skills_from_sources(sources: Vec<(String, PathBuf)>) -> Result<Vec<Skill>> {
    let mut skills = Vec::new();

    for (source, path) in sources {
        let skill_md_path = path.join("SKILL.md");
        if skill_md_path.exists() {
            match parse_skill_with_source(&skill_md_path, path, source) {
                Ok(skill) => skills.push(skill),
                Err(e) => eprintln!("Warning: Failed to parse skill: {}", e),
            }
        }
    }

    // Sort by name for consistent output
    skills.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(skills)
}

/// Extracts YAML frontmatter from a markdown file
fn extract_frontmatter(content: &str) -> Result<SkillFrontmatter> {
    // Look for frontmatter between --- delimiters
    let lines: Vec<&str> = content.lines().collect();

    if lines.is_empty() || !lines[0].contains("---") {
        anyhow::bail!("No frontmatter found");
    }

    // Find the closing --- delimiter
    let mut end_index = None;
    for (i, line) in lines.iter().enumerate().skip(1) {
        if line.contains("---") {
            end_index = Some(i);
            break;
        }
    }

    let end_index = end_index.context("Unclosed frontmatter")?;
    let frontmatter_str = lines[1..end_index].join("\n");

    // Parse YAML frontmatter
    let frontmatter: SkillFrontmatter =
        serde_yaml::from_str(&frontmatter_str).context("Failed to parse YAML frontmatter")?;

    Ok(frontmatter)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_frontmatter_valid() {
        let content = r#"---
name: test-skill
description: A test skill
version: 1.0
---

# Content
"#;
        let fm = extract_frontmatter(content).unwrap();
        assert_eq!(fm.name, "test-skill");
        assert_eq!(fm.description, "A test skill");
        assert_eq!(fm.version, Some("1.0".to_string()));
    }

    #[test]
    fn test_extract_frontmatter_without_version() {
        let content = r#"---
name: test-skill
description: A test skill
---

# Content
"#;
        let fm = extract_frontmatter(content).unwrap();
        assert_eq!(fm.name, "test-skill");
        assert_eq!(fm.description, "A test skill");
        assert_eq!(fm.version, None);
    }

    #[test]
    fn test_extract_frontmatter_invalid() {
        let content = "# Content without frontmatter";
        assert!(extract_frontmatter(content).is_err());
    }
}
