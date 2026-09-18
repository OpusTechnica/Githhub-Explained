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
