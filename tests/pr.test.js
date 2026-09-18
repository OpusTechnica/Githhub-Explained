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
