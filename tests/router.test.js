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
