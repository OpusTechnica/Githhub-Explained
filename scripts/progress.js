(function () {
  window.GHLearn = window.GHLearn || {};
  var KEY = 'ghlearn-progress-v1';
  function blank() { return { doneChapters: [], quizScores: {} }; }
  function store() { try { return window.localStorage; } catch (e) { return null; } }
  window.GHLearn.Progress = {
    load: function () {
      var s = store();
      if (!s) return blank();
      try {
        var p = JSON.parse(s.getItem(KEY) || 'null');
        if (!p || !Array.isArray(p.doneChapters)) return blank();
        if (!p.quizScores || typeof p.quizScores !== 'object') p.quizScores = {};
        return p;
      } catch (e) { return blank(); }
    },
    save: function (p) {
      var s = store();
      if (s) s.setItem(KEY, JSON.stringify(p));
    },
    get: function (k) { return this.load()[k]; },
    set: function (k, v) { var p = this.load(); p[k] = v; this.save(p); },
  };
})();
