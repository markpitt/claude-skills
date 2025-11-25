# Skills TUI - Claude Skills Browser and Manager

A production-ready Terminal User Interface (TUI) application for browsing, filtering, and managing Claude Skills. Built with Rust using Ratatui, Crossterm, and test-driven development (TDD).

## Features

- **Skill Discovery**: Automatically scans directories for skills (folders containing `SKILL.md`)
- **3-Pane Layout**:
  - **Left Pane**: Scrollable list of available skills
  - **Right Pane**: Detailed view of selected skill (name, version, description, path)
  - **Bottom Pane**: Status messages and keybinding help
- **Installation Options**:
  - **Claude Code**: Install directly to `~/.config/claude/skills/`
  - **Claude Desktop**: Prepare for MCP configuration
  - **Download as ZIP**: Create portable archives for sharing
- **Filtering**: Basic filtering by skill name or description
- **Navigation**: Up/Down arrows for skill selection
- **Error Handling**: User-friendly error messages with recovery options

## Building

### Prerequisites
- Rust 1.70+ (install from [rustup.rs](https://rustup.rs/))

### Build Steps

```bash
cd skills-tui
cargo build --release
```

The compiled binary will be at `target/release/skills-tui`

## Running

### From Repository
```bash
cargo run -- [SKILLS_PATH]
```

### Installed Binary
```bash
skills-tui [SKILLS_PATH]
```

### Examples
```bash
# Browse skills in current directory
skills-tui

# Browse skills in specific directory
skills-tui /path/to/skills

# Display help
skills-tui --help
```

## Keybindings

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate through skills |
| `i` | Install skill to Claude Code |
| `d` | Prepare for Claude Desktop installation |
| `z` | Download skill as ZIP archive |
| `f` | Toggle filtering |
| `q` | Quit application |
| `Ctrl+C` | Force quit |

## Development

### Testing
All functionality is built with Test-Driven Development (TDD):

```bash
cargo test                           # Run all tests
cargo test --test discovery_test     # Run specific test suite
```

### Test Coverage
- **Discovery Tests** (4 tests): Skill discovery and metadata parsing
- **Install Tests** (2 tests): File copying and directory structure preservation
- **Zip Tests** (3 tests): Archive creation and verification
- **Unit Tests** (3 tests): Frontmatter parsing and extraction

### Project Structure

```
skills-tui/
├── src/
│   ├── main.rs           # TUI event loop and CLI
│   ├── lib.rs            # Library exports
│   ├── skill.rs          # Skill discovery and parsing
│   ├── install.rs        # Installation logic
│   ├── zip_handler.rs    # ZIP archive creation
│   └── ui.rs             # Ratatui UI components
├── tests/
│   ├── discovery_test.rs # Skill discovery tests
│   ├── install_test.rs   # Installation tests
│   └── zip_test.rs       # ZIP archive tests
├── Cargo.toml            # Dependencies and metadata
└── README.md             # This file
```

## Dependencies

- **ratatui** (0.27): TUI rendering framework
- **crossterm** (0.27): Terminal backend
- **serde** / **serde_yaml**: YAML parsing for SKILL.md
- **zip** (0.6): ZIP archive creation
- **walkdir** (2.4): Directory traversal
- **anyhow** / **thiserror**: Error handling
- **directories** (5.0): Standard path resolution

## Installation Targets

### Claude Code (`~/.config/claude/skills/`)
Installed skills are immediately available to Claude Code CLI. Restart Claude Code to load new skills.

### Claude Desktop
For MCP-enabled skills, the app prepares the skill for integration with Claude Desktop. Manual configuration of `claude_desktop_config.json` is required.

### ZIP Distribution
Creates portable archives suitable for:
- Team distribution
- Version control
- Backup and archival
- Plugin integration

## Error Handling

The application handles common errors gracefully:
- Missing or invalid SKILL.md files
- Inaccessible file system paths
- Insufficient permissions for installation
- Malformed YAML frontmatter

Errors are displayed in the status bar with clear messages.

## Performance

- Efficient directory scanning with `walkdir`
- Lazy-loaded skill metadata
- Incremental rendering with Ratatui
- Minimal memory footprint

## Future Enhancements

- Advanced filtering (by language, version, etc.)
- Skill search with regex support
- MCP server validation
- Skill dependency resolution
- Automatic updates
- Skill rating/comments
- Integration with skill repositories

## License

MIT License - See repository for details

## Contributing

Contributions welcome! Please ensure:
- Tests pass: `cargo test`
- Code compiles: `cargo build`
- TDD approach for new features
- Clear commit messages
