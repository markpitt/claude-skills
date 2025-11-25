use anyhow::{Context, Result};
use std::fs::File;
use std::io::Write;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;
use zip::ZipWriter;

/// Creates a zip archive of a skill
pub fn zip_skill(skill_path: &Path, output_path: &Path) -> Result<PathBuf> {
    let skill_name = skill_path
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| anyhow::anyhow!("Invalid skill path"))?;

    // Create output directory if it doesn't exist
    std::fs::create_dir_all(output_path).context("Failed to create output directory")?;

    let zip_path = output_path.join(format!("{}.zip", skill_name));
    let zip_file =
        File::create(&zip_path).context(format!("Failed to create zip file: {:?}", zip_path))?;

    let mut zip = ZipWriter::new(zip_file);

    // Walk through all files in the skill directory
    for entry in WalkDir::new(skill_path).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        let relative_path = path
            .strip_prefix(skill_path)
            .context("Failed to get relative path")?;

        if path.is_dir() {
            // Create a directory entry in the zip
            let dir_name = format!("{}/", relative_path.display());
            zip.start_file(&dir_name, Default::default())
                .context("Failed to add directory to zip")?;
        } else if path.is_file() {
            // Add file to zip
            let file_path = relative_path.display().to_string();
            zip.start_file(file_path, Default::default())
                .context("Failed to add file to zip")?;

            let mut file =
                std::fs::File::open(path).context(format!("Failed to open file: {:?}", path))?;
            let mut contents = Vec::new();
            std::io::Read::read_to_end(&mut file, &mut contents)
                .context("Failed to read file contents")?;

            zip.write_all(&contents)
                .context("Failed to write file contents to zip")?;
        }
    }

    zip.finish().context("Failed to finalize zip file")?;

    Ok(zip_path)
}
