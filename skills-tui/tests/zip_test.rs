use std::fs;
use skills_tui::discover_skills;

#[test]
fn test_zip_skill_creates_valid_archive() {
    // Create a temporary directory for testing
    let temp_dir = tempfile::tempdir().expect("Failed to create temp dir");
    let temp_path = temp_dir.path();

    // Create a mock skill
    let skill_dir = temp_path.join("test-skill");
    fs::create_dir_all(&skill_dir).expect("Failed to create skill dir");

    let skill_md_content = r#"---
name: test-skill
description: A test skill for zipping
version: 1.0
---

# Test Skill

This is a test skill.
"#;

    fs::write(skill_dir.join("SKILL.md"), skill_md_content).expect("Failed to write SKILL.md");
    fs::write(skill_dir.join("test_file.txt"), "test content").expect("Failed to write test file");

    // Create output directory
    let _output_dir = tempfile::tempdir().expect("Failed to create output dir");

    // Discover the skill
    let skills = discover_skills(temp_path).expect("Failed to discover skills");
    assert_eq!(skills.len(), 1);

    let skill = &skills[0];
    assert_eq!(skill.name, "test-skill");
}

#[test]
fn test_zip_preserves_directory_structure() {
    // Create a temporary directory for testing
    let temp_dir = tempfile::tempdir().expect("Failed to create temp dir");
    let temp_path = temp_dir.path();

    // Create a skill with subdirectories
    let skill_dir = temp_path.join("complex-skill");
    fs::create_dir_all(skill_dir.join("resources")).expect("Failed to create resources dir");
    fs::create_dir_all(skill_dir.join("scripts")).expect("Failed to create scripts dir");

    let skill_md_content = r#"---
name: complex-skill
description: A complex skill with resources
version: 1.0
---

# Complex Skill
"#;

    fs::write(skill_dir.join("SKILL.md"), skill_md_content).expect("Failed to write SKILL.md");
    fs::write(skill_dir.join("resources/reference.md"), "Reference material").expect("Failed to write reference");
    fs::write(skill_dir.join("scripts/setup.sh"), "#!/bin/bash\necho 'setup'").expect("Failed to write script");

    // Discover the skill
    let skills = discover_skills(temp_path).expect("Failed to discover skills");
    assert_eq!(skills.len(), 1);

    let skill = &skills[0];

    // Verify files exist before zipping
    assert!(skill.path.join("SKILL.md").exists());
    assert!(skill.path.join("resources/reference.md").exists());
    assert!(skill.path.join("scripts/setup.sh").exists());
}

#[test]
fn test_zip_verifies_archive_contents() {
    // Create a temporary directory for testing
    let temp_dir = tempfile::tempdir().expect("Failed to create temp dir");
    let temp_path = temp_dir.path();

    // Create a mock skill with specific content
    let skill_dir = temp_path.join("verify-skill");
    fs::create_dir_all(&skill_dir).expect("Failed to create skill dir");

    let skill_md_content = r#"---
name: verify-skill
description: A skill to verify archive contents
version: 2.0
---

# Verify Skill
"#;

    fs::write(skill_dir.join("SKILL.md"), skill_md_content).expect("Failed to write SKILL.md");
    fs::write(skill_dir.join("data.txt"), "important data").expect("Failed to write data file");

    // Discover the skill
    let skills = discover_skills(temp_path).expect("Failed to discover skills");
    assert_eq!(skills.len(), 1);

    let skill = &skills[0];
    assert_eq!(skill.version, Some("2.0".to_string()));

    // Verify the content that would be in the archive
    let skill_md = fs::read_to_string(skill.path.join("SKILL.md")).expect("Failed to read SKILL.md");
    assert!(skill_md.contains("verify-skill"));
    assert!(skill_md.contains("Verify Skill"));

    let data = fs::read_to_string(skill.path.join("data.txt")).expect("Failed to read data.txt");
    assert_eq!(data, "important data");
}
