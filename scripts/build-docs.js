#!/usr/bin/env node
/**
 * Build script for Claude Skills documentation website
 * 
 * Generates a static site from README.md files in the skills directory
 */

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '..', 'skills');
const DOCS_DIR = path.join(__dirname, '..', 'docs');
const TEMPLATE_DIR = path.join(__dirname, '..', 'docs', '_templates');

// Ensure docs directory exists
if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
}

/**
 * Parse YAML frontmatter from markdown content
 */
function parseFrontmatter(content) {
    const lines = content.split('\n');
    if (lines[0].trim() !== '---') {
        return { metadata: {}, content };
    }
    
    let endIndex = -1;
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '---') {
            endIndex = i;
            break;
        }
    }
    
    if (endIndex === -1) {
        return { metadata: {}, content };
    }
    
    const frontmatter = lines.slice(1, endIndex).join('\n');
    const metadata = {};
    
    frontmatter.split('\n').forEach(line => {
        const match = line.match(/^(\w+):\s*(.*)$/);
        if (match) {
            metadata[match[1]] = match[2].replace(/^["']|["']$/g, '');
        }
    });
    
    const body = lines.slice(endIndex + 1).join('\n');
    return { metadata, content: body };
}

/**
 * Convert markdown to HTML (basic conversion)
 */
function markdownToHtml(markdown) {
    let html = markdown
        // Code blocks
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Headers
        .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        // Bold and italic
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        // Lists
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        // Tables (basic)
        .replace(/^\|(.+)\|$/gm, (match, content) => {
            const cells = content.split('|').map(c => c.trim());
            return '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
        })
        // Paragraphs
        .replace(/\n\n/g, '</p><p>');
    
    // Wrap consecutive list items
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    
    // Wrap in paragraphs
    html = '<p>' + html + '</p>';
    
    return html;
}

/**
 * Discover all skills and their metadata
 */
function discoverSkills() {
    const skills = [];
    
    if (!fs.existsSync(SKILLS_DIR)) {
        console.log('Skills directory not found:', SKILLS_DIR);
        return skills;
    }
    
    const dirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory());
    
    for (const dir of dirs) {
        const skillPath = path.join(SKILLS_DIR, dir.name);
        const skillMdPath = path.join(skillPath, 'SKILL.md');
        
        if (fs.existsSync(skillMdPath)) {
            const content = fs.readFileSync(skillMdPath, 'utf8');
            const { metadata, content: body } = parseFrontmatter(content);
            
            // Check for README.md in the skill directory
            const readmePath = path.join(skillPath, 'README.md');
            let readme = null;
            if (fs.existsSync(readmePath)) {
                readme = fs.readFileSync(readmePath, 'utf8');
            }
            
            skills.push({
                name: metadata.name || dir.name,
                description: metadata.description || '',
                version: metadata.version || '1.0.0',
                path: dir.name,
                content: body,
                readme
            });
        }
    }
    
    return skills.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Generate the main index page
 */
function generateIndexPage(skills) {
    const skillCards = skills.map(skill => `
        <div class="skill-card">
            <h3><a href="skills/${skill.path}.html">${skill.name}</a></h3>
            <span class="version">v${skill.version}</span>
            <p>${skill.description.substring(0, 200)}${skill.description.length > 200 ? '...' : ''}</p>
        </div>
    `).join('\n');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude Skills Repository</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1>🧠 Claude Skills Repository</h1>
        <p>A collection of modular skills that extend Claude's capabilities</p>
    </header>
    
    <nav>
        <a href="index.html">Home</a>
        <a href="https://github.com/owner/claude-skills">GitHub</a>
        <a href="getting-started.html">Getting Started</a>
    </nav>
    
    <main>
        <section class="hero">
            <h2>What are Claude Skills?</h2>
            <p>Claude Skills are modular capabilities that extend Claude's functionality through organized directories containing instructions, scripts, and resources. They teach Claude how to complete specific repeatable tasks.</p>
        </section>
        
        <section class="skills-grid">
            <h2>Available Skills (${skills.length})</h2>
            <div class="grid">
                ${skillCards}
            </div>
        </section>
        
        <section class="quick-start">
            <h2>Quick Start</h2>
            <div class="code-block">
                <pre><code># Install a skill to Claude Code
cp -r skills/skill-name ~/.claude/skills/

# Or for project-level access
cp -r skills/skill-name .claude/skills/</code></pre>
            </div>
        </section>
    </main>
    
    <footer>
        <p>Built with ❤️ for the Claude community</p>
        <p><a href="https://github.com/owner/claude-skills">Contribute on GitHub</a></p>
    </footer>
</body>
</html>`;
}

/**
 * Generate a skill detail page
 */
function generateSkillPage(skill) {
    const contentHtml = markdownToHtml(skill.content);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${skill.name} - Claude Skills</title>
    <link rel="stylesheet" href="../style.css">
</head>
<body>
    <header>
        <h1>${skill.name}</h1>
        <span class="version">Version ${skill.version}</span>
    </header>
    
    <nav>
        <a href="../index.html">← Back to Skills</a>
        <a href="https://github.com/owner/claude-skills/tree/main/skills/${skill.path}">View Source</a>
    </nav>
    
    <main>
        <section class="description">
            <p>${skill.description}</p>
        </section>
        
        <section class="content">
            ${contentHtml}
        </section>
        
        <section class="installation">
            <h2>Installation</h2>
            <div class="code-block">
                <pre><code># Clone the repository
git clone https://github.com/owner/claude-skills.git

# Copy to your Claude skills directory
cp -r claude-skills/skills/${skill.path} ~/.claude/skills/</code></pre>
            </div>
        </section>
    </main>
    
    <footer>
        <p><a href="../index.html">← Back to all skills</a></p>
    </footer>
</body>
</html>`;
}

/**
 * Generate the stylesheet
 */
function generateStylesheet() {
    return `/* Claude Skills Documentation Stylesheet */

:root {
    --primary-color: #6366f1;
    --primary-dark: #4f46e5;
    --background: #0f172a;
    --surface: #1e293b;
    --text: #e2e8f0;
    --text-muted: #94a3b8;
    --border: #334155;
    --success: #22c55e;
    --code-bg: #0d1117;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    background: var(--background);
    color: var(--text);
    line-height: 1.6;
}

header {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
    padding: 2rem;
    text-align: center;
}

header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
}

header p {
    opacity: 0.9;
    font-size: 1.1rem;
}

.version {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.875rem;
}

nav {
    background: var(--surface);
    padding: 1rem 2rem;
    display: flex;
    gap: 2rem;
    border-bottom: 1px solid var(--border);
}

nav a {
    color: var(--text);
    text-decoration: none;
    transition: color 0.2s;
}

nav a:hover {
    color: var(--primary-color);
}

main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

section {
    margin-bottom: 3rem;
}

.hero {
    text-align: center;
    padding: 3rem 1rem;
    background: var(--surface);
    border-radius: 1rem;
    margin-bottom: 2rem;
}

.hero h2 {
    margin-bottom: 1rem;
    color: var(--primary-color);
}

.skills-grid h2 {
    margin-bottom: 1.5rem;
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
}

.skill-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    padding: 1.5rem;
    transition: transform 0.2s, border-color 0.2s;
}

.skill-card:hover {
    transform: translateY(-2px);
    border-color: var(--primary-color);
}

.skill-card h3 {
    margin-bottom: 0.5rem;
}

.skill-card h3 a {
    color: var(--text);
    text-decoration: none;
}

.skill-card h3 a:hover {
    color: var(--primary-color);
}

.skill-card .version {
    display: inline-block;
    margin-bottom: 0.75rem;
    background: var(--primary-color);
    font-size: 0.75rem;
}

.skill-card p {
    color: var(--text-muted);
    font-size: 0.9rem;
}

.code-block {
    background: var(--code-bg);
    border-radius: 0.5rem;
    overflow: hidden;
}

.code-block pre {
    padding: 1rem;
    overflow-x: auto;
}

.code-block code {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.9rem;
}

.content {
    background: var(--surface);
    padding: 2rem;
    border-radius: 0.75rem;
}

.content h1, .content h2, .content h3 {
    margin-top: 2rem;
    margin-bottom: 1rem;
    color: var(--primary-color);
}

.content h1:first-child {
    margin-top: 0;
}

.content p {
    margin-bottom: 1rem;
}

.content ul, .content ol {
    margin-bottom: 1rem;
    padding-left: 2rem;
}

.content li {
    margin-bottom: 0.5rem;
}

.content code {
    background: var(--code-bg);
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.875em;
}

.content pre code {
    display: block;
    padding: 1rem;
    overflow-x: auto;
}

.content table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
}

.content th, .content td {
    border: 1px solid var(--border);
    padding: 0.75rem;
    text-align: left;
}

.content th {
    background: var(--background);
}

footer {
    text-align: center;
    padding: 2rem;
    border-top: 1px solid var(--border);
    color: var(--text-muted);
}

footer a {
    color: var(--primary-color);
}

.description {
    font-size: 1.1rem;
    padding: 1.5rem;
    background: var(--surface);
    border-left: 4px solid var(--primary-color);
    border-radius: 0 0.5rem 0.5rem 0;
    margin-bottom: 2rem;
}

@media (max-width: 768px) {
    header h1 {
        font-size: 1.75rem;
    }
    
    nav {
        flex-wrap: wrap;
        gap: 1rem;
    }
    
    .grid {
        grid-template-columns: 1fr;
    }
}
`;
}

/**
 * Generate Getting Started page
 */
function generateGettingStartedPage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Getting Started - Claude Skills</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1>Getting Started</h1>
        <p>Learn how to use and create Claude Skills</p>
    </header>
    
    <nav>
        <a href="index.html">← Back to Skills</a>
        <a href="https://github.com/owner/claude-skills">GitHub</a>
    </nav>
    
    <main>
        <section class="content">
            <h2>What are Claude Skills?</h2>
            <p>Claude Skills are modular capabilities that extend Claude's functionality through organized directories containing instructions, scripts, and resources. They teach Claude how to complete specific repeatable tasks like creating documents with brand guidelines, analyzing data using organizational workflows, or automating personal tasks.</p>
            
            <h2>Installation</h2>
            
            <h3>Using Skills with Claude Code (CLI)</h3>
            <p>For project-level access:</p>
            <div class="code-block">
                <pre><code>cp -r skills/skill-name .claude/skills/</code></pre>
            </div>
            
            <p>For personal/global access:</p>
            <div class="code-block">
                <pre><code>cp -r skills/skill-name ~/.claude/skills/</code></pre>
            </div>
            
            <h3>Using Skills with Claude Desktop</h3>
            <ol>
                <li>Create a .zip file of the skill directory</li>
                <li>Open Claude Desktop → Settings → Capabilities → Skills</li>
                <li>Click "Upload skill" and select the .zip file</li>
            </ol>
            
            <h2>Creating Your Own Skill</h2>
            
            <h3>1. Create Directory Structure</h3>
            <div class="code-block">
                <pre><code>mkdir -p skills/my-skill/resources
mkdir -p skills/my-skill/scripts
touch skills/my-skill/SKILL.md</code></pre>
            </div>
            
            <h3>2. Write SKILL.md</h3>
            <p>Every skill must have a SKILL.md file with YAML frontmatter:</p>
            <div class="code-block">
                <pre><code>---
name: my-skill
description: Brief description of what the skill does
version: 1.0.0
---

# My Skill

Main skill instructions here...</code></pre>
            </div>
            
            <h3>3. Add Supporting Files (Optional)</h3>
            <ul>
                <li><code>resources/</code> - Reference documentation</li>
                <li><code>scripts/</code> - Executable utilities</li>
                <li><code>templates/</code> - Structured prompts or forms</li>
            </ul>
            
            <h2>Best Practices</h2>
            <ul>
                <li>Keep SKILL.md under 500 lines</li>
                <li>Use progressive disclosure (reference additional files)</li>
                <li>Include clear examples</li>
                <li>Write in third person for descriptions</li>
                <li>Use semantic versioning</li>
            </ul>
        </section>
    </main>
    
    <footer>
        <p><a href="index.html">← Back to all skills</a></p>
    </footer>
</body>
</html>`;
}

/**
 * Main build function
 */
function build() {
    console.log('Building Claude Skills documentation site...\n');
    
    // Discover skills
    const skills = discoverSkills();
    console.log(`Found ${skills.length} skills\n`);
    
    // Create skills subdirectory
    const skillsDocsDir = path.join(DOCS_DIR, 'skills');
    if (!fs.existsSync(skillsDocsDir)) {
        fs.mkdirSync(skillsDocsDir, { recursive: true });
    }
    
    // Generate index page
    const indexHtml = generateIndexPage(skills);
    fs.writeFileSync(path.join(DOCS_DIR, 'index.html'), indexHtml);
    console.log('✓ Generated index.html');
    
    // Generate skill pages
    for (const skill of skills) {
        const skillHtml = generateSkillPage(skill);
        fs.writeFileSync(path.join(skillsDocsDir, `${skill.path}.html`), skillHtml);
        console.log(`✓ Generated skills/${skill.path}.html`);
    }
    
    // Generate stylesheet
    const stylesheet = generateStylesheet();
    fs.writeFileSync(path.join(DOCS_DIR, 'style.css'), stylesheet);
    console.log('✓ Generated style.css');
    
    // Generate getting started page
    const gettingStarted = generateGettingStartedPage();
    fs.writeFileSync(path.join(DOCS_DIR, 'getting-started.html'), gettingStarted);
    console.log('✓ Generated getting-started.html');
    
    console.log('\n✅ Build complete!');
    console.log(`   Output: ${DOCS_DIR}`);
}

// Run build
build();
