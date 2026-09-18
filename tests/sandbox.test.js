const test = require('node:test');
const assert = require('node:assert'); // loose: vm-realm values fail strict prototype check
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
