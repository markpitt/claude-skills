// The claude-skills 404 page's script: markpitt.dev's src/scripts/not-found.ts (in the monorepo,
// markpitt.github.io/src/scripts/not-found.ts) as plain JavaScript, because this site has no build
// step for TypeScript. Change it there first, then here: the main site's tests/e2e/not-found.spec.ts
// runs the same matcher cases against both copies.
//
// What it does: shows the address asked for as text, offers at most one link from the routes
// the build lists, and puts the address in the email subject. No network, no storage, no redirects.

/** Lower case, decoded, one slash at each end, no index.html or .html. */
export function normalise(pathname) {
    let p = pathname;
    try {
        p = decodeURIComponent(p);
    }
    catch {
        // A malformed escape: keep it as it came.
    }
    p = p.toLowerCase().replace(/\/{2,}/g, "/");
    p = p.replace(/\/index\.html?$/, "/").replace(/\.html?$/, "");
    if (!p.startsWith("/"))
        p = `/${p}`;
    if (!p.endsWith("/"))
        p = `${p}/`;
    return p;
}
/** Edit distance, two rows. Paths here are short, so nothing cleverer is needed. */
export function distance(a, b) {
    let prev = [];
    for (let j = 0; j <= b.length; j++)
        prev.push(j);
    for (let i = 1; i <= a.length; i++) {
        const row = [i];
        for (let j = 1; j <= b.length; j++) {
            row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
        prev = row;
    }
    return prev[b.length];
}
const segments = (p) => p.split("/").filter(Boolean);
/**
 * The closest route to an address that does not exist, or null.
 *
 * `root` is where this site starts: / for markpitt.dev, /claude-overview/ for a project site. The
 * root itself is never offered, because the routes list already leads there.
 *
 * 1. Find the deepest route the address sits under (the root if none).
 * 2. Compare the rest of the address with each route below that one, over as many segments as the
 *    route has, and offer the nearest within a third of its length in edits (at least one). That
 *    catches a typo at any depth: /projets/, /claude-skils/, /claude-overview/instal/.
 * 3. Otherwise offer the route it sits under, if that is not the root: an old page under
 *    /claude-overview/ suggests /claude-overview/.
 */
export function closest(pathname, routes, root = "/") {
    const p = normalise(pathname);
    const home = normalise(root);
    if (!p.startsWith(home) || p === home)
        return null;
    const parent = routes
        .filter((r) => r.key !== home && p.startsWith(r.key) && p !== r.key)
        .sort((a, b) => b.key.length - a.key.length)[0] ?? null;
    const base = parent?.key ?? home;
    const rest = segments(p.slice(base.length));
    let best = null;
    let bestScore = Infinity;
    for (const r of routes) {
        if (r.key === home || r.key === base || !r.key.startsWith(base))
            continue;
        const target = segments(r.key.slice(base.length)).join("/");
        const probe = rest.slice(0, segments(target).length).join("/");
        const limit = Math.max(1, Math.floor(probe.length / 3));
        const d = distance(probe, target);
        if (d <= limit && d < bestScore) {
            best = r;
            bestScore = d;
        }
    }
    return best ?? parent;
}
/** Wires the page up. Every value from the address goes in as text, never as markup. */
export function run(doc, loc) {
    const root = doc.querySelector("[data-nf]");
    if (!root)
        return;
    const routes = JSON.parse(root.dataset.nfRoutes ?? "[]");
    const home = root.dataset.nfRoot ?? "/";
    let shown = loc.pathname;
    try {
        shown = decodeURIComponent(shown);
    }
    catch {
        // Show it encoded.
    }
    const where = doc.querySelector("[data-nf-where]");
    if (where) {
        const code = doc.createElement("code");
        code.className = "nf-path";
        code.textContent = shown;
        where.replaceChildren(code);
    }
    const term = doc.querySelector("[data-nf-term]");
    const termPath = doc.querySelector("[data-nf-term-path]");
    if (term && termPath) {
        termPath.textContent = shown;
        term.hidden = false;
    }
    const match = closest(loc.pathname, routes, home);
    const suggest = doc.querySelector("[data-nf-suggest]");
    const link = doc.querySelector("[data-nf-suggest-link]");
    const label = doc.querySelector("[data-nf-suggest-label]");
    if (match && suggest && link && label) {
        link.href = match.href;
        link.textContent = match.href;
        label.textContent = match.label;
        suggest.hidden = false;
    }
    const report = doc.querySelector("[data-nf-report]");
    if (report) {
        const subject = `Broken link on markpitt.dev: ${shown}`;
        report.href = `mailto:mark@markpitt.dev?subject=${encodeURIComponent(subject)}`;
    }
}

// Run on the page; do nothing when imported elsewhere, as the main site's tests do.
if (typeof document !== "undefined") run(document, location);
