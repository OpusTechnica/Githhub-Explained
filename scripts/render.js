(function () {
  window.GHLearn = window.GHLearn || {};
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function linkTerms(text) {
    return esc(text).replace(/\[\[([^\]]+)\]\]/g, function (_, t) {
      return '<button type="button" class="term-link" data-term="' + esc(t) + '">' + esc(t) + '</button>';
    });
  }
  function badge(kind) {
    if (kind === 'git') return '<span class="badge-git">Git</span>';
    if (kind === 'github') return '<span class="badge-github">GitHub</span>';
    return '<span class="badge-git">Git</span> <span class="badge-github">GitHub</span>';
  }
  window.GHLearn.Render = {
    conceptCard: function (c) {
      var h = '<article class="card concept">' + badge(c.kind)
        + '<h3>' + esc(c.heading) + '</h3>'
        + '<p>' + linkTerms(c.plain) + '</p>'
        + '<p class="teacher-note">' + linkTerms(c.example) + '</p>'
        + '<p><strong>Developers say:</strong> ' + linkTerms(c.pro) + '</p>'
        + '<p><strong>Watch out:</strong> ' + linkTerms(c.confusion) + '</p>';
      if (c.deep) h += '<details><summary>Take it deeper (optional)</summary><p>' + linkTerms(c.deep) + '</p></details>';
      return h + '</article>';
    },
    chapterHTML: function (ch) {
      var h = '<h2>Chapter ' + ch.n + ': ' + esc(ch.title) + '</h2>'
        + '<p class="story">' + linkTerms(ch.story) + '</p>';
      for (var i = 0; i < ch.concepts.length; i++) h += this.conceptCard(ch.concepts[i]);
      return h;
    },
  };
})();
