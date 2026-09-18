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

test('quizzes ch1-ch5 exist, >= 3 items, answers in range', () => {
  const GHLearn = load(['data/quizzes.js', 'scripts/quiz.js']);
  for (const id of ['quiz-ch1', 'quiz-ch2', 'quiz-ch3', 'quiz-ch4', 'quiz-ch5']) {
    const q = GHLearn.Quiz.get(id);
    assert.ok(q && q.items.length >= 3, id);
    for (const it of q.items) {
      assert.ok(it.q && it.choices.length >= 3 && it.why, id);
      assert.ok(it.answer >= 0 && it.answer < it.choices.length, id);
    }
    const hasPrediction = q.items.some((it) => /what happens|what would|can you|should/i.test(it.q));
    assert.ok(hasPrediction, id + ' needs a prediction-style item');
  }
});

test('check and score behave correctly', () => {
  const GHLearn = load(['data/quizzes.js', 'scripts/quiz.js']);
  const q = GHLearn.Quiz.get('quiz-ch1');
  const right = GHLearn.Quiz.check('quiz-ch1', 0, q.items[0].answer);
  assert.equal(right.correct, true);
  assert.ok(right.why);
  const wrongIdx = (q.items[0].answer + 1) % q.items[0].choices.length;
  assert.equal(GHLearn.Quiz.check('quiz-ch1', 0, wrongIdx).correct, false);
  const answers = q.items.map((it) => it.answer);
  assert.deepEqual(GHLearn.Quiz.score('quiz-ch1', answers),
    { correct: q.items.length, total: q.items.length });
});
