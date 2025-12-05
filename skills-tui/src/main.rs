use anyhow::Result;
use crossterm::{
    event::{self, DisableMouseCapture, EnableMouseCapture, Event, KeyCode},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::backend::CrosstermBackend;
use ratatui::prelude::*;
use skills_tui::{
    discover_skills, discover_skills_from_sources, install_to_claude_code, ui, ui::AppState,
    zip_skill, FeedManager, Skill,
};
use std::io;
use std::path::PathBuf;

fn main() -> Result<()> {
    // Parse command line arguments
    let args: Vec<String> = std::env::args().collect();

    if args.len() > 1 && (args[1] == "--help" || args[1] == "-h") {
        print_help();
        return Ok(());
    }

    // Check for --update-feeds flag
    let update_feeds = args.iter().any(|a| a == "--update-feeds" || a == "-u");
    
    // Check for --feeds-config flag
    let feeds_config_path = args
        .iter()
        .position(|a| a == "--feeds-config")
        .and_then(|i| args.get(i + 1))
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("feeds.json"));

    // Get skills path (first positional argument that doesn't start with -)
    let skills_path = args
        .iter()
        .skip(1)
        .find(|a| !a.starts_with('-') && *a != "feeds.json")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("."));

    if !skills_path.exists() {
        eprintln!("Error: Path does not exist: {:?}", skills_path);
        std::process::exit(1);
    }

    // Load skills from local directory and feeds
    let skills = load_skills(&skills_path, &feeds_config_path, update_feeds)?;

    if skills.is_empty() {
        println!("No skills found in {:?}", skills_path);
        println!("Ensure the directory contains folders with SKILL.md files");
        println!("\nTip: Use --update-feeds to fetch skills from configured git repositories");
        return Ok(());
    }

    // Setup TUI
    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    // Run the app
    let result = run_app(&mut terminal, skills, feeds_config_path);

    // Restore terminal
    disable_raw_mode()?;
    execute!(
        terminal.backend_mut(),
        LeaveAlternateScreen,
        DisableMouseCapture
    )?;
    terminal.show_cursor()?;

    result
}

/// Load skills from local directory and configured feeds
fn load_skills(
    local_path: &PathBuf,
    feeds_config_path: &PathBuf,
    update_feeds: bool,
) -> Result<Vec<Skill>> {
    // Try to load feed manager
    let feed_manager = FeedManager::new(feeds_config_path.clone()).ok();

    if let Some(ref manager) = feed_manager {
        // Update feeds if requested
        if update_feeds {
            println!("Updating feeds...");
            match manager.update_feeds() {
                Ok(results) => {
                    for (name, skills) in results {
                        println!("  {} - {} skills", name, skills.len());
                    }
                }
                Err(e) => {
                    eprintln!("Warning: Failed to update feeds: {}", e);
                }
            }
        }

        // Get all skills from all sources
        let sources = manager.get_all_skill_paths(Some(local_path))?;
        discover_skills_from_sources(sources)
    } else {
        // Fall back to local-only discovery
        discover_skills(local_path)
    }
}

fn run_app<B: Backend>(
    terminal: &mut Terminal<B>,
    skills: Vec<Skill>,
    feeds_config_path: PathBuf,
) -> Result<()> {
    let mut app_state = AppState::new(skills);

    loop {
        terminal.draw(|f| {
            ui::render(f, &app_state);
        })?;

        // Handle events
        if event::poll(std::time::Duration::from_millis(100))? {
            if let Event::Key(key) = event::read()? {
                match key.code {
                    KeyCode::Char('q') => break,
                    KeyCode::Char('c') if key.modifiers.contains(event::KeyModifiers::CONTROL) => {
                        break;
                    }
                    KeyCode::Up => app_state.move_up(),
                    KeyCode::Down => app_state.move_down(),
                    KeyCode::Char('i') => {
                        if let Some(skill) = app_state.selected_skill() {
                            match install_to_claude_code(skill.path.as_path(), None) {
                                Ok(path) => {
                                    app_state.status_message =
                                        format!("✓ Installed to: {}", path.display());
                                }
                                Err(e) => {
                                    app_state.status_message = format!("✗ Error: {}", e);
                                }
                            }
                        }
                    }
                    KeyCode::Char('z') => {
                        if let Some(skill) = app_state.selected_skill() {
                            let output_path = PathBuf::from("./downloads");
                            match zip_skill(skill.path.as_path(), &output_path) {
                                Ok(path) => {
                                    app_state.status_message =
                                        format!("✓ Zipped to: {}", path.display());
                                }
                                Err(e) => {
                                    app_state.status_message = format!("✗ Error: {}", e);
                                }
                            }
                        }
                    }
                    KeyCode::Char('f') => {
                        if app_state.filter.is_some() {
                            app_state.filter = None;
                            app_state.selected_index = 0;
                            app_state.status_message = "Filter cleared".to_string();
                        } else {
                            app_state.filter = Some(String::new());
                            app_state.status_message =
                                "Filter enabled (not fully implemented yet)".to_string();
                        }
                    }
                    KeyCode::Char('u') => {
                        // Update feeds
                        app_state.status_message = "Updating feeds...".to_string();
                        if let Ok(manager) = FeedManager::new(feeds_config_path.clone()) {
                            match manager.update_feeds() {
                                Ok(_) => {
                                    app_state.status_message = "✓ Feeds updated".to_string();
                                }
                                Err(e) => {
                                    app_state.status_message = format!("✗ Update failed: {}", e);
                                }
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
    }

    Ok(())
}

/// Prints help information
fn print_help() {
    println!("Skills TUI - Claude Skills Browser and Manager");
    println!();
    println!("USAGE:");
    println!("    skills-tui [OPTIONS] [SKILLS_PATH]");
    println!();
    println!("ARGUMENTS:");
    println!("    SKILLS_PATH           Path to directory containing skills (default: current directory)");
    println!();
    println!("OPTIONS:");
    println!("    -h, --help            Print help information");
    println!("    -u, --update-feeds    Update skills from configured git repositories");
    println!("    --feeds-config FILE   Path to feeds configuration file (default: feeds.json)");
    println!();
    println!("KEYBINDINGS:");
    println!("    ↑/↓            Navigate through skills");
    println!("    i              Install skill to Claude Code");
    println!("    d              Install skill to Claude Desktop (MCP)");
    println!("    z              Download skill as ZIP archive");
    println!("    f              Toggle filtering");
    println!("    u              Update feeds from git repositories");
    println!("    q              Quit the application");
    println!("    Ctrl+C         Quit the application");
    println!();
    println!("FEED CONFIGURATION:");
    println!("    Create a feeds.json file to configure git repository sources:");
    println!();
    println!("    {{");
    println!("      \"feeds\": [");
    println!("        {{");
    println!("          \"name\": \"official\",");
    println!("          \"url\": \"https://github.com/anthropics/skills.git\",");
    println!("          \"enabled\": true,");
    println!("          \"description\": \"Official Anthropic skills\"");
    println!("        }}");
    println!("      ],");
    println!("      \"cache_dir\": \".skill-cache\"");
    println!("    }}");
}
