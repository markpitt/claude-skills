pub mod feed;
pub mod install;
pub mod skill;
pub mod ui;
pub mod zip_handler;

pub use feed::{Feed, FeedManager, FeedsConfig};
pub use install::{
    get_claude_code_skills_dir, install_to_claude_code, install_to_claude_desktop, InstallError,
};
pub use skill::{discover_skills, discover_skills_from_sources, Skill};
pub use zip_handler::zip_skill;
