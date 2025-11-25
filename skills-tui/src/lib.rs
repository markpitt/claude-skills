pub mod skill;
pub mod install;
pub mod zip_handler;
pub mod ui;

pub use skill::{Skill, discover_skills};
pub use install::{install_to_claude_code, install_to_claude_desktop, get_claude_code_skills_dir, InstallError};
pub use zip_handler::zip_skill;
