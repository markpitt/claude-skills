use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

/// Represents a skills feed (git repository)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Feed {
    pub name: String,
    pub url: String,
    #[serde(default)]
    pub enabled: bool,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub branch: Option<String>,
}

/// Configuration for feeds
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeedsConfig {
    pub feeds: Vec<Feed>,
    #[serde(default = "default_cache_dir")]
    pub cache_dir: String,
}

fn default_cache_dir() -> String {
    ".skill-cache".to_string()
}

impl Default for FeedsConfig {
    fn default() -> Self {
        Self {
            feeds: vec![Feed {
                name: "local".to_string(),
                url: String::new(),
                enabled: true,
                description: "Local skills directory".to_string(),
                branch: None,
            }],
            cache_dir: default_cache_dir(),
        }
    }
}

impl FeedsConfig {
    /// Load configuration from a file
    pub fn load(path: &Path) -> Result<Self> {
        if path.exists() {
            let content = fs::read_to_string(path)?;
            serde_json::from_str(&content).context("Failed to parse feeds config")
        } else {
            Ok(Self::default())
        }
    }

    /// Save configuration to a file
    pub fn save(&self, path: &Path) -> Result<()> {
        let content = serde_json::to_string_pretty(self)?;
        fs::write(path, content)?;
        Ok(())
    }

    /// Add a new feed
    pub fn add_feed(&mut self, name: String, url: String, description: String) {
        self.feeds.push(Feed {
            name,
            url,
            enabled: true,
            description,
            branch: None,
        });
    }

    /// Remove a feed by name
    pub fn remove_feed(&mut self, name: &str) -> bool {
        let initial_len = self.feeds.len();
        self.feeds.retain(|f| f.name != name);
        self.feeds.len() < initial_len
    }

    /// Get enabled feeds
    pub fn enabled_feeds(&self) -> Vec<&Feed> {
        self.feeds.iter().filter(|f| f.enabled).collect()
    }
}

/// Immediate subdirectories of `dir` that contain a SKILL.md.
///
/// IO errors are propagated rather than swallowed, so an unreadable directory
/// is reported instead of being indistinguishable from an empty one. Callers
/// probing an optional location should check it exists first.
fn skill_dirs_in(dir: &Path) -> Result<Vec<PathBuf>> {
    let mut skills = Vec::new();

    let entries =
        fs::read_dir(dir).with_context(|| format!("Failed to read directory {}", dir.display()))?;

    for entry in entries {
        let path = entry
            .with_context(|| format!("Failed to read an entry in {}", dir.display()))?
            .path();
        if path.is_dir() && path.join("SKILL.md").exists() {
            skills.push(path);
        }
    }

    Ok(skills)
}

/// Manager for git-based skill feeds
pub struct FeedManager {
    config: FeedsConfig,
    config_path: PathBuf,
    cache_dir: PathBuf,
}

impl FeedManager {
    /// Create a new FeedManager
    pub fn new(config_path: PathBuf) -> Result<Self> {
        let config = FeedsConfig::load(&config_path)?;
        let cache_dir = PathBuf::from(&config.cache_dir);

        Ok(Self {
            config,
            config_path,
            cache_dir,
        })
    }

    /// Get the feeds configuration
    pub fn config(&self) -> &FeedsConfig {
        &self.config
    }

    /// Get mutable feeds configuration
    pub fn config_mut(&mut self) -> &mut FeedsConfig {
        &mut self.config
    }

    /// Save configuration
    pub fn save_config(&self) -> Result<()> {
        self.config.save(&self.config_path)
    }

    /// Clone or update a git repository
    fn clone_or_update(&self, feed: &Feed) -> Result<PathBuf> {
        let repo_dir = self.cache_dir.join(&feed.name);

        fs::create_dir_all(&self.cache_dir)?;

        if repo_dir.exists() {
            // Update existing repository
            let output = Command::new("git")
                .args(["-C", repo_dir.to_str().unwrap(), "pull", "--ff-only"])
                .output()
                .context("Failed to run git pull")?;

            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                anyhow::bail!("Git pull failed: {}", stderr);
            }
        } else {
            // Clone new repository
            let mut args = vec!["clone", "--depth", "1"];

            if let Some(branch) = &feed.branch {
                args.push("-b");
                args.push(branch);
            }

            args.push(&feed.url);
            args.push(repo_dir.to_str().unwrap());

            let output = Command::new("git")
                .args(&args)
                .output()
                .context("Failed to run git clone")?;

            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                anyhow::bail!("Git clone failed: {}", stderr);
            }
        }

        Ok(repo_dir)
    }

    /// Discover skills in a repository, checking the root and a `skills/`
    /// subdirectory. An absent `skills/` is not an error; an unreadable one is.
    pub fn discover_skills_in_repo(&self, repo_path: &Path) -> Result<Vec<PathBuf>> {
        let mut skills = skill_dirs_in(repo_path)?;

        let nested = repo_path.join("skills");
        if nested.exists() {
            skills.extend(skill_dirs_in(&nested)?);
        }

        Ok(skills)
    }

    /// Update all enabled feeds and return discovered skill paths
    pub fn update_feeds(&self) -> Result<Vec<(String, Vec<PathBuf>)>> {
        let mut results = Vec::new();

        for feed in self.config.enabled_feeds() {
            // Skip local feed (no URL)
            if feed.url.is_empty() {
                continue;
            }

            match self
                .clone_or_update(feed)
                .and_then(|repo_path| self.discover_skills_in_repo(&repo_path))
            {
                Ok(skills) => {
                    results.push((feed.name.clone(), skills));
                }
                Err(e) => {
                    eprintln!("Warning: Failed to update feed '{}': {}", feed.name, e);
                }
            }
        }

        Ok(results)
    }

    /// Get all skill paths from all sources (local + feeds)
    pub fn get_all_skill_paths(&self, local_dir: Option<&Path>) -> Result<Vec<(String, PathBuf)>> {
        let mut all_skills = Vec::new();

        // Add local skills first
        if let Some(local) = local_dir {
            if local.exists() {
                for path in skill_dirs_in(local)? {
                    all_skills.push(("local".to_string(), path));
                }
            }
        }

        // Add skills from cached feeds
        for feed in self.config.enabled_feeds() {
            if feed.url.is_empty() {
                continue;
            }

            let repo_dir = self.cache_dir.join(&feed.name);
            if repo_dir.exists() {
                for skill_path in self.discover_skills_in_repo(&repo_dir)? {
                    all_skills.push((feed.name.clone(), skill_path));
                }
            }
        }

        Ok(all_skills)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_feeds_config_default() {
        let config = FeedsConfig::default();
        assert_eq!(config.feeds.len(), 1);
        assert_eq!(config.feeds[0].name, "local");
    }

    #[test]
    fn test_feeds_config_save_load() {
        let dir = tempdir().unwrap();
        let config_path = dir.path().join("feeds.json");

        let mut config = FeedsConfig::default();
        config.add_feed(
            "test".to_string(),
            "https://github.com/test/repo.git".to_string(),
            "Test feed".to_string(),
        );

        config.save(&config_path).unwrap();

        let loaded = FeedsConfig::load(&config_path).unwrap();
        assert_eq!(loaded.feeds.len(), 2);
    }

    #[test]
    fn test_add_remove_feed() {
        let mut config = FeedsConfig::default();
        config.add_feed("test".to_string(), "url".to_string(), "desc".to_string());
        assert_eq!(config.feeds.len(), 2);

        let removed = config.remove_feed("test");
        assert!(removed);
        assert_eq!(config.feeds.len(), 1);
    }

    /// Create `parent/name/SKILL.md` so the directory looks like a skill
    fn make_skill(parent: &Path, name: &str) {
        let dir = parent.join(name);
        fs::create_dir_all(&dir).unwrap();
        fs::write(dir.join("SKILL.md"), "---\nname: test\n---\n").unwrap();
    }

    fn manager_in(dir: &Path) -> FeedManager {
        FeedManager::new(dir.join("feeds.json")).unwrap()
    }

    #[test]
    fn test_discover_skills_in_repo_scans_root_and_skills_subdir() {
        let dir = tempdir().unwrap();
        let repo = dir.path().join("repo");

        make_skill(&repo, "root-skill");
        make_skill(&repo.join("skills"), "nested-skill");
        // Neither of these should be picked up
        fs::create_dir_all(repo.join("not-a-skill")).unwrap();
        fs::write(repo.join("README.md"), "not a directory").unwrap();

        let mut found: Vec<String> = manager_in(dir.path())
            .discover_skills_in_repo(&repo)
            .unwrap()
            .iter()
            .map(|p| p.file_name().unwrap().to_string_lossy().into_owned())
            .collect();
        found.sort();

        assert_eq!(found, vec!["nested-skill", "root-skill"]);
    }

    #[test]
    fn test_discover_skills_in_repo_without_skills_subdir() {
        let dir = tempdir().unwrap();
        let repo = dir.path().join("repo");
        make_skill(&repo, "only-skill");

        let found = manager_in(dir.path())
            .discover_skills_in_repo(&repo)
            .unwrap();

        assert_eq!(found.len(), 1);
        assert!(found[0].ends_with("only-skill"));
    }

    #[test]
    fn test_discover_skills_in_repo_missing_directory_errors() {
        let dir = tempdir().unwrap();
        let absent = dir.path().join("absent");

        let err = manager_in(dir.path())
            .discover_skills_in_repo(&absent)
            .expect_err("a missing repository directory must not read as empty");

        assert!(
            err.to_string().contains(&absent.display().to_string()),
            "error should name the directory it failed on, got: {}",
            err
        );
    }
}
