(function () {
  window.GHLearn = window.GHLearn || {};
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  window.GHLearn.Glossary = {
    all: function () { return (window.GHLearn.data && window.GHLearn.data.glossary) || []; },
    find: function (term) {
      var t = String(term).toLowerCase().trim();
      var list = this.all();
      for (var i = 0; i < list.length; i++) {
        if (list[i].term.toLowerCase() === t) return list[i];
      }
      return null;
    },
    search: function (q) {
      q = String(q == null ? '' : q).toLowerCase().trim();
      var list = this.all();
      if (!q) return list.slice();
      return list.filter(function (e) {
        return (e.term + ' ' + e.plain + ' ' + e.pro).toLowerCase().indexOf(q) !== -1;
      });
    },
    popoverHTML: function (term) {
      var e = this.find(term);
      if (!e) return '';
      return '<div class="glossary-pop" role="dialog" aria-label="' + esc(e.term) + '">'
        + '<span class="badge-' + (e.kind === 'git' ? 'git' : 'github') + '">' + (e.kind === 'git' ? 'Git' : 'GitHub') + '</span> '
        + '<strong>' + esc(e.term) + '</strong>'
        + '<p>' + esc(e.plain) + '</p>'
        + '<p class="teacher-note">' + esc(e.example) + '</p></div>';
    },
  };
})();
