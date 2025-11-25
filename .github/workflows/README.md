# GitHub Actions Workflows

This directory contains automated CI/CD workflows for the Claude Skills repository and the skills-tui application.

## Workflows Overview

### 1. Build and Test (`build.yml`)

**Triggers:** Push to main/develop/claude/* branches or PRs to main/develop

**What it does:**
- Runs comprehensive test suite on macOS, Windows, and Linux
- Builds optimized binaries for:
  - Linux (x86_64 GNU and musl)
  - macOS (x86_64 and ARM64/Apple Silicon)
  - Windows (x86_64 MSVC)
- Runs code quality checks:
  - **Clippy**: Rust linter for code quality
  - **Fmt**: Code formatting validation
  - **Coverage**: Code coverage analysis with codecov
- Uploads artifacts for each platform
- Creates GitHub releases automatically when tags are pushed (v*.*)

**Artifacts Generated:**
- `skills-tui-linux-x86_64`: Linux binary (GNU libc)
- `skills-tui-linux-musl-x86_64`: Linux binary (musl libc, fully static)
- `skills-tui-macos-x86_64`: Intel Mac binary
- `skills-tui-macos-aarch64`: Apple Silicon (M1/M2/M3) binary
- `skills-tui-windows-x86_64.exe`: Windows executable

**Download Artifacts:**
- Click "Actions" tab → Select workflow run → Download artifacts from "Artifacts" section
- Or download from GitHub Releases (for tagged releases)

### 2. WebAssembly Build (`wasm.yml`)

**Triggers:** Push to main/develop or PRs with changes to skills-tui

**What it does:**
- Builds skills-tui for WebAssembly target (`wasm32-unknown-unknown`)
- Generates wasm-pack bundles for web integration
- Uploads WebAssembly artifacts

**Note:** WebAssembly builds are for potential future web-based components. The TUI itself is terminal-based and doesn't run in browsers.

**Artifacts Generated:**
- `skills-tui-wasm`: WebAssembly build output and bindings

### 3. Documentation (`docs.yml`)

**Triggers:** Push to main/develop or PRs with changes to skills-tui

**What it does:**
- Generates Rust API documentation using `cargo doc`
- Builds with nightly toolchain for enhanced documentation features
- Deploys to GitHub Pages (on main branch only)
- Creates searchable API documentation

**Access Documentation:**
- GitHub Pages URL (set in repository settings)
- Or download "documentation" artifact

## Creating Releases

### Automatic Release Creation

To create a release with binaries:

1. Create a git tag in the format `v*.*.*` (e.g., `v0.1.0`):
   ```bash
   git tag -a v0.1.0 -m "Release version 0.1.0"
   git push origin v0.1.0
   ```

2. The build workflow will automatically:
   - Run all tests and builds
   - Create a GitHub Release
   - Attach compiled binaries for all platforms

### Manual Release Notes

To add/edit release notes:
1. Go to Releases page
2. Edit the auto-generated release
3. Add detailed changelog and instructions

## Performance Optimization

The workflows use several caching strategies:

- **Cargo Registry Cache**: Caches downloaded dependencies
- **Cargo Git Cache**: Caches git dependencies
- **Build Target Cache**: Caches compiled object files

This significantly reduces build time on subsequent runs.

## Environment Variables

Key environment variables used:

- `CARGO_TERM_COLOR=always`: Colorized output in logs
- `RUST_BACKTRACE=1`: Full backtrace on panics
- `RUSTDOCFLAGS=-D warnings`: Fail docs on warnings

## Troubleshooting

### Build Failures

**Linux musl build fails:**
- The workflow installs `musl-tools` automatically
- If this fails, check Ubuntu version compatibility

**macOS ARM64 build takes too long:**
- This is normal for cross-compilation
- Consider using native M-series runners if available

**Windows build fails with permission errors:**
- Usually temporary - re-run the workflow
- May need to clear cache if persistent

### Test Failures

**Tests fail on macOS/Windows but pass locally:**
- Line ending differences (CRLF vs LF)
- Path separator differences (/ vs \)
- Time zone or locale issues
- Platform-specific behavior

**Coverage upload fails:**
- Check that codecov.io is properly configured
- Verify GITHUB_TOKEN has correct permissions

## Configuration

### Modifying Workflows

To customize workflows:

1. Edit the `.yml` file in `.github/workflows/`
2. Commit to main or feature branch
3. Workflows use the `.yml` files from your current branch
4. Changes take effect immediately

### Disabling Workflows

To temporarily disable a workflow:
1. In the `.yml` file, comment out the `on:` section
2. Or delete the file
3. Or change `on:` to `on: {}` (never triggers)

### Adding New Targets

To build for additional platforms, edit `build.yml`:

```yaml
- os: ubuntu-latest
  target: aarch64-unknown-linux-gnu
  artifact_name: skills-tui
  asset_name: skills-tui-linux-aarch64
```

Common targets:
- `x86_64-unknown-linux-gnu`: Linux 64-bit
- `aarch64-unknown-linux-gnu`: Linux ARM64
- `x86_64-apple-darwin`: Intel Mac
- `aarch64-apple-darwin`: Apple Silicon Mac
- `x86_64-pc-windows-msvc`: Windows 64-bit
- `i686-pc-windows-msvc`: Windows 32-bit

## Security Considerations

- **GitHub Token**: Used for creating releases (automatically managed)
- **Codecov Token**: Optional, set in repository secrets for private repos
- **No secrets in logs**: All sensitive data is masked

## Future Enhancements

Potential additions to workflows:

- [ ] Dependency scanning and vulnerability checks
- [ ] Performance benchmarking
- [ ] Binary signing (code signing certificates)
- [ ] Docker image builds and publishing
- [ ] Release notes auto-generation from commits
- [ ] Integration testing with real skills
- [ ] Publish binaries to package managers (Homebrew, Chocolatey, etc.)

## Related Documentation

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Rust GitHub Actions](https://github.com/dtolnay/rust-toolchain)
- [Upload Artifact Action](https://github.com/actions/upload-artifact)
- [Create Release Action](https://github.com/softprops/action-gh-release)
