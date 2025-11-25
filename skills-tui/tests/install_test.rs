use skills_tui::discover_skills;
use std::fs;

#[test]
fn test_install_to_claude_code_copies_skill_files() {
    // Create a temporary directory for testing
    let temp_dir = tempfile::tempdir().expect("Failed to create temp dir");
    let temp_path = temp_dir.path();

    // Create a mock skill
    let skill_dir = temp_path.join("test-skill");
    fs::create_dir_all(&skill_dir).expect("Failed to create skill dir");

    let skill_md_content = r#"---
name: test-skill
description: A test skill for installation
version: 1.0
---

# Test Skill

This is a test skill.
"#;

    fs::write(skill_dir.join("SKILL.md"), skill_md_content).expect("Failed to write SKILL.md");
    fs::write(skill_dir.join("test_file.txt"), "test content").expect("Failed to write test file");

    // Create a mock destination directory
    let _dest_dir = tempfile::tempdir().expect("Failed to create dest temp dir");

    // Discover the skill
    let skills = discover_skills(temp_path).expect("Failed to discover skills");
    assert_eq!(skills.len(), 1);

    let skill = &skills[0];
    assert_eq!(skill.name, "test-skill");
    assert_eq!(skill.path, skill_dir);

    // Verify the skill files exist
    assert!(skill.path.join("SKILL.md").exists());
    assert!(skill.path.join("test_file.txt").exists());
}

#[test]
fn test_install_preserves_skill_structure() {
    // Create a temporary directory for testing
    let temp_dir = tempfile::tempdir().expect("Failed to create temp dir");
    let temp_path = temp_dir.path();

    // Create a skill with subdirectories
    let skill_dir = temp_path.join("complex-skill");
    fs::create_dir_all(skill_dir.join("resources")).expect("Failed to create resources dir");
    fs::create_dir_all(skill_dir.join("templates")).expect("Failed to create templates dir");
    fs::create_dir_all(skill_dir.join("scripts")).expect("Failed to create scripts dir");

    let skill_md_content = r#"---
name: complex-skill
description: A complex skill with resources
version: 1.0
---

# Complex Skill
"#;

    fs::write(skill_dir.join("SKILL.md"), skill_md_content).expect("Failed to write SKILL.md");
    fs::write(
        skill_dir.join("resources/reference.md"),
        "Reference material",
    )
    .expect("Failed to write reference");
    fs::write(skill_dir.join("templates/form.yaml"), "template: form")
        .expect("Failed to write template");
    fs::write(skill_dir.join("scripts/setup.sh"), "#!/bin/bash").expect("Failed to write script");

    // Discover the skill
    let skills = discover_skills(temp_path).expect("Failed to discover skills");
    assert_eq!(skills.len(), 1);

    let skill = &skills[0];
    assert_eq!(skill.name, "complex-skill");

    // Verify all structure is present
    assert!(skill.path.join("SKILL.md").exists());
    assert!(skill.path.join("resources/reference.md").exists());
    assert!(skill.path.join("templates/form.yaml").exists());
    assert!(skill.path.join("scripts/setup.sh").exists());

    // Verify file contents
    let ref_content = fs::read_to_string(skill.path.join("resources/reference.md")).unwrap();
    assert_eq!(ref_content, "Reference material");
}
