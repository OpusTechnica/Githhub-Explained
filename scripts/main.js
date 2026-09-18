(function () {
  window.GHLearn = window.GHLearn || {};
  var KEY = 'ghlearn-theme';
  function store() {
    try { return window.localStorage; } catch (e) { return null; }
  }
  window.GHLearn.Theme = {
    get: function () {
      var s = store();
      var v = s ? s.getItem(KEY) : null;
      return v === 'dark' || v === 'light' ? v : null;
    },
    set: function (doc, t) {
      if (t !== 'dark' && t !== 'light') throw new Error('theme must be dark or light');
      doc.documentElement.setAttribute('data-theme', t);
      var s = store();
      if (s) s.setItem(KEY, t);
    },
    init: function (doc) {
      var saved = this.get();
      if (saved) { this.set(doc, saved); return saved; }
      var prefersDark = false;
      try {
        var w = doc && doc.defaultView;
        if (w && w.matchMedia) prefersDark = !!w.matchMedia('(prefers-color-scheme: dark)').matches;
      } catch (e) { prefersDark = false; }
      var t = prefersDark ? 'dark' : 'light';
      this.set(doc, t);
      return t;
    },
  };
})();
