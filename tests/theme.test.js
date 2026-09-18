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
