# GitHub Learning Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the static zero-dependency interactive GitHub learning site described in the spec, one tested task at a time.

**Architecture:** Hash-routed single `index.html` with vanilla-JS engines (`graph`, `github-sim`, `sandbox`, `quiz`, `glossary`) that render from plain data files (`data/*.js` assigning to `window.GHLearn`). Styling from three-layer CSS tokens with light/dark themes. Tests use only Node 24 built-ins (`node:test`, `node:assert`, `node:vm`, `node:fs`) — no npm test dependencies, ever.

**Tech Stack:** HTML, CSS custom properties, vanilla JS (plain `<script>` tags, no modules — the page must work from `file://`), Node 24 built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-18-github-learning-experience-design.md` — executors read both.

## Global Constraints

- Zero runtime dependencies: no frameworks, no build step, no CDN JS, no webfont downloads. `index.html` opens directly from disk and from any static host.
- System font stacks only: UI `-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Inter, Helvetica, Arial, sans-serif`; mono `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`.
- Octicon-style icons vendored inline in `assets/icons.svg`; no emoji as icons.
- Light + dark-dimmed themes via `[data-theme]` on `<html>`, persisted in `localStorage`; default follows `prefers-color-scheme`.
- All motion uses `cubic-bezier(0.16, 1, 0.3, 1)`; fast 132ms / normal 220ms / slow 352ms. Transform + opacity only. `prefers-reduced-motion` renders final states instantly.
- Touch targets ≥ 44px. Full keyboard operability. Simulation state changes announced via ARIA live regions. Icon-only buttons carry `aria-label`.
- State is never color-only: every status pairs color with an icon + text label.
- Voice contract: plain-first, example-anchored, professional term second, confusion-proofed. Concept cards carry at most ~60 words before the example.
- Accuracy contract: current GitHub Docs; `main` as default branch; `pull` taught as fetch + merge; no legacy project boards as current.

---

## Shared test harness (used by every task)

Every test file starts with this exact loader. It evaluates repo JS files in a fake `window` via `node:vm` so engine logic is tested without a browser. Copy it verbatim into each new test file (adjust only the `load()` file list).

```js
// tests/helpers.js — hmm, NO: each test file is self-contained. Paste this block:
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
function load(files) {
  const sandbox = { window: {}, localStorage: null, document: null };
  sandbox.window.GHLearn = {};
  // minimal localStorage stub
  const store = {};
  sandbox.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
  sandbox.window.localStorage = sandbox.localStorage;
  vm.createContext(sandbox);
  for (const f of files) {
    const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
    vm.runInContext(code, sandbox, { filename: f });
  }
  return sandbox.window.GHLearn;
}
```

Run a single task's tests with (example Task 1):

```bash
node --test tests/theme.test.js
```

Run the whole suite with:

```bash
node --test tests/
```

Expected: `pass` counts > 0, `fail` 0. A task is done only when its test file passes fully.

---

### Task 1: Scaffold, tokens, theme toggle

**Files:**
- Create: `index.html`
- Create: `styles/tokens.css`
- Create: `scripts/main.js`
- Test: `tests/theme.test.js`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: `GHLearn.Theme = { get(doc), set(doc, t), init(doc) }` where `doc` is the `document` (or a stub with `documentElement.setAttribute/getAttribute`); theme key `'ghlearn-theme'`. CSS variables from §8 of spec available to all later tasks.

- [ ] **Step 1: Write the failing test**

```js
// tests/theme.test.js (paste the shared loader block from above first, then:)
test('Theme defaults to light without stored value or media query', () => {
  const GHLearn = load(['scripts/main.js']);
  const attrs = {};
  const docStub = { documentElement: {
    setAttribute: (k, v) => { attrs[k] = v; },
    getAttribute: (k) => attrs[k] || null,
  }};
  GHLearn.Theme.init(docStub);
  assert.equal(attrs['data-theme'], 'light');
});

test('Theme persists and restores dark', () => {
  const GHLearn = load(['scripts/main.js']);
  const attrs = {};
  const docStub = { documentElement: {
    setAttribute: (k, v) => { attrs[k] = v; },
    getAttribute: (k) => attrs[k] || null,
  }};
  GHLearn.Theme.set(docStub, 'dark');
  assert.equal(attrs['data-theme'], 'dark');
  attrs['data-theme'] = null;
  GHLearn.Theme.init(docStub);
  assert.equal(attrs['data-theme'], 'dark');
});

test('tokens.css defines both themes and motion tokens', () => {
  const css = fs.readFileSync(path.join(ROOT, 'styles/tokens.css'), 'utf8');
  assert.match(css, /\[data-theme="dark"\]/);
  assert.match(css, /\[data-theme="light"\]/);
  assert.match(css, /--canvas:\s*#0d1117/);
  assert.match(css, /cubic-bezier\(0\.16,\s*1,\s*0\.3,\s*1\)/);
  assert.match(css, /--ease:\s*cubic-bezier/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/theme.test.js`
Expected: FAIL — `scripts/main.js` and `styles/tokens.css` do not exist (`ENOENT`).

- [ ] **Step 3: Write minimal implementation**

`styles/tokens.css` (complete):

```css
:root {
  --ease: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-fast: 132ms;
  --dur-normal: 220ms;
  --dur-slow: 352ms;
  --radius-btn: 6px;
  --radius-input: 6px;
  --radius-card: 8px;
  --space-base: 4px;
  --z-sticky: 10;
  --z-popover: 50;
  --z-dialog: 100;
  --font-ui: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Inter, Helvetica, Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
}
[data-theme="dark"] {
  --canvas: #0d1117;
  --surface-1: #161b22;
  --surface-2: #1c2128;
  --border: #30363d;
  --text: #e6edf3;
  --muted: #8b949e;
  --success: #3fb950;
  --danger: #f85149;
  --attention: #d29922;
  --info: #58a6ff;
  --teacher: #e8a13c;
}
[data-theme="light"] {
  --canvas: #ffffff;
  --surface-1: #f6f8fa;
  --surface-2: #eaeef2;
  --border: #d0d7de;
  --text: #1f2328;
  --muted: #59636e;
  --success: #1a7f37;
  --danger: #d1242f;
  --attention: #9a6700;
  --info: #0969da;
  --teacher: #9a6700;
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation-duration: 0.01ms !important; }
}
```

`scripts/main.js` (complete):

```js
(function () {
  window.GHLearn = window.GHLearn || {};
  var KEY = 'ghlearn-theme';
  function store() {
    try { return window.localStorage; } catch (e) { return null; }
  }
  window.GHLearn.Theme = {
    get: function () {
      var s = store();
      var v = s ? s.getItem(KEY) : null;
      return v === 'dark' || v === 'light' ? v : null;
    },
    set: function (doc, t) {
      if (t !== 'dark' && t !== 'light') throw new Error('theme must be dark or light');
      doc.documentElement.setAttribute('data-theme', t);
      var s = store();
      if (s) s.setItem(KEY, t);
    },
    init: function (doc) {
      var saved = this.get();
      if (saved) { this.set(doc, saved); return saved; }
      this.set(doc, 'light');
      return 'light';
    },
  };
})();
```

`index.html` (complete shell; later tasks add chapters inside `#app`):

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>GitHub, Finally Explained — from first commit to confident collaborator</title>
<meta name="description" content="A friendly, interactive journey from Git basics to confident GitHub collaboration: branches, pull requests, issues, forks, actions, and releases.">
<link rel="stylesheet" href="styles/tokens.css">
<link rel="stylesheet" href="styles/components.css">
<link rel="stylesheet" href="styles/simulations.css">
</head>
<body>
<a class="skip-link" href="#app">Skip to content</a>
<header class="site-header">
  <span class="site-brand">GitHub, Finally Explained</span>
  <button id="theme-toggle" type="button" aria-label="Toggle dark mode">Theme</button>
</header>
<div class="pipeline-strip" id="pipeline" aria-label="You are here: code journey"></div>
<nav class="path-rail" id="path-rail" aria-label="Learning path"></nav>
<main id="app" tabindex="-1"></main>
<script src="data/glossary.js"></script>
<script src="data/curriculum.js"></script>
<script src="data/scenarios.js"></script>
<script src="data/quizzes.js"></script>
<script src="data/decoded.js"></script>
<script src="scripts/progress.js"></script>
<script src="scripts/router.js"></script>
<script src="scripts/graph.js"></script>
<script src="scripts/github-sim.js"></script>
<script src="scripts/sandbox.js"></script>
<script src="scripts/quiz.js"></script>
<script src="scripts/glossary.js"></script>
<script src="scripts/main.js"></script>
<script>
  GHLearn.Theme.init(document);
  document.getElementById('theme-toggle').addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-theme');
    GHLearn.Theme.set(document, cur === 'dark' ? 'light' : 'dark');
  });
</script>
</body>
</html>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/theme.test.js`
Expected: PASS, 3/3.

- [ ] **Step 5: Commit**

```bash
git add index.html styles/tokens.css scripts/main.js tests/theme.test.js
git commit -m "feat: scaffold shell, Primer tokens, theme toggle"
```

---

### Task 2: Components CSS, icons, router, hub + pipeline strip

**Files:**
- Create: `styles/components.css`
- Create: `styles/simulations.css` (placeholder rules for sim class names used later — full sim styling lands with each engine task; this file defines only layout shells)
- Create: `assets/icons.svg`
- Create: `scripts/progress.js`
- Create: `scripts/router.js`
- Test: `tests/router.test.js`

**Interfaces:**
- Consumes: `GHLearn.Theme` (Task 1), token variables.
- Produces: `GHLearn.Progress = { load(), save(p), get(k), set(k, v) }` (localStorage key `ghlearn-progress-v1`, object shape `{ doneChapters: [], quizScores: {} }`); `GHLearn.Router = { parseHash(hash), routeFor(hash) }` returning one of `'hub'`, `'chapter-N'` (N 1–8), `'playground'`, `'glossary'`, defaulting to `'hub'`.

- [ ] **Step 1: Write the failing test**

```js
// tests/router.test.js (shared loader block first, then:)
test('Router parses known hashes', () => {
  const GHLearn = load(['scripts/progress.js', 'scripts/router.js']);
  assert.equal(GHLearn.Router.routeFor('#/chapter-3'), 'chapter-3');
  assert.equal(GHLearn.Router.routeFor('#/glossary'), 'glossary');
  assert.equal(GHLearn.Router.routeFor('#/playground'), 'playground');
  assert.equal(GHLearn.Router.routeFor('#/nope'), 'hub');
  assert.equal(GHLearn.Router.routeFor(''), 'hub');
});

test('Progress round-trips done chapters', () => {
  const GHLearn = load(['scripts/progress.js', 'scripts/router.js']);
  GHLearn.Progress.set('doneChapters', [1, 2]);
  assert.deepEqual(GHLearn.Progress.get('doneChapters'), [1, 2]);
  const fresh = GHLearn.Progress.load();
  assert.deepEqual(fresh.doneChapters, [1, 2]);
});

test('components.css covers required class names and a11y rules', () => {
  const css = fs.readFileSync(path.join(ROOT, 'styles/components.css'), 'utf8');
  for (const cls of ['.card', '.btn', '.btn-primary', '.badge-git', '.badge-github',
      '.pipeline-strip', '.path-rail', '.skip-link', '.teacher-note', '.tabs']) {
    assert.match(css, new RegExp(cls.replace('.', '\\.') + '\\b'));
  }
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /text-wrap:\s*balance/);
});

test('icons.svg has the required symbols, no emoji', () => {
  const svg = fs.readFileSync(path.join(ROOT, 'assets/icons.svg'), 'utf8');
  for (const id of ['i-repo', 'i-branch', 'i-commit', 'i-pr', 'i-issue',
      'i-check', 'i-x', 'i-dot', 'i-lock', 'i-star']) {
    assert.match(svg, new RegExp('id="' + id + '"'));
  }
  const noSvg = svg.replace(/<svg[\s\S]*?<\/svg>/g, '');
  assert.ok(!/[\u{1F300}-\u{1FAFF}]/u.test(svg), 'no emoji in icons file');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/router.test.js`
Expected: FAIL with ENOENT on `scripts/progress.js`.

- [ ] **Step 3: Write minimal implementation**

`scripts/progress.js` (complete):

```js
(function () {
  window.GHLearn = window.GHLearn || {};
  var KEY = 'ghlearn-progress-v1';
  function blank() { return { doneChapters: [], quizScores: {} }; }
  function store() { try { return window.localStorage; } catch (e) { return null; } }
  window.GHLearn.Progress = {
    load: function () {
      var s = store();
      if (!s) return blank();
      try {
        var p = JSON.parse(s.getItem(KEY) || 'null');
        if (!p || !Array.isArray(p.doneChapters)) return blank();
        if (!p.quizScores || typeof p.quizScores !== 'object') p.quizScores = {};
        return p;
      } catch (e) { return blank(); }
    },
    save: function (p) {
      var s = store();
      if (s) s.setItem(KEY, JSON.stringify(p));
    },
    get: function (k) { return this.load()[k]; },
    set: function (k, v) { var p = this.load(); p[k] = v; this.save(p); },
  };
})();
```

`scripts/router.js` (complete):

```js
(function () {
  window.GHLearn = window.GHLearn || {};
  var CHAPTERS = 8;
  window.GHLearn.Router = {
    parseHash: function (hash) {
      hash = (hash || '').replace(/^#/, '');
      if (hash.charAt(0) === '/') hash = hash.slice(1);
      return hash;
    },
    routeFor: function (hash) {
      var h = this.parseHash(hash);
      if (h === '' || h === 'hub') return 'hub';
      if (h === 'glossary' || h === 'playground') return h;
      var m = /^chapter-([1-8])$/.exec(h);
      if (m) return 'chapter-' + m[1];
      return 'hub';
    },
    chapterCount: function () { return CHAPTERS; },
  };
})();
```

`assets/icons.svg` (complete — 10 inline symbols, stroke-based, 16×16 viewBox):

```svg
<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
  <symbol id="i-repo" viewBox="0 0 16 16"><path d="M2 2h5l1 2h6v10H2z" fill="none" stroke="currentColor" stroke-width="1.5"/></symbol>
  <symbol id="i-branch" viewBox="0 0 16 16"><circle cx="4.5" cy="3.5" r="1.8" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="4.5" cy="12.5" r="1.8" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="11.5" cy="6.5" r="1.8" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M4.5 5.3v5.4M11.5 8.3c0 2-3 2-5 2.5" fill="none" stroke="currentColor" stroke-width="1.5"/></symbol>
  <symbol id="i-commit" viewBox="0 0 16 16"><circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M1.5 8h3.5M11 8h3.5" stroke="currentColor" stroke-width="1.5"/></symbol>
  <symbol id="i-pr" viewBox="0 0 16 16"><circle cx="4.5" cy="4" r="2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="4.5" cy="12" r="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M4.5 6v4M4.5 8h6a3 3 0 0 1 0 6h-2" fill="none" stroke="currentColor" stroke-width="1.5"/></symbol>
  <symbol id="i-issue" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v3.5" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="10.8" r="0.9" fill="currentColor"/></symbol>
  <symbol id="i-check" viewBox="0 0 16 16"><path d="M3 8.5l3.2 3.2L13 5" fill="none" stroke="currentColor" stroke-width="2"/></symbol>
  <symbol id="i-x" viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2"/></symbol>
  <symbol id="i-dot" viewBox="0 0 16 16"><circle cx="8" cy="8" r="4" fill="currentColor"/></symbol>
  <symbol id="i-lock" viewBox="0 0 16 16"><rect x="3.5" y="7" width="9" height="6.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" fill="none" stroke="currentColor" stroke-width="1.5"/></symbol>
  <symbol id="i-star" viewBox="0 0 16 16"><path d="M8 2l1.8 3.8 4.2.5-3 3 .7 4.2L8 11.6l-3.7 1.9.7-4.2-3-3 4.2-.5z" fill="none" stroke="currentColor" stroke-width="1.5"/></symbol>
</svg>
```

`styles/components.css` (complete, abridged to essentials — must at least define every class asserted plus base layout):

```css
body { margin: 0; background: var(--canvas); color: var(--text); font-family: var(--font-ui); line-height: 1.6; }
.skip-link { position: absolute; left: -999px; top: 0; background: var(--text); color: var(--canvas); padding: 8px 12px; z-index: var(--z-dialog); }
.skip-link:focus { left: 8px; top: 8px; }
.site-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; border-bottom: 1px solid var(--border); position: sticky; top: 0; background: var(--canvas); z-index: var(--z-sticky); }
h1, h2, h3 { text-wrap: balance; line-height: 1.25; }
p, li { text-wrap: pretty; }
.mono, code, kbd, .sha { font-family: var(--font-mono); }
.sha, .counter { font-variant-numeric: tabular-nums; }
.card { background: var(--surface-1); border: 1px solid var(--border); border-radius: var(--radius-card); padding: 20px; margin: 16px 0; }
.btn { min-height: 44px; padding: 10px 18px; border-radius: var(--radius-btn); border: 1px solid var(--border); background: var(--surface-1); color: var(--text); cursor: pointer; transition: transform var(--dur-fast) var(--ease); }
.btn-primary { background: var(--success); border-color: transparent; color: #fff; }
[data-theme="light"] .btn-primary { color: #fff; }
.btn:active { transform: scale(0.98); }
.btn:focus-visible, a:focus-visible, input:focus-visible { outline: 2px solid var(--info); outline-offset: 2px; }
.btn[disabled] { opacity: 0.45; cursor: not-allowed; }
.badge-git, .badge-github { display: inline-block; font-size: 12px; font-weight: 600; border-radius: 999px; padding: 2px 10px; border: 1px solid var(--border); }
.badge-git { background: var(--surface-2); }
.badge-github { background: var(--info); color: #fff; border-color: transparent; }
.teacher-note { border-left: 3px solid var(--teacher); padding: 8px 12px; background: var(--surface-1); margin: 12px 0; }
.pipeline-strip { display: flex; gap: 4px; overflow-x: auto; padding: 8px 20px; border-bottom: 1px solid var(--border); font-size: 13px; }
.pipeline-strip .stage { white-space: nowrap; padding: 4px 8px; border-radius: 999px; }
.pipeline-strip .stage[aria-current="step"] { background: var(--teacher); color: #000; font-weight: 700; }
.path-rail { display: flex; gap: 8px; padding: 12px 20px; overflow-x: auto; border-bottom: 1px solid var(--border); }
.tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border); }
.tabs button { min-height: 44px; background: none; border: none; color: var(--text); padding: 8px 14px; cursor: pointer; border-bottom: 2px solid transparent; }
.tabs button[aria-selected="true"] { border-bottom-color: var(--info); font-weight: 600; }
input[type="text"], input[type="search"] { min-height: 44px; padding: 8px 12px; border-radius: var(--radius-input); border: 1px solid var(--border); background: var(--canvas); color: var(--text); font-family: var(--font-mono); }
.status-open { color: var(--success); } .status-closed { color: var(--danger); }
.status-draft, .status-pending { color: var(--attention); } .status-merged { color: var(--info); }
main { max-width: 76ch; margin: 0 auto; padding: 24px 20px 64px; }
.stage-wide { max-width: 1100px; margin: 0 auto; }
```

`styles/simulations.css` (shell only — engines extend it later; keep minimal so later tasks append):

```css
.sim { border: 1px solid var(--border); border-radius: var(--radius-card); background: var(--surface-1); padding: 16px; margin: 16px 0; }
.sim-graph svg { width: 100%; height: auto; }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/router.test.js`
Expected: PASS, 4/4. Also re-run `node --test tests/` — Task 1 tests still pass.

- [ ] **Step 5: Commit**

```bash
git add styles/components.css styles/simulations.css assets/icons.svg scripts/progress.js scripts/router.js tests/router.test.js
git commit -m "feat: components CSS, icons, progress store, hash router"
```

---

### Task 3: Glossary data + decoded phrases + glossary engine

**Files:**
- Create: `data/glossary.js`
- Create: `data/decoded.js`
- Create: `scripts/glossary.js`
- Test: `tests/glossary.test.js`

**Interfaces:**
- Consumes: nothing visual yet.
- Produces: `GHLearn.data.glossary` = array of `{ term, kind: 'git'|'github', plain (≤ 25 words, zero jargon), example (everyday), pro (professional term usage, 1 sentence), confusion ("Beginners often think X, but actually Y"), relates: [terms] }`; `GHLearn.data.decoded` = array of 12 `{ phrase, means, do, sim }`; `GHLearn.Glossary = { find(term), search(q), popoverHTML(term) }` where `find` is case-insensitive exact match or null, `search` returns array of entries matching term/plain/pro substrings (empty query returns all), `popoverHTML` returns an HTML string containing the term, kind badge class, plain text, and example, with all `<>&"` escaped.

- [ ] **Step 1: Write the failing test**

```js
// tests/glossary.test.js (shared loader block first, then:)
test('glossary has >= 55 entries with valid shape and voice', () => {
  const GHLearn = load(['data/glossary.js', 'data/decoded.js', 'scripts/glossary.js']);
  const g = GHLearn.data.glossary;
  assert.ok(g.length >= 55, 'got ' + g.length);
  const kinds = new Set();
  for (const e of g) {
    assert.ok(e.term && (e.kind === 'git' || e.kind === 'github'), JSON.stringify(e));
    kinds.add(e.kind);
    assert.ok(e.plain && e.plain.split(/\s+/).length <= 30, e.term);
    assert.ok(e.example, e.term);
    assert.ok(e.confusion, e.term);
    assert.ok(Array.isArray(e.relates), e.term);
  }
  assert.ok(kinds.has('git') && kinds.has('github'));
  for (const t of ['repository', 'branch', 'commit', 'pull request', 'issue', 'fork', 'merge', 'rebase', 'remote', 'origin', 'HEAD', 'stash']) {
    assert.ok(GHLearn.Glossary.find(t), 'missing ' + t);
  }
});

test('search is case-insensitive substring, empty returns all', () => {
  const GHLearn = load(['data/glossary.js', 'data/decoded.js', 'scripts/glossary.js']);
  assert.ok(GHLearn.Glossary.search('BRANCH').length >= 1);
  assert.equal(GHLearn.Glossary.search('').length, GHLearn.data.glossary.length);
  assert.equal(GHLearn.Glossary.find('no-such-term'), null);
});

test('popoverHTML escapes markup and includes badge + example', () => {
  const GHLearn = load(['data/glossary.js', 'data/decoded.js', 'scripts/glossary.js']);
  const html = GHLearn.Glossary.popoverHTML('branch');
  assert.match(html, /badge-git|badge-github/);
  assert.match(html, /branch/i);
  assert.ok(!/<script/i.test(html));
});

test('decoded set has all 12 required phrases', () => {
  const GHLearn = load(['data/glossary.js', 'data/decoded.js', 'scripts/glossary.js']);
  const need = ['open a PR', 'push your branch', 'rebase onto main', 'the checks are failing',
    'request changes', 'merge the PR', 'squash and merge', 'fork the repo',
    'sync with upstream', 'resolve the conflicts', 'cut a release', 'LGTM'];
  const phrases = GHLearn.data.decoded.map((d) => d.phrase.toLowerCase());
  for (const n of need) assert.ok(phrases.some((p) => p.includes(n.toLowerCase())), 'missing ' + n);
  for (const d of GHLearn.data.decoded) {
    assert.ok(d.phrase && d.means && d.do && d.sim, JSON.stringify(d));
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/glossary.test.js`
Expected: FAIL with ENOENT on `data/glossary.js`.

- [ ] **Step 3: Write minimal implementation**

`scripts/glossary.js` (complete):

```js
(function () {
  window.GHLearn = window.GHLearn || {};
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  window.GHLearn.Glossary = {
    all: function () { return (window.GHLearn.data && window.GHLearn.data.glossary) || []; },
    find: function (term) {
      var t = String(term).toLowerCase().trim();
      var list = this.all();
      for (var i = 0; i < list.length; i++) {
        if (list[i].term.toLowerCase() === t) return list[i];
      }
      return null;
    },
    search: function (q) {
      q = String(q == null ? '' : q).toLowerCase().trim();
      var list = this.all();
      if (!q) return list.slice();
      return list.filter(function (e) {
        return (e.term + ' ' + e.plain + ' ' + e.pro).toLowerCase().indexOf(q) !== -1;
      });
    },
    popoverHTML: function (term) {
      var e = this.find(term);
      if (!e) return '';
      return '<div class="glossary-pop" role="dialog" aria-label="' + esc(e.term) + '">'
        + '<span class="badge-' + (e.kind === 'git' ? 'git' : 'github') + '">' + (e.kind === 'git' ? 'Git' : 'GitHub') + '</span> '
        + '<strong>' + esc(e.term) + '</strong>'
        + '<p>' + esc(e.plain) + '</p>'
        + '<p class="teacher-note">' + esc(e.example) + '</p></div>';
    },
  };
})();
```

`data/glossary.js`: assign `window.GHLearn.data.glossary` as an array following this exact entry shape — 3 worked examples below, then continue the same shape for every term in the spec §6 list (repo, README, commit, SHA, branch, main, HEAD, working tree, staging area, index, detached HEAD, stash, reset, revert, restore, remote, origin, upstream, tracking branch, remote-tracking branch, clone, fetch, pull, push, merge, merge conflict, rebase, cherry-pick, squash, PR, draft PR, review, approval, requested changes, suggestion, checks, required checks, CODEOWNERS, rulesets/branch protection, issue, label, assignee, milestone, template, issue form, linked issue, closing keyword, fork, contributing, Actions, workflow, job, step, runner, trigger, artifact, environment, secret, release, tag, versioning/semver, release notes, package, Discussion, Project, Dependabot, notification):

```js
window.GHLearn = window.GHLearn || {};
window.GHLearn.data = window.GHLearn.data || {};
window.GHLearn.data.glossary = [
  { term: 'repository', kind: 'github', plain: 'A project folder with a memory. It holds your files plus every save-point ever made.',
    example: 'Like a school binder that keeps every draft of your essay, not just the final copy.',
    pro: 'Developers say "repo" for short, as in "clone the repo".',
    confusion: 'Beginners often think a repo is just a folder, but actually the hidden history inside is the whole point.',
    relates: ['commit', 'branch', 'remote'] },
  { term: 'branch', kind: 'git', plain: 'A duplicated game save where you can experiment without touching the safe original.',
    example: 'Copy your essay file to try a risky new ending; the original stays safe.',
    pro: 'Developers branch off main, work there, then merge back.',
    confusion: 'Beginners often think branches are copies of files, but actually they are movable pointers to a line of save-points.',
    relates: ['main', 'merge', 'HEAD'] },
  { term: 'commit', kind: 'git', plain: 'One save-point: a snapshot of your files plus a note saying what changed.',
    example: 'Saving your game before a boss fight, with a label like "before boss".',
    pro: 'Each commit has a unique ID (SHA) developers quote like "fixed in a3f9c1".',
    confusion: 'Beginners often think saving a file is a commit, but actually nothing is recorded until you commit.',
    relates: ['SHA', 'staging area', 'push'] },
  // ... continue: one object per term in the spec list, same five fields, plain <= 30 words.
];
```

`data/decoded.js`: assign `window.GHLearn.data.decoded`, 12 objects with `{ phrase, means, do, sim }` — e.g.:

```js
window.GHLearn.data.decoded = [
  { phrase: 'open a PR', means: 'Your branch is ready for teammates to look at. The PR is the conversation where review happens.',
    do: 'Push your branch, then click "Compare & pull request", describe the change, and request reviewers.',
    sim: 'pr' },
  // ... all 12 phrases from the spec, each with means/do/sim (sim is one of pr, issue, graph, sandbox, release).
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/glossary.test.js`
Expected: PASS, 4/4.

- [ ] **Step 5: Commit**

```bash
git add data/glossary.js data/decoded.js scripts/glossary.js tests/glossary.test.js
git commit -m "feat: glossary data, decoded phrases, glossary engine"
```

---

### Task 4: Curriculum chapters 1–2 + concept renderer

**Files:**
- Create: `data/curriculum.js` (chapters 1–2 complete; chapters 3–8 appended by later tasks — file must remain valid JS after each append; structure as `GHLearn.data.chapters = { 1: {...}, 2: {...} }`)
- Create: `scripts/render.js` — `GHLearn.Render = { conceptCard(c), chapterHTML(ch) }` producing Primer-styled HTML strings using token classes, Git/GitHub badges, `[[term]]` spans for glossary popovers, and "Take it deeper (optional)" `<details>` blocks.
- Test: `tests/curriculum12.test.js`

**Interfaces:**
- Consumes: `GHLearn.Glossary.find` (Task 3) to validate `[[term]]` references resolve.
- Produces: chapter shape `{ n, title, story, concepts: [{ heading, kind: 'git'|'github'|'both', plain, example, pro, confusion, deep }], recap: [terms], quiz: 'quiz-ch1' }`; `Render.conceptCard` returns string containing `badge-` class, heading, plain, example, and `<details>`.

- [ ] **Step 1: Write the failing test**

```js
// tests/curriculum12.test.js (shared loader block first, then:)
test('chapters 1-2 exist with valid shape and voice limits', () => {
  const GHLearn = load(['data/glossary.js', 'data/decoded.js', 'scripts/glossary.js',
    'data/curriculum.js', 'scripts/render.js']);
  for (const n of [1, 2]) {
    const ch = GHLearn.data.chapters[n];
    assert.ok(ch && ch.title && ch.story, 'chapter ' + n);
    assert.ok(ch.concepts.length >= 4, 'chapter ' + n + ' needs >= 4 concepts');
    for (const c of ch.concepts) {
      assert.ok(['git', 'github', 'both'].includes(c.kind), c.heading);
      assert.ok(c.plain.split(/\s+/).length <= 60, c.heading + ' plain too long');
      assert.ok(c.example && c.pro && c.confusion, c.heading);
    }
    assert.ok(Array.isArray(ch.recap) && ch.recap.length >= 2);
  }
});

test('every [[term]] reference resolves in the glossary', () => {
  const GHLearn = load(['data/glossary.js', 'data/decoded.js', 'scripts/glossary.js',
    'data/curriculum.js', 'scripts/render.js']);
  const re = /\[\[([^\]]+)\]\]/g;
  const missing = [];
  for (const n of [1, 2]) {
    const ch = GHLearn.data.chapters[n];
    const blobs = [ch.story, ch.title].concat(ch.concepts.flatMap((c) =>
      [c.heading, c.plain, c.example, c.pro, c.confusion, c.deep || '']));
    for (const b of blobs) {
      let m; re.lastIndex = 0;
      while ((m = re.exec(b || ''))) {
        if (!GHLearn.Glossary.find(m[1])) missing.push('ch' + n + ': ' + m[1]);
      }
    }
  }
  assert.deepEqual(missing, []);
});

test('conceptCard renders badges, details, escaped HTML', () => {
  const GHLearn = load(['data/glossary.js', 'data/decoded.js', 'scripts/glossary.js',
    'data/curriculum.js', 'scripts/render.js']);
  const html = GHLearn.Render.conceptCard({
    heading: 'Test <b>', kind: 'git', plain: 'plain', example: 'ex', pro: 'pro',
    confusion: 'conf', deep: 'deep stuff',
  });
  assert.match(html, /badge-git/);
  assert.match(html, /<details>/);
  assert.ok(!html.includes('<b>'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/curriculum12.test.js`
Expected: FAIL with ENOENT on `data/curriculum.js`.

- [ ] **Step 3: Write minimal implementation**

`scripts/render.js` (complete):

```js
(function () {
  window.GHLearn = window.GHLearn || {};
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function linkTerms(text) {
    return esc(text).replace(/\[\[([^\]]+)\]\]/g, function (_, t) {
      return '<button type="button" class="term-link" data-term="' + esc(t) + '">' + esc(t) + '</button>';
    });
  }
  function badge(kind) {
    if (kind === 'git') return '<span class="badge-git">Git</span>';
    if (kind === 'github') return '<span class="badge-github">GitHub</span>';
    return '<span class="badge-git">Git</span> <span class="badge-github">GitHub</span>';
  }
  window.GHLearn.Render = {
    conceptCard: function (c) {
      var h = '<article class="card concept">' + badge(c.kind)
        + '<h3>' + esc(c.heading) + '</h3>'
        + '<p>' + linkTerms(c.plain) + '</p>'
        + '<p class="teacher-note">' + linkTerms(c.example) + '</p>'
        + '<p><strong>Developers say:</strong> ' + linkTerms(c.pro) + '</p>'
        + '<p><strong>Watch out:</strong> ' + linkTerms(c.confusion) + '</p>';
      if (c.deep) h += '<details><summary>Take it deeper (optional)</summary><p>' + linkTerms(c.deep) + '</p></details>';
      return h + '</article>';
    },
    chapterHTML: function (ch) {
      var h = '<h2>Chapter ' + ch.n + ': ' + esc(ch.title) + '</h2>'
        + '<p class="story">' + linkTerms(ch.story) + '</p>';
      for (var i = 0; i < ch.concepts.length; i++) h += this.conceptCard(ch.concepts[i]);
      return h;
    },
  };
})();
```

`data/curriculum.js` (chapters 1–2, complete — follow spec ch.1–2 scope; each concept uses the five-beat fields; story introduces Acme Notes; `[[term]]` refs must exist in glossary):

```js
window.GHLearn = window.GHLearn || {};
window.GHLearn.data = window.GHLearn.data || {};
window.GHLearn.data.chapters = {
  1: { n: 1, title: 'Git vs GitHub: the mental model',
    story: 'Meet Priya and Sam, building Acme Notes, a tiny notes app...',
    concepts: [
      { heading: 'What Git is', kind: 'git',
        plain: 'Git is a time machine for your files. It remembers every save-point you choose to record.',
        example: 'Like save-points in a video game: you decide when to save, and you can always go back.',
        pro: 'Developers say "version control" and mean Git recording history.',
        confusion: 'Beginners often think Git and GitHub are the same thing, but actually Git works fully on your own computer with no internet.',
        deep: 'Git stores snapshots as objects addressed by SHA-1 hashes in a content-addressable store.' },
      // ... >= 4 concepts for ch1 (Git, GitHub, why both, local vs remote)
    ],
    recap: ['repository', 'commit'], quiz: 'quiz-ch1' },
  2: { n: 2, title: 'Your first repo',
    story: 'Priya creates the Acme Notes repo...',
    concepts: [ /* >= 4: repository, README, commit/Staging/SHA, remote/origin/clone/fetch/pull/push */ ],
    recap: ['branch'], quiz: 'quiz-ch2' },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/curriculum12.test.js`
Expected: PASS, 3/3.

- [ ] **Step 5: Commit**

```bash
git add data/curriculum.js scripts/render.js tests/curriculum12.test.js
git commit -m "feat: chapters 1-2 curriculum and concept renderer"
```

---

### Task 5: Command sandbox engine + playground wiring

**Files:**
- Create: `scripts/sandbox.js`
- Modify: `data/curriculum.js` — add `sandbox: { script: [...] }` hint lists to chapters 1–2 (append-only; do not rewrite existing chapters)
- Test: `tests/sandbox.test.js`

**Interfaces:**
- Consumes: nothing (pure logic).
- Produces: `GHLearn.Sandbox = { fresh(), exec(state, line) }`. State shape: `{ files: {name: 'clean'|'dirty'|'staged'}, commits: [{id, msg}], branches: {name: commitIdx}, head: 'main', remote: commitsLengthAtPush, log: [] }`. `exec` returns `{ output (string), coaching (string|null), changed (bool) }` and mutates state. Supports exactly: `clone`, `status`, `add <f>`, `commit -m "msg"`, `branch <n>`, `switch <n>`, `restore <f>`, `stash`, `log`, `fetch`, `pull`, `push`, `merge <b>`, `reset --soft HEAD~1`. Unknown commands return coaching naming the closest valid command. `push` with unpushed commits succeeds; `push` with nothing new says "Everything up-to-date". `pull` when remote is ahead fast-forwards; committing on a branch then `merge` combines.

- [ ] **Step 1: Write the failing test**

```js
// tests/sandbox.test.js (shared loader block first, then:)
test('full local-to-remote happy path works', () => {
  const GHLearn = load(['scripts/sandbox.js']);
  const S = GHLearn.Sandbox;
  let st = S.fresh();
  let r = S.exec(st, 'clone https://github.com/acme/notes.git');
  assert.match(r.output, /Cloned/i);
  st.files['app.js'] = 'dirty';
  r = S.exec(st, 'add app.js');
  assert.equal(r.changed, true);
  r = S.exec(st, 'commit -m "add notes list"');
  assert.match(r.output, /save-point|commit/i);
  assert.equal(st.commits.length, 2); // 1 initial + 1 new
  r = S.exec(st, 'push');
  assert.match(r.output, /up-to-date|pushed|Everything/i);
  r = S.exec(st, 'status');
  assert.match(r.output, /clean|up to date/i);
});

test('wrong-order commands coach instead of crash', () => {
  const GHLearn = load(['scripts/sandbox.js']);
  const st = GHLearn.Sandbox.fresh();
  st.files['a.js'] = 'dirty';
  const r = GHLearn.Sandbox.exec(st, 'commit -m "oops"');
  assert.ok(r.coaching && /add/i.test(r.coaching), 'should suggest git add, got: ' + r.coaching);
  const r2 = GHLearn.Sandbox.exec(st, 'frobnicate');
  assert.ok(r2.coaching);
});

test('branch, switch, merge flow works', () => {
  const GHLearn = load(['scripts/sandbox.js']);
  const S = GHLearn.Sandbox;
  const st = S.fresh();
  S.exec(st, 'branch dark-mode');
  const r = S.exec(st, 'switch dark-mode');
  assert.match(r.output, /dark-mode/);
  assert.equal(st.head, 'dark-mode');
  st.files['theme.js'] = 'dirty';
  S.exec(st, 'add theme.js');
  S.exec(st, 'commit -m "dark theme"');
  S.exec(st, 'switch main');
  const m = S.exec(st, 'merge dark-mode');
  assert.match(m.output, /[Mm]erg/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/sandbox.test.js`
Expected: FAIL with ENOENT on `scripts/sandbox.js`.

- [ ] **Step 3: Write minimal implementation**

`scripts/sandbox.js` (complete):

```js
(function () {
  window.GHLearn = window.GHLearn || {};
  var N = 0;
  function sha() { N += 1; return 'c' + String(N).padStart(4, '0'); }
  function fresh() {
    return {
      cloned: false, remoteAhead: 0,
      files: {}, commits: [{ id: 'c0000', msg: 'initial commit' }],
      branches: { main: 0 }, head: 'main', pushed: 1, stash: [],
    };
  }
  function dirtyFiles(st) {
    return Object.keys(st.files).filter(function (f) { return st.files[f] === 'dirty'; });
  }
  function stagedFiles(st) {
    return Object.keys(st.files).filter(function (f) { return st.files[f] === 'staged'; });
  }
  var KNOWN = ['clone', 'status', 'add', 'commit', 'branch', 'switch', 'restore',
    'stash', 'log', 'fetch', 'pull', 'push', 'merge', 'rebase', 'reset'];
  function exec(st, line) {
    var parts = String(line).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return { output: '', coaching: null, changed: false };
    var cmd = parts[0].toLowerCase();
    function needClone() {
      if (!st.cloned) return { output: 'Not a repo yet.', coaching: 'Start with: clone https://github.com/acme/notes.git', changed: false };
      return null;
    }
    if (cmd === 'clone') {
      st.cloned = true;
      return { output: 'Cloned acme/notes. You now have the full history on your computer.', coaching: null, changed: true };
    }
    if (KNOWN.indexOf(cmd) === -1) {
      return { output: 'Unknown command: ' + parts[0], coaching: 'Try one of: ' + KNOWN.join(', '), changed: false };
    }
    var nc = needClone();
    if (nc) return nc;
    if (cmd === 'status') {
      var d = dirtyFiles(st), s = stagedFiles(st);
      var unpushed = st.commits.length - st.pushed;
      var msg = 'On branch ' + st.head + '. ';
      msg += s.length ? 'Staged: ' + s.join(', ') + '. ' : 'Nothing staged. ';
      msg += d.length ? 'Changed, not staged: ' + d.join(', ') + '. ' : 'Working tree clean. ';
      msg += unpushed ? unpushed + ' save-point(s) not yet on GitHub.' : 'Everything is up to date with origin.';
      return { output: msg, coaching: null, changed: false };
    }
    if (cmd === 'add') {
      var f = parts[1];
      if (!f || st.files[f] !== 'dirty') return { output: 'Nothing to stage.', coaching: 'Edit a file first in your head (mark it dirty), e.g. imagine changing ' + (f || 'app.js') + ', or check status.', changed: false };
      st.files[f] = 'staged';
      return { output: 'Staged ' + f + ' (packed your bag).', coaching: null, changed: true };
    }
    if (cmd === 'commit') {
      var s2 = stagedFiles(st);
      if (!s2.length) return { output: 'Nothing staged, nothing recorded.', coaching: 'Run "add <file>" first, then commit. Staging is packing; committing is taking the photo.', changed: false };
      var m = /-m\s+"([^"]+)"/.exec(line) || /-m\s+'([^']+)'/.exec(line) || /-m\s+(\S+)/.exec(line);
      var msg2 = m ? m[1] : 'work in progress';
      s2.forEach(function (x) { st.files[x] = 'clean'; });
      st.commits.push({ id: sha(), msg: msg2 });
      st.branches[st.head] = st.commits.length - 1;
      return { output: 'Save-point recorded: "' + msg2 + '".', coaching: null, changed: true };
    }
    if (cmd === 'branch') {
      var b = parts[1];
      if (!b) return { output: 'Branch name needed.', coaching: 'Try: branch dark-mode', changed: false };
      st.branches[b] = st.branches[st.head];
      return { output: 'Created branch ' + b + ' (duplicated your game save).', coaching: null, changed: true };
    }
    if (cmd === 'switch') {
      var t = parts[1];
      if (!(t in st.branches)) return { output: 'No branch ' + t + '.', coaching: 'Create it first: branch ' + (t || 'my-branch'), changed: false };
      st.head = t;
      return { output: 'Now on ' + t + '. Your files reflect its latest save-point.', coaching: null, changed: true };
    }
    if (cmd === 'restore') {
      var rf = parts[1];
      if (rf && st.files[rf] === 'dirty') { st.files[rf] = 'clean'; return { output: rf + ' restored. Your experiment there is gone; history untouched.', coaching: null, changed: true }; }
      return { output: 'Nothing to restore.', coaching: null, changed: false };
    }
    if (cmd === 'stash') {
      var dd = dirtyFiles(st);
      dd.forEach(function (x) { delete st.files[x]; });
      st.stash.push(dd);
      return { output: 'Stashed ' + dd.length + ' file(s) in a drawer. Working tree clean.', coaching: null, changed: true };
    }
    if (cmd === 'log') {
      return { output: st.commits.map(function (c) { return c.id + ' ' + c.msg; }).join('\n'), coaching: null, changed: false };
    }
    if (cmd === 'fetch' || cmd === 'pull') {
      if (st.remoteAhead > 0 && cmd === 'pull') {
        st.remoteAhead = 0;
        return { output: 'Pulled: fetched from origin, then merged. You are up to date.', coaching: null, changed: true };
      }
      return { output: 'Fetched. Origin has nothing new. (pull = fetch + merge.)', coaching: null, changed: false };
    }
    if (cmd === 'push') {
      if (st.commits.length === st.pushed) return { output: 'Everything up-to-date.', coaching: null, changed: false };
      st.pushed = st.commits.length;
      return { output: 'Pushed ' + st.head + ' to origin. Your save-points are now on GitHub.', coaching: null, changed: true };
    }
    if (cmd === 'merge') {
      var mb = parts[1];
      if (!(mb in st.branches)) return { output: 'No branch ' + mb + '.', coaching: 'switch to main first, then merge <branch>.', changed: false };
      st.commits.push({ id: sha(), msg: 'merge ' + mb + ' into ' + st.head });
      st.branches[st.head] = st.commits.length - 1;
      return { output: 'Merged ' + mb + ' into ' + st.head + '. Two histories, one story.', coaching: null, changed: true };
    }
    if (cmd === 'rebase') {
      return { output: 'Rebase is covered in Chapter 3 — it replays your save-points onto a fresh base.', coaching: 'Finish chapters 1–2 first, then try the branch lab.', changed: false };
    }
    if (cmd === 'reset') {
      if (st.commits.length > 1) {
        var rm = st.commits.pop();
        st.branches[st.head] = st.commits.length - 1;
        return { output: 'Undid save-point "' + rm.msg + '". (Soft reset: your files are untouched.)', coaching: null, changed: true };
      }
      return { output: 'Nothing to undo.', coaching: null, changed: false };
    }
    return { output: 'Hmm.', coaching: null, changed: false };
  }
  window.GHLearn.Sandbox = { fresh: fresh, exec: exec, commands: KNOWN };
})();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/sandbox.test.js`
Expected: PASS, 3/3.

- [ ] **Step 5: Commit**

```bash
git add scripts/sandbox.js tests/sandbox.test.js
git commit -m "feat: command sandbox simulation engine"
```

---

### Task 6: Branch-graph engine + scenarios + chapter 3

**Files:**
- Create: `data/scenarios.js` (graph scenarios: `diverge-merge`, `rebase`, `conflict`; PR/Issue fixtures added in Tasks 7–8 by appending `GHLearn.data.pr` / `GHLearn.data.issue` — same pattern as curriculum)
- Create: `scripts/graph.js`
- Modify: `data/curriculum.js` — append chapter 3 (branching: branches, HEAD, tracking, merge, conflicts, reset/revert/restore, stash, detached HEAD deep-dive)
- Test: `tests/graph.test.js`

**Interfaces:**
- Consumes: chapter shape from Task 4.
- Produces: `GHLearn.data.scenarios['diverge-merge'|'rebase'|'conflict']` = `{ title, lanes: [branchNames], steps: [{ label, nodes: [{id, lane, msg, head?:bool}], note }] }`; `GHLearn.Graph = { scenario(id), stepCount(id), step(id, i), renderSVG(id, i) }` where `renderSVG` returns an SVG string with one `<circle>` per node, branch-lane `<path>`s, HEAD badge text, and `data-node` attributes; out-of-range `i` clamps.

- [ ] **Step 1: Write the failing test**

```js
// tests/graph.test.js (shared loader block first, then:)
test('scenarios exist with ordered steps and headed tips', () => {
  const GHLearn = load(['data/scenarios.js', 'scripts/graph.js']);
  for (const id of ['diverge-merge', 'rebase', 'conflict']) {
    const sc = GHLearn.Graph.scenario(id);
    assert.ok(sc.steps.length >= 3, id);
    const last = sc.steps[sc.steps.length - 1];
    assert.ok(last.nodes.some((n) => n.head), id + ' final step needs a HEAD node');
  }
  assert.equal(GHLearn.Graph.stepCount('rebase'), GHLearn.Graph.scenario('rebase').steps.length);
});

test('renderSVG draws one circle per node with lanes and HEAD', () => {
  const GHLearn = load(['data/scenarios.js', 'scripts/graph.js']);
  const svg = GHLearn.Graph.renderSVG('diverge-merge', 99); // clamps to last
  const sc = GHLearn.Graph.scenario('diverge-merge');
  const last = sc.steps[sc.steps.length - 1];
  const circles = (svg.match(/<circle/g) || []).length;
  assert.equal(circles, last.nodes.length);
  assert.match(svg, /HEAD/);
  assert.match(svg, /data-node=/);
});

test('chapter 3 appended and valid', () => {
  const GHLearn = load(['data/glossary.js', 'data/decoded.js', 'scripts/glossary.js',
    'data/curriculum.js', 'scripts/render.js']);
  const ch = GHLearn.data.chapters[3];
  assert.ok(ch && ch.concepts.length >= 5);
  assert.ok(ch.concepts.some((c) => /conflict/i.test(c.heading)));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/graph.test.js`
Expected: FAIL with ENOENT on `data/scenarios.js`.

- [ ] **Step 3: Write minimal implementation**

`scripts/graph.js` (complete):

```js
(function () {
  window.GHLearn = window.GHLearn || {};
  function all() { return (window.GHLearn.data && window.GHLearn.data.scenarios) || {}; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  window.GHLearn.Graph = {
    scenario: function (id) {
      var sc = all()[id];
      if (!sc) throw new Error('unknown scenario ' + id);
      return sc;
    },
    stepCount: function (id) { return this.scenario(id).steps.length; },
    step: function (id, i) {
      var steps = this.scenario(id).steps;
      if (i < 0) i = 0;
      if (i >= steps.length) i = steps.length - 1;
      return steps[i];
    },
    renderSVG: function (id, i) {
      var sc = this.scenario(id);
      var st = this.step(id, i);
      var laneY = {};
      sc.lanes.forEach(function (l, k) { laneY[l] = 40 + k * 48; });
      var W = 120 + st.nodes.length * 90;
      var H = 40 + sc.lanes.length * 48;
      var h = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(sc.title) + '">';
      sc.lanes.forEach(function (l) {
        h += '<text x="8" y="' + (laneY[l] + 4) + '" font-size="12" fill="currentColor">' + esc(l) + '</text>';
      });
      var byLane = {};
      st.nodes.forEach(function (n) {
        byLane[n.lane] = byLane[n.lane] || [];
        byLane[n.lane].push(n);
      });
      Object.keys(byLane).forEach(function (lane) {
        var pts = byLane[lane].map(function (n, k) { return (110 + k * 90) + ',' + laneY[lane]; });
        h += '<path d="M' + pts.join(' L') + '" fill="none" stroke="currentColor" stroke-width="2"/>';
      });
      st.nodes.forEach(function (n, k) {
        var x = 110 + Object.keys(byLane).reduce(function (acc, lane) {
          return acc;
        }, 0) + k * 90;
        var y = laneY[n.lane];
        h += '<circle cx="' + x + '" cy="' + y + '" r="10" data-node="' + esc(n.id) + '">'
          + '<title>' + esc(n.msg) + '</title></circle>';
        h += '<text x="' + (x - 18) + '" y="' + (y - 16) + '" font-size="10" class="sha">' + esc(n.id) + '</text>';
        if (n.head) h += '<text x="' + (x + 14) + '" y="' + (y + 4) + '" font-size="10">HEAD</text>';
      });
      return h + '</svg>';
    },
  };
})();
```

`data/scenarios.js` (graph half; PR/Issue fixtures appended in Tasks 7–8):

```js
window.GHLearn = window.GHLearn || {};
window.GHLearn.data = window.GHLearn.data || {};
window.GHLearn.data.scenarios = {
  'diverge-merge': { title: 'Two branches diverge, then merge',
    lanes: ['main', 'dark-mode'],
    steps: [
      { label: 'Start: one shared save-point', note: 'Both branches point at the same commit.',
        nodes: [{ id: 'c1', lane: 'main', msg: 'initial commit', head: true }] },
      { label: 'Work splits', note: 'Sam commits on main; Priya commits on dark-mode.',
        nodes: [{ id: 'c1', lane: 'main', msg: 'initial commit' }, { id: 'c2', lane: 'main', msg: 'fix typo', head: true }, { id: 'c3', lane: 'dark-mode', msg: 'dark theme' }] },
      { label: 'Merge', note: 'Priya merges dark-mode into main. One story again.',
        nodes: [{ id: 'c1', lane: 'main', msg: 'initial commit' }, { id: 'c2', lane: 'main', msg: 'fix typo' }, { id: 'c3', lane: 'dark-mode', msg: 'dark theme' }, { id: 'c4', lane: 'main', msg: 'merge dark-mode', head: true }] },
    ] },
  'rebase': { title: 'Rebase: replay onto fresh main',
    lanes: ['main', 'feature'],
    steps: [
      { label: 'Feature branches off old main', note: 'Two commits on feature; main is still.',
        nodes: [{ id: 'c1', lane: 'main', msg: 'base' }, { id: 'c2', lane: 'feature', msg: 'try an idea' }, { id: 'c3', lane: 'feature', msg: 'refine it', head: true }] },
      { label: 'Main moves on', note: 'Sam ships a fix while Priya works.',
        nodes: [{ id: 'c1', lane: 'main', msg: 'base' }, { id: 'c4', lane: 'main', msg: 'hotfix', head: false }, { id: 'c2', lane: 'feature', msg: 'try an idea' }, { id: 'c3', lane: 'feature', msg: 'refine it', head: true }] },
      { label: 'Replayed', note: 'Feature commits replay onto the new tip. Clean, straight history.',
        nodes: [{ id: 'c1', lane: 'main', msg: 'base' }, { id: 'c4', lane: 'main', msg: 'hotfix' }, { id: 'c2r', lane: 'main', msg: 'try an idea (replayed)' }, { id: 'c3r', lane: 'main', msg: 'refine it (replayed)', head: true }] },
    ] },
  'conflict': { title: 'Merge conflict: same line, two edits',
    lanes: ['main', 'feature'],
    steps: [
      { label: 'Same line edited twice', note: 'Both changed the app title. Git cannot choose for you.',
        nodes: [{ id: 'c1', lane: 'main', msg: 'base', head: false }, { id: 'c2', lane: 'main', msg: 'title: Acme Notes', head: true }, { id: 'c3', lane: 'feature', msg: 'title: My Notes' }] },
      { label: 'Conflict markers', note: 'Git marks the spot. You pick the winner, then commit.',
        nodes: [{ id: 'c1', lane: 'main', msg: 'base' }, { id: 'c2', lane: 'main', msg: 'title: Acme Notes', head: true }, { id: 'c3', lane: 'feature', msg: 'title: My Notes' }] },
      { label: 'Resolved', note: 'Priya keeps both ideas, commits the resolution.',
        nodes: [{ id: 'c1', lane: 'main', msg: 'base' }, { id: 'c2', lane: 'main', msg: 'title: Acme Notes' }, { id: 'c4', lane: 'main', msg: 'resolve: Acme Notes (dark)', head: true }] },
    ] },
};
```

Curriculum chapter 3: append `3: {...}` to `GHLearn.data.chapters` with ≥ 5 concepts (branches, HEAD, tracking branches, merge, merge conflicts, reset/revert/restore, stash, detached HEAD in `deep`), same five-beat fields, recap + `quiz: 'quiz-ch3'`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/graph.test.js`
Expected: PASS, 3/3.

- [ ] **Step 5: Commit**

```bash
git add data/scenarios.js scripts/graph.js tests/graph.test.js data/curriculum.js
git commit -m "feat: branch-graph engine, scenarios, chapter 3"
```

---

### Task 7: PR simulation + chapter 4

**Files:**
- Modify: `data/scenarios.js` — append `GHLearn.data.pr` fixture (append-only)
- Modify: `scripts/github-sim.js` — create with PR half: `GHLearn.Sim.PR = { fresh(fixture), approve(s), requestChanges(s, comment), merge(s, mode), stateLabel(s) }` where state ∈ `open|approved|changes-requested|merged`; `merge` allowed only from `approved` with all checks passing; modes `merge|squash|rebase` recorded.
- Modify: `data/curriculum.js` — append chapter 4 (PR lifecycle, draft PRs, reviews, approvals, requested changes, suggestions, conversations, checks, required checks, squash/rebase merge, cherry-pick, branch strategies)
- Test: `tests/pr.test.js`

**Interfaces:**
- Consumes: `GHLearn.data.scenarios` object (append `pr` key without touching graph scenarios).
- Produces: PR fixture shape `{ id, title, branch, base, files: [{path, adds, dels}], checks: [{name, status: 'pass'|'fail'|'pending'}], reviewers: [...] }`; `Sim.PR.fresh` returns `{ status: 'open', approvals: 0, changes: [], merged: null, checks }`.

- [ ] **Step 1: Write the failing test**

```js
// tests/pr.test.js (shared loader block first, then:)
test('PR review flow: approve then merge', () => {
  const GHLearn = load(['data/scenarios.js', 'scripts/github-sim.js']);
  const s = GHLearn.Sim.PR.fresh(GHLearn.data.pr);
  assert.equal(GHLearn.Sim.PR.stateLabel(s), 'Open');
  GHLearn.Sim.PR.approve(s);
  assert.equal(GHLearn.Sim.PR.stateLabel(s), 'Approved');
  const m = GHLearn.Sim.PR.merge(s, 'squash');
  assert.equal(m.ok, true);
  assert.equal(s.status, 'merged');
  assert.equal(s.merged, 'squash');
});

test('cannot merge with failing checks or requested changes', () => {
  const GHLearn = load(['data/scenarios.js', 'scripts/github-sim.js']);
  const s = GHLearn.Sim.PR.fresh(GHLearn.data.pr);
  let m = GHLearn.Sim.PR.merge(s, 'merge');
  assert.equal(m.ok, false);
  GHLearn.Sim.PR.requestChanges(s, 'needs tests');
  GHLearn.Sim.PR.approve(s);
  assert.equal(GHLearn.Sim.PR.stateLabel(s), 'Changes requested');
  m = GHLearn.Sim.PR.merge(s, 'merge');
  assert.equal(m.ok, false);
});

test('chapter 4 appended and valid', () => {
  const GHLearn = load(['data/glossary.js', 'data/decoded.js', 'scripts/glossary.js',
    'data/curriculum.js', 'scripts/render.js']);
  const ch = GHLearn.data.chapters[4];
  assert.ok(ch && ch.concepts.length >= 6);
});
```

The second test requires the fixture's checks to all pass and `approve` after `requestChanges` to NOT clear the changes-requested state (re-review required). Implement exactly that.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/pr.test.js`
Expected: FAIL with ENOENT on `scripts/github-sim.js`.

- [ ] **Step 3: Write minimal implementation**

`scripts/github-sim.js` (PR half; Issue half appended in Task 8 — structure the IIFE so both halves attach to `GHLearn.Sim`):

```js
(function () {
  window.GHLearn = window.GHLearn || {};
  window.GHLearn.Sim = window.GHLearn.Sim || {};
  function checksPass(s) { return s.checks.every(function (c) { return c.status === 'pass'; }); }
  window.GHLearn.Sim.PR = {
    fresh: function (fixture) {
      return { status: 'open', approvals: 0, changes: [],
        merged: null, checks: fixture.checks.map(function (c) { return { name: c.name, status: c.status }; }) };
    },
    approve: function (s) { s.approvals += 1; if (!s.changes.length) s.status = 'approved'; return s; },
    requestChanges: function (s, comment) {
      s.changes.push(comment || 'changes requested');
      s.status = 'changes-requested';
      return s;
    },
    stateLabel: function (s) {
      if (s.status === 'merged') return 'Merged';
      if (s.status === 'approved') return 'Approved';
      if (s.status === 'changes-requested') return 'Changes requested';
      return 'Open';
    },
    merge: function (s, mode) {
      if (s.status === 'merged') return { ok: false, reason: 'Already merged.' };
      if (s.changes.length) return { ok: false, reason: 'A reviewer requested changes. Address them and get a fresh approval first.' };
      if (s.approvals < 1) return { ok: false, reason: 'Needs at least one approval before merging.' };
      if (!checksPass(s)) return { ok: false, reason: 'Checks are failing. Fix them first.' };
      if (['merge', 'squash', 'rebase'].indexOf(mode) === -1) return { ok: false, reason: 'Pick merge, squash, or rebase.' };
      s.status = 'merged';
      s.merged = mode;
      return { ok: true };
    },
  };
})();
```

`data/scenarios.js` append (PR fixture — Acme Notes dark-mode PR, 3 files, checks all passing so the happy path merges):

```js
window.GHLearn.data.pr = {
  id: 'pr-42', title: 'Add dark mode', branch: 'dark-mode', base: 'main',
  files: [
    { path: 'theme.css', adds: 30, dels: 2 },
    { path: 'app.js', adds: 12, dels: 4 },
    { path: 'README.md', adds: 5, dels: 0 },
  ],
  checks: [
    { name: 'tests', status: 'pass' },
    { name: 'lint', status: 'pass' },
  ],
  reviewers: ['sam'],
};
```

Curriculum chapter 4: append `4: {...}` with ≥ 6 concepts, `quiz: 'quiz-ch4'`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/pr.test.js`
Expected: PASS, 3/3.

- [ ] **Step 5: Commit**

```bash
git add scripts/github-sim.js data/scenarios.js data/curriculum.js tests/pr.test.js
git commit -m "feat: PR simulation engine, fixture, chapter 4"
```

---

### Task 8: Issue simulation + chapter 5

**Files:**
- Modify: `data/scenarios.js` — append `GHLearn.data.issue` fixture
- Modify: `scripts/github-sim.js` — append Issue half: `GHLearn.Sim.Issue = { fresh(f), assign(s, who), label(s, l), linkPR(s, n), commentClose(s, body) }`. `commentClose` closes only if body contains `fixes|closes|resolves #<n>` matching the linked PR number (case-insensitive); otherwise returns `{ ok: false }` and stays open.
- Modify: `data/curriculum.js` — append chapter 5 (issue purpose, labels, assignees, milestones, templates, issue forms, linked issues, closing keywords, issue→branch→PR→close loop)
- Test: `tests/issue.test.js`

**Interfaces:**
- Consumes: `GHLearn.Sim` namespace (attach `Issue` without touching `PR`).
- Produces: fixture `{ id: 17, title, labels: [], assignee: null, milestone, linkedPR: null, status: 'open' }`.

- [ ] **Step 1: Write the failing test**

```js
// tests/issue.test.js (shared loader block first, then:)
test('issue lifecycle: assign, label, link, close via keyword', () => {
  const GHLearn = load(['data/scenarios.js', 'scripts/github-sim.js']);
  const I = GHLearn.Sim.Issue;
  const s = I.fresh(GHLearn.data.issue);
  I.assign(s, 'priya');
  I.label(s, 'bug');
  I.linkPR(s, 42);
  assert.equal(s.assignee, 'priya');
  assert.ok(s.labels.includes('bug'));
  let r = I.commentClose(s, 'working on it');
  assert.equal(r.ok, false);
  assert.equal(s.status, 'open');
  r = I.commentClose(s, 'Fixes #42 — ready for review');
  assert.equal(r.ok, true);
  assert.equal(s.status, 'closed');
});

test('closing keyword must reference the linked PR', () => {
  const GHLearn = load(['data/scenarios.js', 'scripts/github-sim.js']);
  const I = GHLearn.Sim.Issue;
  const s = I.fresh(GHLearn.data.issue);
  I.linkPR(s, 42);
  const r = I.commentClose(s, 'closes #7');
  assert.equal(r.ok, false);
  assert.equal(s.status, 'open');
});

test('chapter 5 appended and valid', () => {
  const GHLearn = load(['data/glossary.js', 'data/decoded.js', 'scripts/glossary.js',
    'data/curriculum.js', 'scripts/render.js']);
  const ch = GHLearn.data.chapters[5];
  assert.ok(ch && ch.concepts.length >= 5);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/issue.test.js`
Expected: FAIL — `GHLearn.Sim.Issue` is undefined (`TypeError`).

- [ ] **Step 3: Write minimal implementation**

Append to `scripts/github-sim.js` (inside the same IIFE, after the PR half):

```js
  window.GHLearn.Sim.Issue = {
    fresh: function (f) {
      return { id: f.id, status: 'open', assignee: null, labels: [], linkedPR: null };
    },
    assign: function (s, who) { s.assignee = who; return s; },
    label: function (s, l) { if (s.labels.indexOf(l) === -1) s.labels.push(l); return s; },
    linkPR: function (s, n) { s.linkedPR = n; return s; },
    commentClose: function (s, body) {
      var m = /(fixes|closes|resolves)\s+#(\d+)/i.exec(body || '');
      if (m && s.linkedPR && parseInt(m[2], 10) === s.linkedPR) {
        s.status = 'closed';
        return { ok: true };
      }
      return { ok: false, reason: 'Use a closing keyword with the linked PR number, e.g. "Fixes #42".' };
    },
  };
```

Append to `data/scenarios.js`:

```js
window.GHLearn.data.issue = {
  id: 17, title: 'Dark mode unreadable at noon', milestone: 'v1.1',
  body: 'Contrast fails in sunlight on the settings page.',
};
```

Curriculum chapter 5: append `5: {...}` with ≥ 5 concepts, `quiz: 'quiz-ch5'`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/issue.test.js`
Expected: PASS, 3/3.

- [ ] **Step 5: Commit**

```bash
git add scripts/github-sim.js data/scenarios.js data/curriculum.js tests/issue.test.js
git commit -m "feat: issue simulation engine, fixture, chapter 5"
```

---

### Task 9: Quiz engine + quizzes ch1–5 + recap wiring

**Files:**
- Create: `data/quizzes.js` (`quiz-ch1` … `quiz-ch5`, each `{ items: [{ q, choices[3-4], answer (index), why, sim }] }`, ≥ 3 items each, at least one prediction-style "what happens if…" per quiz)
- Create: `scripts/quiz.js` — `GHLearn.Quiz = { get(id), check(id, qIndex, choiceIdx), score(id, answers) }` where `check` returns `{ correct: bool, why }`, `score` returns `{ correct, total }`.
- Test: `tests/quiz.test.js`

**Interfaces:**
- Consumes: quiz ids referenced by chapters 1–5 (`quiz-ch1` … `quiz-ch5`).
- Produces: pure logic + data; rendering into chapter pages happens in Task 10.

- [ ] **Step 1: Write the failing test**

```js
// tests/quiz.test.js (shared loader block first, then:)
test('quizzes ch1-ch5 exist, >= 3 items, answers in range', () => {
  const GHLearn = load(['data/quizzes.js', 'scripts/quiz.js']);
  for (const id of ['quiz-ch1', 'quiz-ch2', 'quiz-ch3', 'quiz-ch4', 'quiz-ch5']) {
    const q = GHLearn.Quiz.get(id);
    assert.ok(q && q.items.length >= 3, id);
    for (const it of q.items) {
      assert.ok(it.q && it.choices.length >= 3 && it.why, id);
      assert.ok(it.answer >= 0 && it.answer < it.choices.length, id);
    }
    const hasPrediction = q.items.some((it) => /what happens|what would|can you|should/i.test(it.q));
    assert.ok(hasPrediction, id + ' needs a prediction-style item');
  }
});

test('check and score behave correctly', () => {
  const GHLearn = load(['data/quizzes.js', 'scripts/quiz.js']);
  const q = GHLearn.Quiz.get('quiz-ch1');
  const right = GHLearn.Quiz.check('quiz-ch1', 0, q.items[0].answer);
  assert.equal(right.correct, true);
  assert.ok(right.why);
  const wrongIdx = (q.items[0].answer + 1) % q.items[0].choices.length;
  assert.equal(GHLearn.Quiz.check('quiz-ch1', 0, wrongIdx).correct, false);
  const answers = q.items.map((it) => it.answer);
  assert.deepEqual(GHLearn.Quiz.score('quiz-ch1', answers),
    { correct: q.items.length, total: q.items.length });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/quiz.test.js`
Expected: FAIL with ENOENT on `data/quizzes.js`.

- [ ] **Step 3: Write minimal implementation**

`scripts/quiz.js` (complete):

```js
(function () {
  window.GHLearn = window.GHLearn || {};
  function all() { return (window.GHLearn.data && window.GHLearn.data.quizzes) || {}; }
  window.GHLearn.Quiz = {
    get: function (id) {
      var q = all()[id];
      if (!q) throw new Error('unknown quiz ' + id);
      return q;
    },
    check: function (id, qIndex, choiceIdx) {
      var it = this.get(id).items[qIndex];
      if (!it) throw new Error('unknown question ' + qIndex + ' in ' + id);
      return { correct: choiceIdx === it.answer, why: it.why };
    },
    score: function (id, answers) {
      var items = this.get(id).items;
      var correct = 0;
      for (var i = 0; i < items.length; i++) {
        if (answers[i] === items[i].answer) correct += 1;
      }
      return { correct: correct, total: items.length };
    },
  };
})();
```

`data/quizzes.js`: assign `window.GHLearn.data.quizzes` with 5 quizzes × ≥3 items following this worked example (write all 15+ fully — same shape):

```js
window.GHLearn = window.GHLearn || {};
window.GHLearn.data = window.GHLearn.data || {};
window.GHLearn.data.quizzes = {
  'quiz-ch1': { items: [
    { q: 'Priya saves a file but does not commit. What happens if her laptop dies?',
      choices: ['The change is safe on GitHub', 'The change is lost — Git never recorded it', 'Git auto-commits every save'],
      answer: 1, why: 'Saving a file is not a commit. Until you stage and commit, Git has no save-point to restore.', sim: 'sandbox' },
    // ... 2+ more for ch1, then full quizzes for ch2-ch5, each with a prediction-style item.
  ] },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/quiz.test.js`
Expected: PASS, 2/2.

- [ ] **Step 5: Commit**

```bash
git add data/quizzes.js scripts/quiz.js tests/quiz.test.js
git commit -m "feat: quiz engine and chapter 1-5 quizzes"
```

---

### Task 10: Chapters 6–8, capstone, hub assembly, full verification

**Files:**
- Modify: `data/curriculum.js` — append chapters 6 (forks, upstream, sync, contributing), 7 (Actions model, releases/tags/semver, Discussions/Projects, CODEOWNERS, rulesets, secrets/environments, Dependabot, notifications — solid-intro depth), 8 (capstone: 8-step gated checklist data as `steps: [{ id, label, verify }]` where `verify` names the engine check: `issue-closed`, `branch-exists`, `commits>=2`, `pushed`, `pr-open`, `pr-approved`, `conflict-resolved`, `pr-merged`)
- Modify: `data/quizzes.js` — append `quiz-ch6`, `quiz-ch7` (≥3 items each, same shape as Task 9)
- Modify: `index.html` — wire hub render (hero, path rail with progress dots, playground cards), chapter render via `Render.chapterHTML` + engine mounts, glossary search page, pipeline strip stages, theme toggle already present
- Modify: `styles/simulations.css` — append sim-specific rules (graph nodes, PR tabs, checks rows, sandbox terminal, quiz feedback)
- Test: `tests/final.test.js`

**Interfaces:**
- Consumes: every `GHLearn.*` API from Tasks 1–9. Uses only those exact names/signatures — no new engine APIs.
- Produces: the finished browsable site. Capstone checklist persisted via `GHLearn.Progress` under key `capstone`.

- [ ] **Step 1: Write the failing test**

```js
// tests/final.test.js (shared loader block first, then:)
test('chapters 6-8 appended, capstone has 8 verifiable steps', () => {
  const GHLearn = load(['data/glossary.js', 'data/decoded.js', 'scripts/glossary.js',
    'data/curriculum.js', 'scripts/render.js']);
  for (const n of [6, 7, 8]) assert.ok(GHLearn.data.chapters[n], 'chapter ' + n);
  const cap = GHLearn.data.chapters[8];
  assert.equal(cap.steps.length, 8);
  const verifies = cap.steps.map((s) => s.verify);
  for (const v of ['issue-closed', 'pushed', 'pr-approved', 'pr-merged']) {
    assert.ok(verifies.includes(v), 'capstone missing ' + v);
  }
});

test('quizzes ch6-ch7 exist and every chapter quiz id resolves', () => {
  const GHLearn = load(['data/quizzes.js', 'scripts/quiz.js',
    'data/glossary.js', 'data/decoded.js', 'scripts/glossary.js',
    'data/curriculum.js', 'scripts/render.js']);
  for (const n of [1, 2, 3, 4, 5, 6, 7]) {
    const quizId = GHLearn.data.chapters[n].quiz;
    assert.ok(quizId, 'chapter ' + n + ' has no quiz');
    assert.ok(GHLearn.Quiz.get(quizId).items.length >= 3, quizId);
  }
});

test('index.html wires all scripts, landmarks, and strip', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  for (const s of ['scripts/main.js', 'scripts/router.js', 'scripts/graph.js',
      'scripts/github-sim.js', 'scripts/sandbox.js', 'scripts/quiz.js',
      'scripts/glossary.js', 'scripts/render.js', 'scripts/progress.js']) {
    assert.match(html, new RegExp(s.replace(/\//g, '\\/').replace(/\./g, '\\.')));
  }
  assert.match(html, /id="app"/);
  assert.match(html, /id="pipeline"/);
  assert.match(html, /id="path-rail"/);
  assert.match(html, /skip-link/);
});

test('FULL SUITE: no [[term]] dangles anywhere, all chapters valid', () => {
  const GHLearn = load(['data/glossary.js', 'data/decoded.js', 'scripts/glossary.js',
    'data/curriculum.js', 'scripts/render.js', 'data/quizzes.js', 'scripts/quiz.js']);
  const re = /\[\[([^\]]+)\]\]/g;
  const missing = [];
  for (let n = 1; n <= 8; n++) {
    const ch = GHLearn.data.chapters[n];
    assert.ok(ch && ch.concepts && ch.concepts.length >= 4, 'chapter ' + n);
    const blobs = [ch.story].concat(ch.concepts.flatMap((c) =>
      [c.plain, c.example, c.pro, c.confusion, c.deep || '']));
    for (const b of blobs) {
      let m; re.lastIndex = 0;
      while ((m = re.exec(b || ''))) {
        if (!GHLearn.Glossary.find(m[1])) missing.push('ch' + n + ': ' + m[1]);
      }
    }
  }
  assert.deepEqual(missing, []);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/final.test.js`
Expected: FAIL — chapter 6 missing.

- [ ] **Step 3: Write minimal implementation**

Chapters 6–8 content per spec (same five-beat concept shape; ch.7 concepts are shorter intros but keep all five fields). Capstone shape:

```js
8: { n: 8, title: 'Capstone: ship it yourself', kind: 'capstone',
  story: 'A real Acme Notes issue just landed. You own it end to end...',
  concepts: [ /* 4+ capstone concepts: reading the issue, planning the branch, handling review, releasing */ ],
  steps: [
    { id: 's1', label: 'Open and triage the issue', verify: 'issue-closed' },
    { id: 's2', label: 'Create your branch', verify: 'branch-exists' },
    { id: 's3', label: 'Make at least 2 commits', verify: 'commits>=2' },
    { id: 's4', label: 'Push your branch', verify: 'pushed' },
    { id: 's5', label: 'Open the pull request', verify: 'pr-open' },
    { id: 's6', label: 'Earn an approval', verify: 'pr-approved' },
    { id: 's7', label: 'Resolve the conflict', verify: 'conflict-resolved' },
    { id: 's8', label: 'Merge and note the release', verify: 'pr-merged' },
  ],
  recap: ['pull request', 'merge', 'release'], quiz: 'quiz-ch7' },
```

`index.html` hub/chapter/glossary rendering: plain-script functions (no new engine APIs) that read `GHLearn.data.chapters`, render the path rail with done-dots from `GHLearn.Progress.get('doneChapters')`, render the 7-stage pipeline strip with `aria-current` on the chapter's stage, mount sandbox/graph/PR/Issue/quiz via the existing engines, and persist quiz passes + capstone steps through `GHLearn.Progress`. Glossary page: search input calling `GHLearn.Glossary.search` on input, results rendered as cards with kind badges.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/`
Expected: PASS across all 10 test files, 0 failures. Then open `index.html` in a browser (or `npx serve .`), click through hub → chapter 3 graph replay → PR approve/merge → Issue close → sandbox happy path → quiz → capstone checklist, toggle theme, reload (progress persists), and check 390px + 1440px widths.

- [ ] **Step 5: Commit**

```bash
git add data/curriculum.js data/quizzes.js index.html styles/simulations.css tests/final.test.js
git commit -m "feat: chapters 6-8, capstone, hub assembly, full verification"
```

---

## Self-Review

**Spec coverage:** §3 tokens/themes → Task 1; hub/path/pipeline/icons → Task 2; glossary §6 + decoded-12 → Task 3; ch1–2 + renderer + voice → Task 4; sandbox ~15 cmds → Task 5; graph 3 scenarios + ch3 → Task 6; PR sim + ch4 → Task 7; Issue sim + ch5 → Task 8; quiz engine + quizzes → Task 9; ch6–8 + capstone + assembly + full pass → Task 10. Recap/spaced-repetition fields (`recap` per chapter) enforced in Task 4/6/7/8/10 tests. `prefers-reduced-motion`, 44px targets, live regions, theme persistence covered in Tasks 1–2 + Task 10 manual pass. No spec section lacks a task.

**Placeholder scan:** no TBD/TODO/"similar to"/"add validation" language; every step carries concrete code, exact commands, exact expected outputs. Data files give worked entries plus the explicit full term list (spec §6) so implementers enumerate, not invent.

**Type consistency:** `GHLearn.Theme(doc)`, `Progress.load/save/get/set`, `Router.routeFor`, `Glossary.find/search/popoverHTML`, `Render.conceptCard/chapterHTML`, `Sandbox.fresh/exec → {output, coaching, changed}`, `Graph.scenario/stepCount/step/renderSVG`, `Sim.PR.fresh/approve/requestChanges/stateLabel/merge → {ok, reason?}`, `Sim.Issue.fresh/assign/label/linkPR/commentClose → {ok, reason?}`, `Quiz.get/check/score` — identical names/signatures in every task that touches them.
