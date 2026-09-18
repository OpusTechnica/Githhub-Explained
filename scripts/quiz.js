(function () {
  window.GHLearn = window.GHLearn || {};
  function all() { return (window.GHLearn.data && window.GHLearn.data.quizzes) || {}; }
  window.GHLearn.Quiz = {
    get: function (id) {
      var q = all()[id];
      if (!q) throw new Error('unknown quiz ' + id);
      return q;
    },
    check: function (id, qIndex, choiceIdx) {
      var it = this.get(id).items[qIndex];
      if (!it) throw new Error('unknown question ' + qIndex + ' in ' + id);
      return { correct: choiceIdx === it.answer, why: it.why };
    },
    score: function (id, answers) {
      var items = this.get(id).items;
      var correct = 0;
      for (var i = 0; i < items.length; i++) {
        if (answers[i] === items[i].answer) correct += 1;
      }
      return { correct: correct, total: items.length };
    },
  };
})();
