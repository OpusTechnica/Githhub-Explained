const test = require('node:test');
const assert = require('node:assert'); // loose: vm-realm arrays fail strict prototype check
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
      '.pipeline-strip', '.wayfinding', '.site-brand', '.brand-mark',
      '.hero-actions', '.chapter-nav', '.theme-toggle', '.btn-icon', '.header-actions',
      '.header-btn', '.stage-num', '.stage-dot', '.site-brand-text',
      '.skip-link', '.teacher-note', '.tabs']) {
    assert.match(css, new RegExp(cls.replace('.', '\\.') + '\\b'));
  }
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /text-wrap:\s*balance/);
  assert.match(css, /text-decoration:\s*none/);
});

test('theme toggle is icon-only premium circle, header buttons are compact pills', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /id="theme-toggle"/);
  assert.match(html, /class="theme-toggle"/);
  assert.ok(!/class="btn theme-toggle"/.test(html), 'toggle no longer uses .btn shape');
  assert.match(html, /data-theme-label hidden/);
  assert.match(html, /aria-pressed/);
  assert.match(html, /btn-icon/);
  assert.match(html, /class="header-btn"/);
  const svg = fs.readFileSync(path.join(ROOT, 'assets/icons.svg'), 'utf8');
  assert.match(svg, /id="i-sun"/);
  assert.match(svg, /id="i-moon"/);
  const css = fs.readFileSync(path.join(ROOT, 'styles/components.css'), 'utf8');
  assert.match(css, /\.theme-toggle\s*\{[^}]*border-radius:\s*999px/);
  assert.match(css, /\.header-btn\s*\{[^}]*border-radius:\s*999px/);
});

test('pipeline is the single chapter nav: numbered stage links, current marked, done dotted', () => {
  const pipelineEl = { innerHTML: '' };
  const sandbox = { window: {}, localStorage: null, document: null };
  sandbox.window.GHLearn = {};
  const store = {};
  sandbox.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
  sandbox.window.localStorage = sandbox.localStorage;
  sandbox.document = {
    addEventListener: () => {},
    getElementById: (id) => (id === 'pipeline' ? pipelineEl : null),
  };
  vm.createContext(sandbox);
  for (const f of ['scripts/progress.js', 'scripts/router.js', 'scripts/app.js']) {
    const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
    vm.runInContext(code, sandbox, { filename: f });
  }
  const GHLearn = sandbox.window.GHLearn;
  GHLearn.Progress.set('doneChapters', [1, 2]);
  GHLearn.App.renderPipeline(1, 'chapter-3');
  assert.match(pipelineEl.innerHTML, /You are here:/);
  assert.match(pipelineEl.innerHTML, /aria-current="page"/);
  assert.match(pipelineEl.innerHTML, /stage-num/);
  assert.match(pipelineEl.innerHTML, /#\/chapter-3/);
  assert.match(pipelineEl.innerHTML, /stage-dot stage-done/);
  assert.match(pipelineEl.innerHTML, /stage-dot stage-todo/);
  assert.ok(!('renderRail' in GHLearn.App), 'path-rail renderer removed');
  const appSrc = fs.readFileSync(path.join(ROOT, 'scripts/app.js'), 'utf8');
  assert.ok(!/path-rail/.test(appSrc), 'no path-rail references in app.js');
  const css = fs.readFileSync(path.join(ROOT, 'styles/components.css'), 'utf8');
  assert.ok(!/\.path-rail/.test(css), 'no path-rail rules in components.css');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(!/id="path-rail"/.test(html), 'no path-rail node in index.html');
  assert.match(html, /href="#\/hub"/);
  assert.match(html, /href="#\/glossary"/);
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
