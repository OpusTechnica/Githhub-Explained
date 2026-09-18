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
