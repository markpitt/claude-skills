use crate::Skill;
use ratatui::{
    layout::{Alignment, Constraint, Direction, Layout, Rect},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, List, ListItem, Paragraph, Wrap},
    Frame,
};
use std::collections::HashMap;

/// Represents the current UI state
#[derive(Debug, Clone)]
pub struct AppState {
    pub skills: Vec<Skill>,
    pub selected_index: usize,
    pub filter: Option<String>,
    pub status_message: String,
    pub show_help: bool,
    pub scroll_position: u16,
}

impl AppState {
    pub fn new(skills: Vec<Skill>) -> Self {
        Self {
            skills,
            selected_index: 0,
            filter: None,
            status_message: "Ready".to_string(),
            show_help: false,
            scroll_position: 0,
        }
    }

    /// Get the filtered list of skills
    pub fn filtered_skills(&self) -> Vec<&Skill> {
        if let Some(filter) = &self.filter {
            self.skills
                .iter()
                .filter(|skill| {
                    skill.name.contains(filter) || skill.description.contains(filter)
                })
                .collect()
        } else {
            self.skills.iter().collect()
        }
    }

    /// Get the currently selected skill
    pub fn selected_skill(&self) -> Option<&Skill> {
        let filtered = self.filtered_skills();
        if self.selected_index < filtered.len() {
            filtered.get(self.selected_index).copied()
        } else {
            None
        }
    }

    /// Move selection up
    pub fn move_up(&mut self) {
        if self.selected_index > 0 {
            self.selected_index -= 1;
            self.scroll_position = 0;
        }
    }

    /// Move selection down
    pub fn move_down(&mut self) {
        let filtered_len = self.filtered_skills().len();
        if self.selected_index < filtered_len.saturating_sub(1) {
            self.selected_index += 1;
            self.scroll_position = 0;
        }
    }

    /// Get language statistics for filtering
    pub fn get_language_stats(&self) -> HashMap<String, usize> {
        let mut stats: HashMap<String, usize> = HashMap::new();

        for skill in &self.skills {
            // Try to detect language from skill name or path
            let lang = detect_language(&skill.name, &skill.path);
            *stats.entry(lang).or_insert(0) += 1;
        }

        stats
    }
}

/// Detects programming language from skill metadata
fn detect_language(name: &str, _path: &std::path::Path) -> String {
    let name_lower = name.to_lowercase();

    if name_lower.contains("rust") || name_lower.contains("rs") {
        "Rust".to_string()
    } else if name_lower.contains("python") || name_lower.contains("py") {
        "Python".to_string()
    } else if name_lower.contains("typescript") || name_lower.contains("javascript")
        || name_lower.contains("ts") || name_lower.contains("js")
    {
        "TypeScript".to_string()
    } else if name_lower.contains("go") {
        "Go".to_string()
    } else if name_lower.contains("csharp") || name_lower.contains("dotnet") {
        "C#".to_string()
    } else {
        "Other".to_string()
    }
}

/// Renders the entire UI
pub fn render(f: &mut Frame, state: &AppState) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints(
            [
                Constraint::Min(3),
                Constraint::Length(3),
            ]
            .as_ref(),
        )
        .split(f.size());

    // Main content area (top)
    let main_chunks = Layout::default()
        .direction(Direction::Horizontal)
        .constraints(
            [
                Constraint::Percentage(30),
                Constraint::Percentage(70),
            ]
            .as_ref(),
        )
        .split(chunks[0]);

    // Left pane: Skill list
    render_skill_list(f, state, main_chunks[0]);

    // Right pane: Skill details
    render_skill_details(f, state, main_chunks[1]);

    // Bottom pane: Status/Help
    render_status_bar(f, state, chunks[1]);
}

/// Renders the left pane with the skill list
fn render_skill_list(f: &mut Frame, state: &AppState, area: Rect) {
    let filtered = state.filtered_skills();
    let items: Vec<ListItem> = filtered
        .iter()
        .enumerate()
        .map(|(idx, skill)| {
            let is_selected = idx == state.selected_index;
            let style = if is_selected {
                Style::default()
                    .fg(Color::Yellow)
                    .add_modifier(Modifier::BOLD)
                    .bg(Color::DarkGray)
            } else {
                Style::default().fg(Color::White)
            };

            let prefix = if is_selected { "► " } else { "  " };
            ListItem::new(Span::styled(format!("{}{}", prefix, skill.name), style))
        })
        .collect();

    let title = if let Some(filter) = &state.filter {
        format!("Skills (filter: {})", filter)
    } else {
        "Skills".to_string()
    };

    let list = List::new(items)
        .block(
            Block::default()
                .title(title)
                .borders(Borders::ALL)
                .border_type(ratatui::widgets::BorderType::Rounded),
        )
        .style(Style::default().fg(Color::White));

    f.render_widget(list, area);
}

/// Renders the right pane with skill details
fn render_skill_details(f: &mut Frame, state: &AppState, area: Rect) {
    if let Some(skill) = state.selected_skill() {
        let details = format!(
            "Name: {}\nVersion: {}\nPath: {}\n\nDescription:\n{}",
            skill.name,
            skill.version.as_deref().unwrap_or("Unknown"),
            skill.path.display(),
            skill.description
        );

        let mut text = vec![];
        for line in details.lines() {
            text.push(Line::from(Span::raw(line)));
        }

        let paragraph = Paragraph::new(text)
            .block(
                Block::default()
                    .title("Details")
                    .borders(Borders::ALL)
                    .border_type(ratatui::widgets::BorderType::Rounded),
            )
            .style(Style::default().fg(Color::White))
            .alignment(Alignment::Left)
            .wrap(Wrap { trim: true });

        f.render_widget(paragraph, area);
    } else {
        let paragraph = Paragraph::new("No skills available")
            .block(
                Block::default()
                    .title("Details")
                    .borders(Borders::ALL)
                    .border_type(ratatui::widgets::BorderType::Rounded),
            )
            .style(Style::default().fg(Color::DarkGray));

        f.render_widget(paragraph, area);
    }
}

/// Renders the status/help bar at the bottom
fn render_status_bar(f: &mut Frame, state: &AppState, area: Rect) {
    let help_text = "↑↓: Navigate | i: Install | d: Desktop | z: Zip | f: Filter | q: Quit";

    let status_line = Line::from(vec![
        Span::styled(&state.status_message, Style::default().fg(Color::Green)),
        Span::raw(" | "),
        Span::styled(help_text, Style::default().fg(Color::Cyan)),
    ]);

    let paragraph = Paragraph::new(status_line)
        .block(
            Block::default()
                .borders(Borders::ALL)
                .border_type(ratatui::widgets::BorderType::Rounded),
        )
        .alignment(Alignment::Left)
        .style(Style::default().fg(Color::White).bg(Color::Black));

    f.render_widget(paragraph, area);
}
