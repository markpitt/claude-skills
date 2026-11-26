#!/usr/bin/env node
/**
 * Builds the claude-skills Pages site into docs/.
 *
 * The site is the index of the seven skill groups: a card per group linking to its repository,
 * every skill listed under its group, and a page per skill with its SKILL.md. It wears the
 * markpitt.dev brand, and site/style.css is the same stylesheet the brand's design of this site
 * uses.
 *
 * Where the skills come from, first match wins:
 *   SKILLS_ROOTS      skills directories separated by the path delimiter, no group attached
 *   SKILL_GROUPS_DIR  a directory holding one checkout per group, named by the group id. The
 *                     public twin's deploy-pages.yml checks the seven group repositories out
 *                     there, because the twin does not hold the skills itself.
 *   groups.json       each group's path, relative to this repository (the monorepo layout)
 *   skills/           the layout before the split
 */

const fs = require('fs');
const path = require('path');

const OWNER = 'markpitt';
const REPO = `${OWNER}/claude-skills`;
const REPO_URL = `https://github.com/${REPO}`;
// Release assets are published per skill by .github/workflows/release.yml.
// `latest` resolves at click time, so the site never pins a stale tag.
const DOWNLOAD_BASE = `${REPO_URL}/releases/latest/download`;
const SITE_HOME = 'https://markpitt.dev';

const REPO_ROOT = path.join(__dirname, '..');
const LOCAL_SKILLS_DIR = path.join(REPO_ROOT, 'skills');
const GROUPS_FILE = path.join(REPO_ROOT, 'groups.json');
const SITE_SRC = path.join(REPO_ROOT, 'site');
const DOCS_DIR = path.join(REPO_ROOT, 'docs');

const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The groups in groups.json, each with the directory that holds its skills. */
function loadGroups() {
    if (!fs.existsSync(GROUPS_FILE)) return [];
    const { groups } = JSON.parse(fs.readFileSync(GROUPS_FILE, 'utf8'));
    const base = (process.env.SKILL_GROUPS_DIR || '').trim();
    return groups.map(g => ({
        ...g,
        repoUrl: `https://github.com/${g.public_repo}`,
        skillsRoot: base
            ? path.resolve(base, g.id, 'skills')
            : path.resolve(REPO_ROOT, g.path, 'skills'),
    }));
}

/** Every skills directory with the group it belongs to (null when there is none). */
function skillsRoots(groups) {
    const override = (process.env.SKILLS_ROOTS || '').trim();
    if (override) {
        return override.split(path.delimiter).filter(Boolean).map(p => ({ root: path.resolve(p), group: null }));
    }
    if (!groups.length) return [{ root: LOCAL_SKILLS_DIR, group: null }];
    const roots = groups.map(g => ({ root: g.skillsRoot, group: g }));
    if (fs.existsSync(LOCAL_SKILLS_DIR) && fs.readdirSync(LOCAL_SKILLS_DIR, { withFileTypes: true })
        .some(d => d.isDirectory() && fs.existsSync(path.join(LOCAL_SKILLS_DIR, d.name, 'SKILL.md')))) {
        roots.push({ root: LOCAL_SKILLS_DIR, group: null });
    }
    return roots;
}

/** YAML frontmatter, with one level of nesting for `metadata:`. */
function parseFrontmatter(content) {
    const lines = content.split('\n');
    if (lines[0].trim() !== '---') return { metadata: {}, content };
    const endIndex = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
    if (endIndex === -1) return { metadata: {}, content };

    const metadata = {};
    const nested = {};
    let currentBlock = null;
    let folding = null;
    for (const line of lines.slice(1, endIndex)) {
        // A folded or literal scalar (`description: >`) continues on indented lines.
        if (folding && /^\s+\S/.test(line)) {
            metadata[folding] = (metadata[folding] ? metadata[folding] + ' ' : '') + line.trim();
            continue;
        }
        folding = null;
        // One level of nesting is enough: `metadata:` is the only mapping the spec defines,
        // and version lives under it rather than at the top level.
        const child = line.match(/^\s+([\w-]+):\s*(.*)$/);
        if (child && currentBlock) {
            nested[currentBlock] = nested[currentBlock] || {};
            nested[currentBlock][child[1]] = child[2].replace(/^["']|["']$/g, '');
            continue;
        }
        // Hyphenated keys matter: `allowed-tools` is in the spec allowlist.
        const match = line.match(/^([\w-]+):\s*(.*)$/);
        if (match) {
            const value = match[2].replace(/^["']|["']$/g, '');
            if (/^[>|][-+]?$/.test(value)) { folding = match[1]; metadata[match[1]] = ''; currentBlock = null; continue; }
            currentBlock = value === '' ? match[1] : null;
            metadata[match[1]] = value;
        }
    }
    metadata.nested = nested;
    return { metadata, content: lines.slice(endIndex + 1).join('\n') };
}

/* Syntax highlighting.
 *
 * A small tokenizer rather than a dependency, so the build stays `node scripts/build-docs.js` with
 * nothing to install. It knows comments, strings, numbers and keywords, which is all the brand's
 * code mapping colours (personal-brand products.md, "Code and editors"): keywords in accent-text,
 * strings in success, numbers in warning, comments in muted, everything else in ink. Every piece of
 * text is escaped on the way out, so a file that holds HTML is shown and never run.
 */
const words = (s) => new Set(s.split(/\s+/).filter(Boolean));
const C_COMMENTS = { line: ['//'], block: [['/*', '*/']] };
const JS_WORDS = 'const let var function return if else for while do switch case default break continue new class extends import export from as async await try catch finally throw typeof instanceof in of this super null undefined true false void delete yield static get set';
const LANGS = {
    python: { line: ['#'], strings: ['"""', "'''", '"', "'"], keywords: words('False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case self') },
    bash: { line: ['#'], hashAfterSpace: true, strings: ['"', "'"], multiline: ['"', "'"], rawSingle: true, keywords: words('if then else elif fi case esac for while until do done in function return local export readonly declare unset shift exit break continue source trap select') },
    javascript: { ...C_COMMENTS, strings: ['"', "'", '`'], multiline: ['`'], keywords: words(JS_WORDS) },
    typescript: { ...C_COMMENTS, strings: ['"', "'", '`'], multiline: ['`'], keywords: words(`${JS_WORDS} interface type enum implements private public protected readonly declare namespace abstract keyof satisfies is any unknown never string number boolean`) },
    csharp: { ...C_COMMENTS, strings: ['"""', '"', "'"], keywords: words('abstract as async await base bool break byte case catch char class const continue decimal default delegate do double else enum event explicit extern false finally fixed float for foreach get goto if implicit in init int interface internal is lock long namespace new null object operator out override params private protected public readonly record ref required return sbyte sealed set short sizeof static string struct switch this throw true try typeof uint ulong unchecked unsafe ushort using var virtual void volatile when where while with yield') },
    rust: { ...C_COMMENTS, strings: ['"'], multiline: ['"'], keywords: words('as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while') },
    go: { ...C_COMMENTS, strings: ['"', '`', "'"], multiline: ['`'], keywords: words('break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var nil true false') },
    dart: { ...C_COMMENTS, strings: ['"""', "'''", '"', "'"], keywords: words('abstract as async await break case catch class const continue default do else enum extends false final finally for if implements import in is late library new null required return static super switch this throw true try var void while with yield') },
    c: { ...C_COMMENTS, strings: ['"', "'"], keywords: words('auto break case char const continue default do double else enum extern float for goto if inline int long register return short signed sizeof static struct switch typedef union unsigned void volatile while bool true false NULL') },
    json: { ...C_COMMENTS, strings: ['"'], keywords: words('true false null') },
    yaml: { line: ['#'], hashAfterSpace: true, strings: ['"', "'"], quoteAfterBoundary: true, keywords: words('true false null yes no on off') },
    toml: { line: ['#'], strings: ['"""', "'''", '"', "'"], keywords: words('true false') },
    ini: { line: ['#', ';'], strings: [], keywords: words('') },
    powershell: { line: ['#'], block: [['<#', '#>']], strings: ['"', "'"], multiline: ['"', "'"], ignoreCase: true, keywords: words('begin break catch class continue data do dynamicparam else elseif end enum exit filter finally for foreach from function if in param process return switch throw trap try until using while') },
};
const LANG_ALIASES = {
    sh: 'bash', shell: 'bash', zsh: 'bash', console: 'bash', py: 'python', python3: 'python',
    js: 'javascript', mjs: 'javascript', node: 'javascript', ts: 'typescript', tsx: 'typescript',
    cs: 'csharp', 'c#': 'csharp', rs: 'rust', golang: 'go', yml: 'yaml', jsonc: 'json', json5: 'json',
    ps1: 'powershell', pwsh: 'powershell', ps: 'powershell', cpp: 'c', 'c++': 'c', h: 'c',
    conf: 'ini', systemd: 'ini',
};
const LANG_LABELS = {
    python: 'Python', bash: 'Bash', javascript: 'JavaScript', typescript: 'TypeScript', csharp: 'C#',
    rust: 'Rust', go: 'Go', dart: 'Dart', c: 'C', json: 'JSON', yaml: 'YAML', toml: 'TOML', ini: 'INI',
    powershell: 'PowerShell', markdown: 'Markdown', text: 'Plain text',
};
const NUMBER = /0[xXbBoO][\da-fA-F_]+|\d[\d_]*(\.\d+)?([eE][+-]?\d+)?/y;
const IDENT = /[A-Za-z_$@][\w$]*/y;

function highlight(code, lang) {
    const spec = LANGS[LANG_ALIASES[lang] || lang];
    if (!spec) return esc(code);
    const out = [];
    let plain = '';
    const flush = () => { if (plain) { out.push(esc(plain)); plain = ''; } };
    // A token is wrapped line by line, so a span never crosses a line break.
    const token = (cls, text) => {
        flush();
        out.push(text.split('\n').map(t => (t ? `<span class="tk-${cls}">${esc(t)}</span>` : '')).join('\n'));
    };
    const n = code.length;
    let i = 0;
    scan: while (i < n) {
        const prev = i ? code[i - 1] : '\n';
        for (const [open, close] of spec.block || []) {
            if (code.startsWith(open, i)) {
                const end = code.indexOf(close, i + open.length);
                const stop = end < 0 ? n : end + close.length;
                token('c', code.slice(i, stop)); i = stop; continue scan;
            }
        }
        for (const marker of spec.line || []) {
            if (code.startsWith(marker, i) && !(spec.hashAfterSpace && marker === '#' && !/\s/.test(prev))) {
                const end = code.indexOf('\n', i);
                const stop = end < 0 ? n : end;
                token('c', code.slice(i, stop)); i = stop; continue scan;
            }
        }
        for (const q of spec.strings) {
            if (!code.startsWith(q, i) || (spec.quoteAfterBoundary && /\w/.test(prev))) continue;
            let j = i + q.length;
            const raw = spec.rawSingle && q === "'";
            const multiline = q.length === 3 || (spec.multiline || []).includes(q);
            while (j < n) {
                if (code[j] === '\\' && !raw) { j += 2; continue; }
                if (code.startsWith(q, j)) { j += q.length; break; }
                if (code[j] === '\n' && !multiline) break;
                j++;
            }
            token('s', code.slice(i, Math.min(j, n))); i = Math.min(j, n); continue scan;
        }
        if (/\d/.test(code[i]) && !/[\w$]/.test(prev)) {
            NUMBER.lastIndex = i;
            const m = NUMBER.exec(code);
            if (m) { token('n', m[0]); i += m[0].length; continue; }
        }
        if (/[A-Za-z_$@]/.test(code[i]) && !/[\w$]/.test(prev)) {
            IDENT.lastIndex = i;
            const word = IDENT.exec(code)[0];
            const key = spec.ignoreCase ? word.toLowerCase() : word;
            // `obj.type` is a property, not the keyword.
            if (prev !== '.' && spec.keywords.has(key)) token('k', word);
            else plain += word;
            i += word.length;
            continue;
        }
        plain += code[i++];
    }
    flush();
    return out.join('');
}

/**
 * Inline markdown: code, links, bold and italic. Text is escaped first.
 *
 * `links` says where a relative link goes. It is either a base URL that relative links are joined
 * to, or an object with `href(target)` (a URL, or null to drop the link and keep its text) and an
 * optional `code(text)`, which turns a code span naming one of the skill's files into a link to it.
 */
function inline(text, links = '') {
    const ctx = typeof links === 'string'
        ? { href: (h) => (links ? `${links}/${h.replace(/^\.\//, '')}` : null) }
        : links;
    const codes = [];
    let s = text.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
    s = esc(s)
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
            // A code span inside a link label stays plain code, so links never nest.
            label = label.replace(/\u0000(\d+)\u0000/g, '\u0001$1\u0001');
            const external = /^(https?:|mailto:|#)/.test(href);
            if (external) return `<a href="${href}">${label}</a>`;
            const target = ctx.href(href.replace(/&amp;/g, '&'));
            return target ? `<a href="${esc(target)}">${label}</a>` : label;
        })
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^\w*])\*([^*\s][^*]*?)\*(?!\w)/g, '$1<em>$2</em>');
    return s
        .replace(/\u0001(\d+)\u0001/g, (_, i) => `<code>${esc(codes[+i])}</code>`)
        .replace(/\u0000(\d+)\u0000/g, (_, i) => {
            const url = ctx.code && ctx.code(codes[+i]);
            return url ? `<a href="${esc(url)}"><code>${esc(codes[+i])}</code></a>` : `<code>${esc(codes[+i])}</code>`;
        });
}

/**
 * Markdown to HTML for SKILL.md bodies and the skill's own markdown files: headings, paragraphs,
 * lists, fenced code, tables and block quotes. Code is escaped, so a skill that shows HTML cannot
 * break the page. `links` is as for `inline`.
 */
function markdownToHtml(markdown, links = '') {
    const base = links;
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const out = [];
    let i = 0;
    const isBlockStart = (l) => /^(#{1,6}\s|```|>\s?|\s*[-*]\s|\s*\d+[.)]\s|\|)/.test(l);
    while (i < lines.length) {
        const line = lines[i];
        if (!line.trim()) { i++; continue; }
        const fence = line.match(/^```\s*([\w+-]*)/);
        if (fence) {
            const body = [];
            i++;
            while (i < lines.length && !/^```/.test(lines[i])) body.push(lines[i++]);
            i++;
            const lang = fence[1].toLowerCase();
            out.push(`<pre><code${lang ? ` class="language-${esc(lang)}"` : ''}>${highlight(body.join('\n'), lang)}</code></pre>`);
            continue;
        }
        const heading = line.match(/^(#{1,6})\s+(.*)$/);
        if (heading) {
            // The page's own h1 is the skill name, so SKILL.md headings start at h2.
            const level = Math.min(6, heading[1].length + 1);
            out.push(`<h${level}>${inline(heading[2].replace(/\s+#+\s*$/, ''), base)}</h${level}>`);
            i++;
            continue;
        }
        if (/^\|/.test(line)) {
            const rows = [];
            while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
            const cells = (r) => r.replace(/^\||\|\s*$/g, '').split('|').map(c => c.trim());
            const hasHead = rows.length > 1 && /^\|?\s*:?-{2,}/.test(rows[1]);
            const head = hasHead ? `<thead><tr>${cells(rows[0]).map(c => `<th>${inline(c, base)}</th>`).join('')}</tr></thead>` : '';
            const body = (hasHead ? rows.slice(2) : rows).map(r => `<tr>${cells(r).map(c => `<td>${inline(c, base)}</td>`).join('')}</tr>`).join('');
            out.push(`<div class="table-wrap"><table>${head}<tbody>${body}</tbody></table></div>`);
            continue;
        }
        if (/^>\s?/.test(line)) {
            const quote = [];
            while (i < lines.length && /^>\s?/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/, ''));
            out.push(`<blockquote><p>${inline(quote.join(' '), base)}</p></blockquote>`);
            continue;
        }
        const listItem = /^\s*([-*]|\d+[.)])\s+(.*)$/;
        if (listItem.test(line)) {
            const ordered = /^\s*\d/.test(line);
            const items = [];
            while (i < lines.length && (listItem.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
                const m = lines[i].match(listItem);
                if (m && !/^\s{2,}/.test(lines[i])) items.push(m[2]);
                else items[items.length - 1] += ' ' + lines[i].trim().replace(/^([-*]|\d+[.)])\s+/, '');
                i++;
            }
            const tag = ordered ? 'ol' : 'ul';
            const task = (it) => it.replace(/^\[( |x)\]\s+/i, (_, x) => (x.trim() ? '☑ ' : '☐ '));
            out.push(`<${tag}>${items.map(it => `<li>${inline(task(it), base)}</li>`).join('')}</${tag}>`);
            continue;
        }
        const para = [];
        while (i < lines.length && lines[i].trim() && !(para.length && isBlockStart(lines[i]))) para.push(lines[i++].trim());
        out.push(`<p>${inline(para.join(' '), base)}</p>`);
    }
    return out.join('\n');
}

/** The first sentence of a description, for the catalogue rows. */
function firstSentence(text, max = 180) {
    const m = text.match(/^(.+?[.!?])(\s|$)/);
    let s = (m ? m[1] : text).trim();
    if (s.length > max) s = s.slice(0, max).replace(/\s+\S*$/, '') + '…';
    return s;
}

/* Bundled files: everything in a skill's folder apart from SKILL.md, as its zip carries them.
 * The exclusions match scripts/package_skills.py, so the site lists what a download holds. */
const EXCLUDE_NAMES = new Set(['.DS_Store', 'Thumbs.db']);
const EXCLUDE_DIRS = new Set(['__pycache__', '.git']);
const EXT_LANG = {
    md: 'markdown', markdown: 'markdown', py: 'python', sh: 'bash', bash: 'bash', zsh: 'bash',
    js: 'javascript', mjs: 'javascript', cjs: 'javascript', ts: 'typescript', mts: 'typescript', tsx: 'typescript',
    cs: 'csharp', csx: 'csharp', rs: 'rust', go: 'go', dart: 'dart', c: 'c', h: 'c', cpp: 'c',
    json: 'json', jsonc: 'json', yml: 'yaml', yaml: 'yaml', toml: 'toml', ini: 'ini', service: 'ini',
    timer: 'ini', ps1: 'powershell', psm1: 'powershell', txt: 'text',
};

/** The language a file is shown in: by extension, then by its #! line, else plain text. */
function detectLanguage(rel, text) {
    const name = path.posix.basename(rel).replace(/\.example$/, '');
    const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
    if (EXT_LANG[ext]) return EXT_LANG[ext];
    const shebang = (text.match(/^#!(.*)/) || [])[1] || '';
    if (/\b(ba|z)?sh\b/.test(shebang)) return 'bash';
    if (/python/.test(shebang)) return 'python';
    if (/\bnode\b/.test(shebang)) return 'javascript';
    if (/dotnet/.test(shebang)) return 'csharp';
    if (/pwsh/.test(shebang)) return 'powershell';
    return 'text';
}

function bundledFiles(skillDir) {
    const files = [];
    const walk = (dir) => {
        for (const d of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
            const abs = path.join(dir, d.name);
            if (d.isDirectory()) { if (!EXCLUDE_DIRS.has(d.name)) walk(abs); continue; }
            if (!d.isFile() || EXCLUDE_NAMES.has(d.name) || d.name.endsWith('.pyc')) continue;
            const rel = path.relative(skillDir, abs).split(path.sep).join('/');
            if (rel === 'SKILL.md') continue;
            const bytes = fs.readFileSync(abs);
            const binary = bytes.subarray(0, 8000).includes(0);
            const text = binary ? '' : bytes.toString('utf8').replace(/\r\n/g, '\n');
            files.push({
                rel,
                size: bytes.length,
                binary,
                text,
                lang: binary ? 'binary' : detectLanguage(rel, text),
                lines: binary ? 0 : text.replace(/\n$/, '').split('\n').length,
            });
        }
    };
    walk(skillDir);
    return files;
}

const fileSize = (n) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`);

/** Where a skill's page, or one of its files' pages, sits below docs/skills/. */
const pagePath = (skill, rel) => (rel === 'SKILL.md' ? `${skill.path}.html` : `${skill.path}/${rel}.html`);

/** A link from the page in `fromDir` (relative to docs/skills/) to `target` (likewise). */
const relLink = (fromDir, target) => encodeURI(path.posix.relative(`/${fromDir}`, `/${target}`));

/** The skill's folder in its repository on GitHub, to `blob` or `tree` level. */
function githubUrl(skill, rel = '', kind = 'tree') {
    const repo = skill.group ? skill.group.repoUrl : REPO_URL;
    return `${repo}/${kind}/main/skills/${skill.path}${rel ? `/${rel}` : ''}`;
}

/**
 * How links behave in markdown shown on the page for `fromRel` (SKILL.md or a bundled file).
 * A link to one of the skill's files opens its page here; a link to a sibling skill's SKILL.md
 * opens that skill's page; anything else in the repository goes to GitHub.
 */
function linkContext(skill, fromRel, skills) {
    const byRel = new Map(skill.files.map(f => [f.rel, f]));
    const here = path.posix.dirname(fromRel) === '.' ? '' : path.posix.dirname(fromRel);
    const fromDir = fromRel === 'SKILL.md' ? '' : path.posix.join(skill.path, here);
    const locate = (target) => {
        if (target === 'SKILL.md') return pagePath(skill, 'SKILL.md');
        if (byRel.has(target) && !byRel.get(target).binary) return pagePath(skill, target);
        const sibling = target.match(/^\.\.\/([^/]+)\/SKILL\.md$/);
        const other = sibling && skills.find(s => s.path === sibling[1] && s.group === skill.group);
        return other ? pagePath(other, 'SKILL.md') : null;
    };
    return {
        href(href) {
            const [rawPath, fragment] = href.split('#');
            let decoded = rawPath;
            try { decoded = decodeURI(rawPath); } catch (e) { /* keep it as written */ }
            const target = path.posix.normalize(path.posix.join(here, decoded)).replace(/\/$/, '');
            const local = locate(target);
            if (local) {
                const link = relLink(fromDir, local);
                return fragment ? `${link}#${fragment}` : link;
            }
            // Outside this site: the same path in the group repository, if it stays inside it.
            const inRepo = path.posix.normalize(`skills/${skill.path}/${target}`);
            if (inRepo.startsWith('..')) return null;
            const repo = skill.group ? skill.group.repoUrl : REPO_URL;
            const url = `${repo}/${/\.\w+$/.test(inRepo) ? 'blob' : 'tree'}/main/${inRepo}`;
            return fragment ? `${url}#${fragment}` : url;
        },
        code(text) {
            const t = text.trim();
            if (!/\//.test(t) && !/\.\w+$/.test(t)) return null;
            for (const target of [t.replace(/^\.\//, ''), path.posix.normalize(path.posix.join(here, t))]) {
                if (target !== fromRel && byRel.has(target) && !byRel.get(target).binary) {
                    return relLink(fromDir, pagePath(skill, target));
                }
            }
            return null;
        },
    };
}

/** The skill's files as a tree: SKILL.md, the other top-level files, then each folder. */
function fileTree(skill, currentRel) {
    const fromDir = currentRel === 'SKILL.md' ? '' : path.posix.join(skill.path, path.posix.dirname(currentRel));
    const item = (rel, label, size, binary) => {
        const link = binary
            ? `<a href="${esc(githubUrl(skill, rel, 'blob'))}">${esc(label)}</a>`
            : rel === currentRel
                ? `<a aria-current="page" href="${esc(relLink(fromDir, pagePath(skill, rel)))}">${esc(label)}</a>`
                : `<a href="${esc(relLink(fromDir, pagePath(skill, rel)))}">${esc(label)}</a>`;
        return `<li>${link}<span class="size num">${fileSize(size)}</span></li>`;
    };
    const top = [item('SKILL.md', 'SKILL.md', skill.skillMdSize, false)];
    const folders = new Map();
    for (const f of skill.files) {
        const dir = path.posix.dirname(f.rel);
        if (dir === '.') { top.push(item(f.rel, f.rel, f.size, f.binary)); continue; }
        if (!folders.has(dir)) folders.set(dir, []);
        folders.get(dir).push(item(f.rel, path.posix.basename(f.rel), f.size, f.binary));
    }
    const dirs = [...folders.keys()].sort().map(dir =>
        `<li class="dir"><span class="dir-name">${esc(dir)}/</span><ul>${folders.get(dir).join('')}</ul></li>`);
    return `<ul class="files">${top.join('')}${dirs.join('')}</ul>`;
}

function discoverSkills(groups) {
    const skills = [];
    for (const { root, group } of skillsRoots(groups)) {
        if (!fs.existsSync(root)) {
            console.log('Skills directory not found:', root);
            continue;
        }
        for (const d of fs.readdirSync(root, { withFileTypes: true })) {
            const skillMdPath = path.join(root, d.name, 'SKILL.md');
            if (!d.isDirectory() || !fs.existsSync(skillMdPath)) continue;
            const { metadata, content } = parseFrontmatter(fs.readFileSync(skillMdPath, 'utf8'));
            skills.push({
                name: metadata.name || d.name,
                description: metadata.description || '',
                version: metadata.nested?.metadata?.version || metadata.version || '',
                path: d.name,
                group,
                content,
                skillMdSize: fs.statSync(skillMdPath).size,
                files: bundledFiles(path.join(root, d.name)),
            });
        }
    }
    return skills.sort((a, b) => a.path.localeCompare(b.path));
}

function readAsset(name) {
    return fs.readFileSync(path.join(SITE_SRC, 'assets', name), 'utf8').trim();
}

const ICONS = {
    mark: () => readAsset('mark.svg').replace('<svg ', '<svg aria-hidden="true" focusable="false" '),
    wordmark: () => readAsset('wordmark.svg'),
    theme: (name) => readAsset(`theme-${name}.svg`).replace('<svg ', `<svg class="i-${name}" aria-hidden="true" focusable="false" `),
};

const THEME_SCRIPT = `<script>
(() => {
  // Dark first. The choice is system, light or dark, kept in local storage when it can be.
  const root = document.documentElement;
  const media = matchMedia('(prefers-color-scheme: light)');
  const order = ['system', 'light', 'dark'];
  let choice = 'system';
  try { choice = localStorage.getItem('theme') || 'system'; } catch (e) {}
  const apply = () => {
    root.dataset.theme = choice === 'system' ? (media.matches ? 'light' : 'dark') : choice;
    const b = document.querySelector('[data-theme-toggle]');
    if (!b) return;
    const next = order[(order.indexOf(choice) + 1) % order.length];
    const word = (t) => t[0].toUpperCase() + t.slice(1);
    b.dataset.themeState = choice;
    b.setAttribute('aria-label', 'Theme: ' + word(choice) + '. Press for ' + word(next) + '.');
  };
  apply();
  media.addEventListener('change', apply);
  addEventListener('DOMContentLoaded', () => {
    apply();
    document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
      choice = order[(order.indexOf(choice) + 1) % order.length];
      try { localStorage.setItem('theme', choice); } catch (e) {}
      apply();
    });
  });
})();
</script>`;

/** The page frame every page shares. `depth` is how far below docs/ the page sits. */
function layout({ title, description, depth = 0, current = '', body }) {
    const up = '../'.repeat(depth);
    const navLink = (href, label, key) =>
        `<a href="${up}${href}"${current === key ? ' aria-current="page"' : ''}>${label}</a>`;
    return `<!DOCTYPE html>
<html lang="en-GB" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
${description ? `<meta name="description" content="${esc(description)}">` : ''}
<link rel="icon" href="${up}favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${up}tokens.css">
<link rel="stylesheet" href="${up}style.css">
${THEME_SCRIPT}
</head>
<body class="cs-site">
<a class="skip" href="#main">Skip to the content</a>
<header class="cs-top">
  <div class="wrap">
    <span class="lockup">
      <a class="brand" href="${SITE_HOME}">${ICONS.mark()}${ICONS.wordmark()}</a>
      <span class="sep" aria-hidden="true">/</span>
      <a class="product" href="${up}index.html">claude-skills</a>
    </span>
    <nav aria-label="Site">
      ${navLink('index.html#groups', 'Groups', 'groups')}
      ${navLink('index.html#skills', 'All skills', 'skills')}
      ${navLink('getting-started.html', 'Install', 'install')}
      <a href="${REPO_URL}">GitHub</a>
      <button type="button" class="theme-toggle" data-theme-toggle data-theme-state="system" aria-label="Theme: System. Press for Light.">${ICONS.theme('system')}${ICONS.theme('light')}${ICONS.theme('dark')}</button>
    </nav>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="foot-bar">
  <div class="wrap">
    <span>By Mark Pitt · <a href="${SITE_HOME}">markpitt.dev</a></span>
    <span>Apache-2.0 · <a href="${REPO_URL}">${REPO}</a></span>
  </div>
</footer>
</body>
</html>
`;
}

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function skillRow(skill) {
    return `<li data-filter="${esc(`${skill.path} ${skill.description}`.toLowerCase())}">
            <a class="name" href="skills/${esc(skill.path)}.html">${esc(skill.path)}</a>
            <span class="desc">${esc(firstSentence(skill.description))}</span>
            <span class="ver">${skill.version ? `v${esc(skill.version)}` : ''}</span>
          </li>`;
}

const FILTER_SCRIPT = `<script>
(() => {
  // Progressive: without JavaScript the box stays hidden and every skill is listed.
  const box = document.querySelector('[data-filter-box]');
  const input = box.querySelector('input');
  const count = box.querySelector('output');
  const empty = document.querySelector('[data-filter-empty]');
  const rows = [...document.querySelectorAll('[data-filter]')];
  const total = rows.length;
  box.hidden = false;
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    let shown = 0;
    for (const r of rows) { const hit = !q || r.dataset.filter.includes(q); r.hidden = !hit; if (hit) shown++; }
    document.querySelectorAll('[data-filter-group]').forEach((g) => { g.hidden = !g.querySelector('[data-filter]:not([hidden])'); });
    count.textContent = q ? shown + ' of ' + total + ' skills' : '';
    empty.hidden = shown > 0;
    empty.querySelector('q').textContent = input.value.trim();
  });
})();
</script>`;

function generateIndexPage(skills, groups) {
    const byGroup = groups.map(g => ({ group: g, skills: skills.filter(s => s.group === g) }));
    const loose = skills.filter(s => !s.group);
    const groupCount = byGroup.filter(b => b.skills.length).length;

    const cards = byGroup.map(({ group: g, skills: list }) => `
      <li class="group-card">
        <h3><a href="#${esc(g.id)}">${esc(g.title)}</a></h3>
        <p>${esc(g.summary)}</p>
        <div class="foot">
          <span class="count num">${plural(list.length, 'skill')}</span>
          <a class="repo" href="${esc(g.repoUrl)}">${esc(g.public_repo)}</a>
        </div>
      </li>`).join('');

    const catalogue = byGroup.filter(b => b.skills.length).map(({ group: g, skills: list }) => `
      <section class="catalogue-group" id="${esc(g.id)}" data-filter-group>
        <header>
          <h3>${esc(g.title)} <span class="muted small num">${list.length}</span></h3>
          <a class="repo" href="${esc(g.repoUrl)}">${esc(g.public_repo)}</a>
        </header>
        <ul class="skill-list">
          ${list.map(skillRow).join('\n          ')}
        </ul>
      </section>`).join('');

    const looseSection = loose.length ? `
      <section class="catalogue-group" id="ungrouped" data-filter-group>
        <header><h3>Skills <span class="muted small num">${loose.length}</span></h3></header>
        <ul class="skill-list">
          ${loose.map(skillRow).join('\n          ')}
        </ul>
      </section>` : '';

    const body = `
  <div class="wrap">
    <section class="cs-intro" aria-labelledby="intro-title">
      <h1 id="intro-title">claude-skills</h1>
      <p class="cs-lede">The Claude Skills I use, packaged so you can drop them into Claude Code or Claude Desktop. Each one has been used on real work before it landed here; the ones that didn't earn their place were deleted.</p>
      <p class="cs-lede">A skill is a folder with a <code>SKILL.md</code> of instructions, plus any scripts and reference files it needs. Claude reads each skill's name and description up front and loads the rest only when a task calls for it.</p>
      <ul class="facts">
        <li><strong class="num">${skills.length}</strong> skills</li>
        <li><strong class="num">${groupCount}</strong> groups, each its own repository</li>
        <li>Apache-2.0</li>
      </ul>
    </section>
  </div>

  <section class="section" id="groups" aria-labelledby="groups-title">
    <div class="wrap">
      <div class="section-head">
        <h2 id="groups-title">Groups</h2>
        <p class="muted">Each group is published as its own repository under ${OWNER}. This site is the index that links them.</p>
      </div>
      <ul class="groups">${cards}
      </ul>
    </div>
  </section>

  <section class="section" id="skills" aria-labelledby="skills-title">
    <div class="wrap">
      <div class="section-head">
        <h2 id="skills-title">All skills</h2>
        <p class="muted">Each skill is packaged on its own. Download the zip from its page, or see <a href="getting-started.html">Install</a> and <a href="${REPO_URL}/releases">all releases</a>.</p>
      </div>
      <div class="filter" data-filter-box hidden>
        <label for="filter">Filter</label>
        <input id="filter" type="search" placeholder="Name or description" autocomplete="off">
        <output for="filter" aria-live="polite"></output>
      </div>
      <p class="empty" data-filter-empty hidden>No skills match <q></q>.</p>${catalogue}${looseSection}
    </div>
  </section>
${FILTER_SCRIPT}`;

    return layout({
        title: 'claude-skills · Mark Pitt',
        description: `The Claude Skills I use, in ${groupCount} groups: ${skills.length} skills for Claude Code and Claude Desktop.`,
        body,
    });
}

function generateSkillPage(skill, skills) {
    const g = skill.group;
    const source = g
        ? `${g.repoUrl}/tree/main/skills/${skill.path}`
        : `${REPO_URL}/tree/main/skills/${skill.path}`;
    const siblings = g ? skills.filter(s => s.group === g) : [];
    const zip = `${DOWNLOAD_BASE}/${skill.path}.zip`;

    const body = `
  <div class="wrap">
    <ol class="crumbs">
      <li><a href="../index.html">claude-skills</a></li>
      ${g ? `<li><a href="../index.html#${esc(g.id)}">${esc(g.title)}</a></li>` : ''}
      <li aria-current="page">${esc(skill.path)}</li>
    </ol>
    <header class="skill-head">
      <h1>${esc(skill.name)}</h1>
      <p class="cs-lede">${esc(skill.description)}</p>
      <div class="meta">
        ${skill.version ? `<span class="chip num">Version ${esc(skill.version)}</span>` : ''}
        ${g ? `<span class="chip">${esc(g.title)}</span>` : ''}
        <a class="chip" href="#files-title">${plural(skill.files.length + 1, 'file')}</a>
      </div>
      <div class="actions">
        <a class="btn primary download" href="${esc(zip)}" download>Download ${esc(skill.path)}.zip</a>
        <a class="btn" href="${esc(source)}">Source on GitHub</a>
      </div>
    </header>
    <div class="skill-body">
      <article>
        <div class="doc-label"><span class="label">SKILL.md</span><span class="muted small">What Claude reads when the skill is used</span></div>
        <div class="prose">
${markdownToHtml(skill.content, linkContext(skill, 'SKILL.md', skills))}
        </div>
      </article>
      <aside>
        <section aria-labelledby="files-title">
          <h2 id="files-title">Files</h2>
          ${fileTree(skill, 'SKILL.md')}
          <p>Everything in the zip. Each file opens here, so you can read the whole skill before you install it.</p>
        </section>
        <section aria-labelledby="install-title">
          <h2 id="install-title">Install</h2>
<pre><code>curl -LO ${esc(zip)}
unzip ${esc(skill.path)}.zip -d ~/.claude/skills/</code></pre>
          <p>For one project only, unzip into <code>.claude/skills/</code>. For Claude Desktop, upload the zip under Settings, Capabilities, Skills. Checksums are in <a href="${DOWNLOAD_BASE}/manifest.json">manifest.json</a>.</p>
        </section>
        ${siblings.length > 1 ? `<section aria-labelledby="group-title">
          <h2 id="group-title">${esc(g.title)}</h2>
          <ul class="siblings">
            ${siblings.map(s => s === skill
                ? `<li><a aria-current="page" href="${esc(s.path)}.html">${esc(s.path)}</a></li>`
                : `<li><a href="${esc(s.path)}.html">${esc(s.path)}</a></li>`).join('\n            ')}
          </ul>
          <p><a class="repo" href="${esc(g.repoUrl)}">${esc(g.public_repo)}</a></p>
        </section>` : ''}
      </aside>
    </div>
  </div>`;

    return layout({
        title: `${skill.name} · claude-skills`,
        description: firstSentence(skill.description, 155),
        depth: 1,
        body,
    });
}

/** A code file with line numbers. The numbers are a separate column screen readers skip. */
function codeView(file) {
    const text = file.text.replace(/\n$/, '');
    const numbers = Array.from({ length: file.lines }, (_, i) => i + 1).join('\n');
    return `<div class="code-view">
<pre class="gutter" aria-hidden="true">${numbers}</pre>
<pre class="code" tabindex="0" aria-label="${esc(file.rel)}, ${plural(file.lines, 'line')}"><code class="language-${esc(file.lang)}">${highlight(text, file.lang)}</code></pre>
</div>`;
}

/** The page for one of a skill's bundled files: markdown rendered, anything else highlighted. */
function generateFilePage(skill, file, skills) {
    const g = skill.group;
    const dir = path.posix.dirname(file.rel);
    const fromDir = path.posix.join(skill.path, dir === '.' ? '' : dir);
    const depth = 1 + fromDir.split('/').length;
    const up = '../'.repeat(depth);
    const zip = `${DOWNLOAD_BASE}/${skill.path}.zip`;
    const label = LANG_LABELS[file.lang] || file.lang;

    let content;
    let note;
    if (file.lang === 'markdown') {
        const { metadata, content: body } = parseFrontmatter(file.text);
        const front = body === file.text ? '' : file.text.slice(0, file.text.length - body.length).replace(/\n+$/, '');
        content = `${front ? `<pre><code class="language-yaml">${highlight(front, 'yaml')}</code></pre>\n` : ''}<div class="prose">
${markdownToHtml(body, linkContext(skill, file.rel, skills))}
</div>`;
        note = metadata && front ? 'Markdown, rendered, with its frontmatter' : 'Markdown, rendered';
    } else {
        content = codeView(file);
        note = `${label}, shown as text and never run`;
    }

    const body = `
  <div class="wrap">
    <ol class="crumbs">
      <li><a href="${up}index.html">claude-skills</a></li>
      ${g ? `<li><a href="${up}index.html#${esc(g.id)}">${esc(g.title)}</a></li>` : ''}
      <li><a href="${esc(relLink(fromDir, pagePath(skill, 'SKILL.md')))}">${esc(skill.path)}</a></li>
      <li aria-current="page">${esc(file.rel)}</li>
    </ol>
    <header class="skill-head file-head">
      <p class="file-of small muted">A file in <a href="${esc(relLink(fromDir, pagePath(skill, 'SKILL.md')))}">${esc(skill.path)}</a></p>
      <h1>${esc(file.rel)}</h1>
      <div class="meta">
        <span class="chip">${esc(label)}</span>
        ${file.lang === 'markdown' ? '' : `<span class="chip num">${plural(file.lines, 'line')}</span>`}
        <span class="chip num">${fileSize(file.size)}</span>
      </div>
      <div class="actions">
        <a class="btn primary download" href="${esc(zip)}" download>Download ${esc(skill.path)}.zip</a>
        <a class="btn" href="${esc(githubUrl(skill, file.rel, 'blob'))}">View on GitHub</a>
      </div>
    </header>
    <div class="skill-body">
      <article>
        <div class="doc-label"><span class="label">${esc(path.posix.basename(file.rel))}</span><span class="muted small">${esc(note)}</span></div>
        ${content}
      </article>
      <aside>
        <section aria-labelledby="files-title">
          <h2 id="files-title">Files in ${esc(skill.path)}</h2>
          ${fileTree(skill, file.rel)}
        </section>
      </aside>
    </div>
  </div>`;

    return layout({
        title: `${file.rel} · ${skill.path} · claude-skills`,
        description: `${file.rel}, a file in the ${skill.path} skill.`,
        depth,
        body,
    });
}

function generateGettingStartedPage(groups) {
    const body = `
  <div class="wrap">
    <ol class="crumbs">
      <li><a href="index.html">claude-skills</a></li>
      <li aria-current="page">Install</li>
    </ol>
    <header class="skill-head">
      <h1 style="font-family: var(--font-sans)">Install a skill</h1>
      <p class="cs-lede">Every skill is released as its own zip, with its <code>SKILL.md</code>, its licence and any reference files it needs. Install the ones you want; there is no need to take a whole group.</p>
    </header>
    <div class="skill-body">
      <article class="prose">
        <h2>Claude Code</h2>
        <p>For every project on this machine, unzip into <code>~/.claude/skills/</code>:</p>
<pre><code>curl -LO ${DOWNLOAD_BASE}/skill-name.zip
unzip skill-name.zip -d ~/.claude/skills/</code></pre>
        <p>For one project only, unzip into that project's <code>.claude/skills/</code> instead. Claude Code picks the skill up at the start of the next session.</p>
        <h2>Claude Desktop</h2>
        <ol>
          <li>Download the skill's zip from its page on this site.</li>
          <li>Open Settings, then Capabilities, then Skills.</li>
          <li>Choose Upload skill and select the zip.</li>
        </ol>
        <h2>From a clone</h2>
        <p>Each group is a repository with its skills under <code>skills/</code>. Copy the folder you want:</p>
<pre><code>git clone https://github.com/${esc(groups[0]?.public_repo || REPO)}.git
cp -r ${esc((groups[0]?.public_repo || REPO).split('/')[1])}/skills/skill-name ~/.claude/skills/</code></pre>
        <h2>Checking a download</h2>
        <p>Each release carries a <a href="${DOWNLOAD_BASE}/manifest.json">manifest.json</a> with the SHA-256 of every archive. Archives are reproducible, so rebuilding the same commit gives the same bytes.</p>
        <h2>Writing your own</h2>
        <p>A skill is a folder with a <code>SKILL.md</code>: YAML frontmatter with a <code>name</code> and a <code>description</code>, then the instructions. Keep the file under 500 lines and move detail into <code>references/</code>, which Claude reads only when it needs to. Anthropic's <a href="https://code.claude.com/docs/en/skills">skills documentation</a> has the full format.</p>
      </article>
      <aside>
        <section aria-labelledby="groups-title">
          <h2 id="groups-title">Repositories</h2>
          <ul class="siblings">
            ${groups.map(g => `<li><a href="${esc(g.repoUrl)}">${esc(g.public_repo)}</a></li>`).join('\n            ')}
          </ul>
        </section>
      </aside>
    </div>
  </div>`;
    return layout({ title: 'Install a skill · claude-skills', description: 'How to install a Claude Skill in Claude Code or Claude Desktop.', current: 'install', body });
}

function build() {
    console.log('Building the claude-skills Pages site...\n');
    const groups = loadGroups();
    const skills = discoverSkills(groups);
    console.log(`Found ${skills.length} skills in ${new Set(skills.map(s => s.group?.id)).size} groups\n`);

    const skillsDocsDir = path.join(DOCS_DIR, 'skills');
    // Start skills/ clean, so a file removed from a skill does not leave its page behind.
    fs.rmSync(skillsDocsDir, { recursive: true, force: true });
    fs.mkdirSync(skillsDocsDir, { recursive: true });

    fs.writeFileSync(path.join(DOCS_DIR, 'index.html'), generateIndexPage(skills, groups));
    console.log('✓ Generated index.html');
    for (const skill of skills) {
        fs.writeFileSync(path.join(skillsDocsDir, `${skill.path}.html`), generateSkillPage(skill, skills));
    }
    console.log(`✓ Generated ${skills.length} pages in skills/`);
    let filePages = 0;
    for (const skill of skills) {
        for (const file of skill.files) {
            if (file.binary) continue;
            const out = path.join(skillsDocsDir, ...pagePath(skill, file.rel).split('/'));
            fs.mkdirSync(path.dirname(out), { recursive: true });
            fs.writeFileSync(out, generateFilePage(skill, file, skills));
            filePages++;
        }
    }
    console.log(`✓ Generated ${filePages} pages for the skills' bundled files`);
    fs.writeFileSync(path.join(DOCS_DIR, 'getting-started.html'), generateGettingStartedPage(groups));
    console.log('✓ Generated getting-started.html');

    for (const file of ['style.css', 'tokens.css']) fs.copyFileSync(path.join(SITE_SRC, file), path.join(DOCS_DIR, file));
    fs.copyFileSync(path.join(SITE_SRC, 'assets', 'mark.svg'), path.join(DOCS_DIR, 'favicon.svg'));
    console.log('✓ Copied style.css, tokens.css and favicon.svg');

    // Prevent GitHub Pages from running Jekyll on the static output
    fs.writeFileSync(path.join(DOCS_DIR, '.nojekyll'), '');
    console.log('\n✅ Build complete!');
    console.log(`   Output: ${DOCS_DIR}`);
}

if (require.main === module) build();

module.exports = { markdownToHtml, parseFrontmatter, firstSentence, highlight, detectLanguage };
