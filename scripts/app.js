(function () {
  window.GHLearn = window.GHLearn || {};
  var STAGES = ['Commit', 'Branch', 'Push', 'Pull request', 'Review', 'Merge', 'Release'];
  var STAGE_FOR_CHAPTER = { 1: 0, 2: 0, 3: 1, 4: 3, 5: 3, 6: 2, 7: 6, 8: 5 };

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function chapters() { return (window.GHLearn.data && window.GHLearn.data.chapters) || {}; }
  function doneList() {
    try { return window.GHLearn.Progress.get('doneChapters') || []; }
    catch (e) { return []; }
  }
  function markDone(n) {
    var d = doneList().slice();
    if (d.indexOf(n) === -1) { d.push(n); window.GHLearn.Progress.set('doneChapters', d); }
  }

  function renderPipeline(activeStage) {
    var el = document.getElementById('pipeline');
    if (!el) return;
    var h = '';
    for (var i = 0; i < STAGES.length; i++) {
      h += '<span class="stage"' + (i === activeStage ? ' aria-current="step"' : '') + '>'
        + esc(STAGES[i]) + '</span>';
      if (i < STAGES.length - 1) h += '<span aria-hidden="true">→</span>';
    }
    el.innerHTML = h;
  }

  function renderRail() {
    var el = document.getElementById('path-rail');
    if (!el) return;
    var chs = chapters();
    var done = doneList();
    var h = '<a href="#/hub">Hub</a>';
    for (var n = 1; n <= 8; n++) {
      if (!chs[n]) continue;
      var dot = done.indexOf(n) !== -1 ? ' ●' : ' ○';
      h += ' <a href="#/chapter-' + n + '"' + (done.indexOf(n) !== -1 ? ' aria-label="Chapter ' + n + ' done"' : '') + '>'
        + 'Ch ' + n + esc(dot) + '</a>';
    }
    h += ' <a href="#/glossary">Glossary</a>';
    el.innerHTML = h;
  }

  function mountSims(root, ch) {
    // Graph replay mount for chapter 3 (uses existing Graph engine)
    var g = root.querySelector('[data-sim="graph"]');
    if (g && window.GHLearn.Graph) {
      var id = 'diverge-merge', idx = 0;
      g.innerHTML = '<div class="sim sim-graph" role="group" aria-label="Branch graph replay">'
        + '<div data-graph-out></div>'
        + '<p><button type="button" class="btn" data-graph-prev>Back</button> '
        + '<button type="button" class="btn" data-graph-next>Next</button> '
        + '<span data-graph-label aria-live="polite"></span></p></div>';
      var out = g.querySelector('[data-graph-out]');
      var label = g.querySelector('[data-graph-label]');
      var total = window.GHLearn.Graph.stepCount(id);
      var draw = function () {
        var st = window.GHLearn.Graph.step(id, idx);
        out.innerHTML = window.GHLearn.Graph.renderSVG(id, idx);
        label.textContent = st.label + ' (' + (idx + 1) + '/' + total + ')';
      };
      g.querySelector('[data-graph-prev]').addEventListener('click', function () {
        if (idx > 0) idx -= 1; draw();
      });
      g.querySelector('[data-graph-next]').addEventListener('click', function () {
        if (idx < total - 1) idx += 1; draw();
      });
      draw();
    }
    // PR sim mount (uses existing Sim.PR engine)
    var p = root.querySelector('[data-sim="pr"]');
    if (p && window.GHLearn.Sim && window.GHLearn.data.pr) {
      var s = window.GHLearn.Sim.PR.fresh(window.GHLearn.data.pr);
      p.innerHTML = '<div class="sim sim-pr" role="group" aria-label="Pull request playground">'
        + '<div class="tabs" role="tablist"><button type="button" aria-selected="true">Conversation</button>'
        + '<button type="button" aria-selected="false">Checks</button></div>'
        + '<p class="checks-row" data-pr-state aria-live="polite"></p>'
        + '<p><button type="button" class="btn" data-pr-approve>Approve</button> '
        + '<button type="button" class="btn" data-pr-merge>Merge (squash)</button></p></div>';
      var state = p.querySelector('[data-pr-state]');
      var paint = function () {
        state.textContent = 'PR #' + window.GHLearn.data.pr.id + ': '
          + window.GHLearn.Sim.PR.stateLabel(s) + ' — checks: '
          + s.checks.map(function (c) { return c.name + ':' + c.status; }).join(', ');
      };
      p.querySelector('[data-pr-approve]').addEventListener('click', function () {
        window.GHLearn.Sim.PR.approve(s); paint();
      });
      p.querySelector('[data-pr-merge]').addEventListener('click', function () {
        window.GHLearn.Sim.PR.merge(s, 'squash'); paint();
      });
      paint();
    }
    // Issue sim mount (uses existing Sim.Issue engine)
    var is = root.querySelector('[data-sim="issue"]');
    if (is && window.GHLearn.Sim && window.GHLearn.data.issue) {
      var st2 = window.GHLearn.Sim.Issue.fresh(window.GHLearn.data.issue);
      window.GHLearn.Sim.Issue.assign(st2, 'sam');
      window.GHLearn.Sim.Issue.label(st2, 'bug');
      window.GHLearn.Sim.Issue.linkPR(st2, 42);
      is.innerHTML = '<div class="sim sim-issue" role="group" aria-label="Issue playground">'
        + '<p>#' + st2.id + ' ' + esc(window.GHLearn.data.issue.title) + '</p>'
        + '<p data-issue-state aria-live="polite"></p>'
        + '<p><button type="button" class="btn" data-issue-close>Close with "Fixes #42"</button></p></div>';
      var istate = is.querySelector('[data-issue-state]');
      var ipaint = function () { istate.textContent = 'Status: ' + st2.status; };
      is.querySelector('[data-issue-close]').addEventListener('click', function () {
        window.GHLearn.Sim.Issue.commentClose(st2, 'Fixes #42'); ipaint();
      });
      ipaint();
    }
    // Sandbox mount (uses existing Sandbox engine)
    var sb = root.querySelector('[data-sim="sandbox"]');
    if (sb && window.GHLearn.Sandbox) {
      var bst = window.GHLearn.Sandbox.fresh();
      sb.innerHTML = '<div class="sim sim-sandbox" role="group" aria-label="Command sandbox">'
        + '<div class="sandbox-term" data-sb-out aria-live="polite"></div>'
        + '<p><input type="text" data-sb-in aria-label="Type a git command" placeholder="try: status"> '
        + '<button type="button" class="btn" data-sb-run>Run</button> '
        + '<button type="button" class="btn" data-sb-happy>Run happy path</button></p></div>';
      var sout = sb.querySelector('[data-sb-out]');
      var sin = sb.querySelector('[data-sb-in]');
      var say = function (t) { sout.innerHTML += '<p>' + esc(t) + '</p>'; };
      var run = function (line) {
        var r = window.GHLearn.Sandbox.exec(bst, line);
        say('$ ' + line);
        say(r.output);
        if (r.coaching) say(r.coaching);
      };
      sb.querySelector('[data-sb-run]').addEventListener('click', function () {
        if (sin.value.trim()) { run(sin.value.trim()); sin.value = ''; }
      });
      sb.querySelector('[data-sb-happy]').addEventListener('click', function () {
        var script = (ch.sandbox && ch.sandbox.script) || ['status'];
        script.forEach(run);
      });
    }
    // Quiz mount (uses existing Quiz engine; persists pass via Progress)
    var qz = root.querySelector('[data-sim="quiz"]');
    if (qz && window.GHLearn.Quiz && ch.quiz) {
      var quiz = window.GHLearn.Quiz.get(ch.quiz);
      var answers = [];
      var h = '<div class="sim sim-quiz" role="group" aria-label="Chapter quiz"><ol>';
      quiz.items.forEach(function (it, qi) {
        h += '<li><p>' + esc(it.q) + '</p>';
        it.choices.forEach(function (c, ci) {
          h += '<label><input type="radio" name="q' + qi + '" value="' + ci + '"> ' + esc(c) + '</label><br>';
        });
        h += '<p class="quiz-feedback" data-qf="' + qi + '" aria-live="polite"></p></li>';
      });
      h += '</ol><p><button type="button" class="btn btn-primary" data-quiz-check>Check answers</button> '
        + '<span data-quiz-score aria-live="polite"></span></p></div>';
      qz.innerHTML = h;
      qz.querySelector('[data-quiz-check]').addEventListener('click', function () {
        answers = quiz.items.map(function (it, qi) {
          var sel = qz.querySelector('input[name="q' + qi + '"]:checked');
          return sel ? parseInt(sel.value, 10) : -1;
        });
        var res = window.GHLearn.Quiz.score(ch.quiz, answers);
        quiz.items.forEach(function (it, qi) {
          var r = window.GHLearn.Quiz.check(ch.quiz, qi, answers[qi]);
          var f = qz.querySelector('[data-qf="' + qi + '"]');
          f.textContent = (r.correct ? 'Correct. ' : 'Not quite. ') + r.why;
          f.className = 'quiz-feedback ' + (r.correct ? 'quiz-ok' : 'quiz-no');
        });
        qz.querySelector('[data-quiz-score]').textContent = res.correct + '/' + res.total + ' correct';
        if (res.correct === res.total) {
          var scores = {};
          try { scores = window.GHLearn.Progress.get('quizScores') || {}; } catch (e) { scores = {}; }
          scores[ch.quiz] = res.correct;
          window.GHLearn.Progress.set('quizScores', scores);
          markDone(ch.n);
          renderRail();
        }
      });
    }
  }

  function mountCapstone(root, ch) {
    var el = root.querySelector('[data-capstone]');
    if (!el) return;
    var saved = [];
    try { saved = window.GHLearn.Progress.get('capstone') || []; } catch (e) { saved = []; }
    var h = '<div class="sim sim-capstone" role="group" aria-label="Capstone checklist"><ol>';
    ch.steps.forEach(function (s) {
      var done = saved.indexOf(s.id) !== -1;
      h += '<li><label><input type="checkbox" data-step="' + esc(s.id) + '"' + (done ? ' checked' : '')
        + '> ' + esc(s.label) + ' <span class="sha">[' + esc(s.verify) + ']</span></label></li>';
    });
    h += '</ol><p data-cap-progress aria-live="polite"></p></div>';
    el.innerHTML = h;
    var paint = function () {
      var boxes = el.querySelectorAll('input[data-step]');
      var n = 0;
      boxes.forEach(function (b) { if (b.checked) n += 1; });
      el.querySelector('[data-cap-progress]').textContent = n + '/' + ch.steps.length + ' steps done';
    };
    el.querySelectorAll('input[data-step]').forEach(function (box) {
      box.addEventListener('change', function () {
        var cur = [];
        try { cur = window.GHLearn.Progress.get('capstone') || []; } catch (e) { cur = []; }
        cur = cur.slice();
        if (box.checked && cur.indexOf(box.getAttribute('data-step')) === -1) cur.push(box.getAttribute('data-step'));
        if (!box.checked) cur = cur.filter(function (x) { return x !== box.getAttribute('data-step'); });
        window.GHLearn.Progress.set('capstone', cur);
        if (cur.length === ch.steps.length) markDone(ch.n);
        renderRail();
        paint();
      });
    });
    paint();
  }

  function hubHTML() {
    var chs = chapters();
    var done = doneList();
    var h = '<section class="hero"><h1>GitHub, Finally Explained</h1>'
      + '<p>From first commit to confident collaborator: branches, pull requests, issues, forks, robots, and releases.</p>'
      + '<p><a class="btn btn-primary" href="#/chapter-1">Start Chapter 1</a> '
      + '<a class="btn" href="#/glossary">Browse glossary</a></p></section>';
    h += '<section aria-label="Learning path"><h2>Your path</h2>';
    for (var n = 1; n <= 8; n++) {
      if (!chs[n]) continue;
      var isDone = done.indexOf(n) !== -1;
      h += '<article class="card playground-card"><h3>Chapter ' + n + ': ' + esc(chs[n].title) + (isDone ? ' ✓' : '') + '</h3>'
        + '<p><a class="btn" href="#/chapter-' + n + '">Open chapter ' + n + '</a></p></article>';
    }
    h += '</section>';
    h += '<section aria-label="Playgrounds"><h2>Playgrounds</h2>'
      + '<article class="card playground-card"><h3>Command sandbox</h3><p>Practice clone, status, commit, push safely.</p><p><a class="btn" href="#/chapter-2">Try it in Chapter 2</a></p></article>'
      + '<article class="card playground-card"><h3>Branch graph lab</h3><p>Replay merges, rebases, and conflicts.</p><p><a class="btn" href="#/chapter-3">Try it in Chapter 3</a></p></article>'
      + '<article class="card playground-card"><h3>PR &amp; Issue sims</h3><p>Approve, merge, close tickets.</p><p><a class="btn" href="#/chapter-4">Try it in Chapter 4</a></p></article>'
      + '</section>';
    return h;
  }

  function chapterHTML(n) {
    var ch = chapters()[n];
    if (!ch) return '<p>Unknown chapter. <a href="#/hub">Back to hub</a>.</p>';
    var h = window.GHLearn.Render.chapterHTML(ch);
    if (n === 3) h += '<div data-sim="graph"></div>';
    if (n === 4) h += '<div data-sim="pr"></div>';
    if (n === 5) h += '<div data-sim="issue"></div>';
    if (ch.sandbox) h += '<div data-sim="sandbox"></div>';
    if (ch.quiz) h += '<div data-sim="quiz"></div>';
    if (ch.kind === 'capstone') h += '<div data-capstone></div>';
    h += '<p><a class="btn" href="#/hub">Back to hub</a> ';
    if (n < 8 && chapters()[n + 1]) h += '<a class="btn btn-primary" href="#/chapter-' + (n + 1) + '">Next: chapter ' + (n + 1) + '</a>';
    h += '</p>';
    return h;
  }

  function glossaryHTML() {
    return '<h2>Glossary</h2>'
      + '<p><input type="search" id="glossary-search" aria-label="Search glossary" placeholder="Search terms…"></p>'
      + '<div id="glossary-results" aria-live="polite"></div>';
  }

  function paintGlossary() {
    var input = document.getElementById('glossary-search');
    var out = document.getElementById('glossary-results');
    if (!input || !out) return;
    var draw = function () {
      var list = window.GHLearn.Glossary.search(input.value);
      out.innerHTML = list.map(function (e) {
        return '<article class="card glossary-card"><h3>' + esc(e.term) + ' '
          + '<span class="badge-' + (e.kind === 'git' ? 'git' : 'github') + '">' + esc(e.kind) + '</span></h3>'
          + '<p>' + esc(e.plain) + '</p></article>';
      }).join('') || '<p>No matches.</p>';
    };
    input.addEventListener('input', draw);
    draw();
  }

  function render() {
    var app = document.getElementById('app');
    if (!app) return;
    var route = window.GHLearn.Router.routeFor(window.location.hash);
    renderRail();
    if (route === 'glossary') {
      renderPipeline(-1);
      app.innerHTML = glossaryHTML();
      paintGlossary();
      return;
    }
    if (route.indexOf('chapter-') === 0) {
      var n = parseInt(route.split('-')[1], 10);
      var ch = chapters()[n];
      renderPipeline(ch ? (STAGE_FOR_CHAPTER[n] == null ? -1 : STAGE_FOR_CHAPTER[n]) : -1);
      app.innerHTML = chapterHTML(n);
      if (ch) { mountSims(app, ch); mountCapstone(app, ch); }
      return;
    }
    renderPipeline(-1);
    app.innerHTML = hubHTML();
  }

  window.GHLearn.App = { render: render, renderPipeline: renderPipeline, renderRail: renderRail };
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('DOMContentLoaded', function () {
      render();
      window.addEventListener('hashchange', render);
    });
  }
})();
