use anyhow::Result;
use crossterm::{
    event::{self, DisableMouseCapture, EnableMouseCapture, Event, KeyCode},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::backend::CrosstermBackend;
use ratatui::prelude::*;
use skills_tui::{discover_skills, install_to_claude_code, ui, ui::AppState, zip_skill};
use std::io;
use std::path::PathBuf;

fn main() -> Result<()> {
    // Parse command line arguments
    let args: Vec<String> = std::env::args().collect();

    if args.len() > 1 && (args[1] == "--help" || args[1] == "-h") {
        print_help();
        return Ok(());
    }

    // Discover skills from current directory or provided path
    let skills_path = args
        .get(1)
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("."));

    if !skills_path.exists() {
        eprintln!("Error: Path does not exist: {:?}", skills_path);
        std::process::exit(1);
    }

    let skills = discover_skills(&skills_path).map_err(|e| {
        eprintln!("Error discovering skills: {}", e);
        e
    })?;

    if skills.is_empty() {
        println!("No skills found in {:?}", skills_path);
        println!("Ensure the directory contains folders with SKILL.md files");
        return Ok(());
    }

    // Setup TUI
    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    // Run the app
    let result = run_app(&mut terminal, skills);

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

fn run_app<B: Backend>(terminal: &mut Terminal<B>, skills: Vec<skills_tui::Skill>) -> Result<()> {
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
    println!("    skills-tui [SKILLS_PATH]");
    println!();
    println!("ARGUMENTS:");
    println!("    SKILLS_PATH    Path to directory containing skills (default: current directory)");
    println!();
    println!("OPTIONS:");
    println!("    -h, --help     Print help information");
    println!();
    println!("KEYBINDINGS:");
    println!("    ↑/↓            Navigate through skills");
    println!("    i              Install skill to Claude Code");
    println!("    d              Install skill to Claude Desktop (MCP)");
    println!("    z              Download skill as ZIP archive");
    println!("    f              Toggle filtering");
    println!("    q              Quit the application");
    println!("    Ctrl+C         Quit the application");
}
