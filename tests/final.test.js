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
