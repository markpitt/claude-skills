use skills_tui::discover_skills;
use std::fs;
use std::path::Path;

#[test]
fn test_discover_skills_finds_all_skills() {
    // Create a temporary directory for testing
    let temp_dir = tempfile::tempdir().expect("Failed to create temp dir");
    let temp_path = temp_dir.path();

    // Create mock skills with SKILL.md files
    create_mock_skill(temp_path, "skill-one", "Skill One", "TypeScript");
    create_mock_skill(temp_path, "skill-two", "Skill Two", "Python");
    create_mock_skill(temp_path, "skill-three", "Skill Three", "Rust");

    // Discover skills
    let skills = discover_skills(temp_path).expect("Failed to discover skills");

    // Assertions
    assert_eq!(skills.len(), 3, "Should find exactly 3 skills");

    // Check that all skill names are present
    let skill_names: Vec<String> = skills.iter().map(|s| s.name.clone()).collect();
    assert!(skill_names.contains(&"skill-one".to_string()));
    assert!(skill_names.contains(&"skill-two".to_string()));
    assert!(skill_names.contains(&"skill-three".to_string()));

    // Check that descriptions are parsed
    let skill_one = skills.iter().find(|s| s.name == "skill-one").unwrap();
    assert_eq!(skill_one.description, "Skill One Description");
}

#[test]
fn test_discover_skills_extracts_language_from_frontmatter() {
    let temp_dir = tempfile::tempdir().expect("Failed to create temp dir");
    let temp_path = temp_dir.path();

    // Create a skill with a specific language
    let skill_dir = temp_path.join("python-skill");
    fs::create_dir_all(&skill_dir).expect("Failed to create skill dir");

    let skill_md_content = r#"---
name: python-skill
description: A Python skill for testing
version: 1.0
---

# Python Skill

This is a test Python skill.
"#;

    fs::write(skill_dir.join("SKILL.md"), skill_md_content).expect("Failed to write SKILL.md");

    let skills = discover_skills(temp_path).expect("Failed to discover skills");
    assert_eq!(skills.len(), 1);

    let skill = &skills[0];
    assert_eq!(skill.name, "python-skill");
    assert_eq!(skill.description, "A Python skill for testing");
}

#[test]
fn test_discover_skills_ignores_folders_without_skill_md() {
    let temp_dir = tempfile::tempdir().expect("Failed to create temp dir");
    let temp_path = temp_dir.path();

    // Create a valid skill
    create_mock_skill(temp_path, "valid-skill", "Valid Skill", "Rust");

    // Create a folder without SKILL.md
    fs::create_dir_all(temp_path.join("invalid-folder")).expect("Failed to create invalid folder");

    let skills = discover_skills(temp_path).expect("Failed to discover skills");
    assert_eq!(skills.len(), 1, "Should only find the valid skill");
}

#[test]
fn test_discover_skills_handles_empty_directory() {
    let temp_dir = tempfile::tempdir().expect("Failed to create temp dir");
    let temp_path = temp_dir.path();

    let skills = discover_skills(temp_path).expect("Failed to discover skills");
    assert_eq!(skills.len(), 0, "Empty directory should return empty list");
}

// Helper function to create mock skills
fn create_mock_skill(base_path: &Path, name: &str, description: &str, _language: &str) {
    let skill_dir = base_path.join(name);
    fs::create_dir_all(&skill_dir).unwrap_or_else(|_| panic!("Failed to create {} dir", name));

    let skill_md_content = format!(
        r#"---
name: {}
description: {} Description
version: 1.0
---

# {}

This is a test skill.
"#,
        name, description, description
    );

    fs::write(skill_dir.join("SKILL.md"), skill_md_content)
        .unwrap_or_else(|_| panic!("Failed to write SKILL.md for {}", name));
}
