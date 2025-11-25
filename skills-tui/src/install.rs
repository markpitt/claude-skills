use anyhow::{Context, Result};
use std::fs;
use std::path::{Path, PathBuf};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum InstallError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Failed to determine home directory")]
    NoHomeDir,

    #[error("Failed to copy skill")]
    CopyFailed,

    #[error("Anyhow error: {0}")]
    Other(#[from] anyhow::Error),
}

/// Gets the standard Claude Code skills directory based on OS
pub fn get_claude_code_skills_dir() -> Result<PathBuf> {
    // Try to use directories crate for standard paths
    if let Some(config_dir) = directories::ProjectDirs::from("", "", "Claude") {
        let skills_dir = config_dir.config_dir().join("skills");
        Ok(skills_dir)
    } else {
        // Fallback for Linux/macOS
        if let Ok(home) = std::env::var("HOME") {
            Ok(PathBuf::from(home).join(".config/claude/skills"))
        } else {
            Err(anyhow::anyhow!(
                "Cannot determine Claude Code skills directory"
            ))
        }
    }
}

/// Copies a directory recursively
fn copy_dir_all(src: &Path, dst: &Path) -> Result<()> {
    fs::create_dir_all(dst).context("Failed to create destination directory")?;

    for entry in fs::read_dir(src).context("Failed to read source directory")? {
        let entry = entry.context("Failed to read directory entry")?;
        let path = entry.path();
        let file_name = entry.file_name();
        let dst_path = dst.join(&file_name);

        if path.is_dir() {
            copy_dir_all(&path, &dst_path)?;
        } else {
            fs::copy(&path, &dst_path).context(format!("Failed to copy file: {:?}", file_name))?;
        }
    }

    Ok(())
}

/// Installs a skill to Claude Code directory
pub fn install_to_claude_code(skill_path: &Path, destination: Option<&Path>) -> Result<PathBuf> {
    let skill_name = skill_path
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| anyhow::anyhow!("Invalid skill path"))?;

    let dest_dir = if let Some(custom_dest) = destination {
        custom_dest.to_path_buf()
    } else {
        get_claude_code_skills_dir()?
    };

    let skill_dest = dest_dir.join(skill_name);

    // Create parent directory if it doesn't exist
    fs::create_dir_all(&dest_dir).context("Failed to create skills directory")?;

    // Copy skill to destination
    copy_dir_all(skill_path, &skill_dest).context("Failed to copy skill")?;

    Ok(skill_dest)
}

/// Installs a skill to Claude Desktop
pub fn install_to_claude_desktop(
    skill_path: &Path,
    _config_path: Option<&Path>,
) -> Result<PathBuf> {
    // For now, just return the installed path (actual MCP config handling will be added later)
    let skill_name = skill_path
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| anyhow::anyhow!("Invalid skill path"))?;

    Ok(skill_path.to_path_buf().join(skill_name))
}
