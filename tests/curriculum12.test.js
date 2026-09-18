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
