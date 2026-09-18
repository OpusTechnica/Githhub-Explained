(function () {
  window.GHLearn = window.GHLearn || {};
  var CHAPTERS = 8;
  window.GHLearn.Router = {
    parseHash: function (hash) {
      hash = (hash || '').replace(/^#/, '');
      if (hash.charAt(0) === '/') hash = hash.slice(1);
      return hash;
    },
    routeFor: function (hash) {
      var h = this.parseHash(hash);
      if (h === '' || h === 'hub') return 'hub';
      if (h === 'glossary' || h === 'playground') return h;
      var m = /^chapter-([1-8])$/.exec(h);
      if (m) return 'chapter-' + m[1];
      return 'hub';
    },
    chapterCount: function () { return CHAPTERS; },
  };
})();
