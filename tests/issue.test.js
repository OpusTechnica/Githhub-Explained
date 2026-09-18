const test = require('node:test');
const assert = require('node:assert'); // loose: vm-realm arrays fail strict prototype check
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
function load(files) {
  const sandbox = { window: {}, localStorage: null, document: null };
  sandbox.window.GHLearn = {};
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
