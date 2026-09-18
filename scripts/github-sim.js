(function () {
  window.GHLearn = window.GHLearn || {};
  window.GHLearn.Sim = window.GHLearn.Sim || {};
  function checksPass(s) { return s.checks.every(function (c) { return c.status === 'pass'; }); }
  window.GHLearn.Sim.PR = {
    fresh: function (fixture) {
      return { status: 'open', approvals: 0, changes: [],
        merged: null, checks: fixture.checks.map(function (c) { return { name: c.name, status: c.status }; }) };
    },
    approve: function (s) { s.approvals += 1; if (!s.changes.length) s.status = 'approved'; return s; },
    requestChanges: function (s, comment) {
      s.changes.push(comment || 'changes requested');
      s.status = 'changes-requested';
      return s;
    },
    stateLabel: function (s) {
      if (s.status === 'merged') return 'Merged';
      if (s.status === 'approved') return 'Approved';
      if (s.status === 'changes-requested') return 'Changes requested';
      return 'Open';
    },
    merge: function (s, mode) {
      if (s.status === 'merged') return { ok: false, reason: 'Already merged.' };
      if (s.changes.length) return { ok: false, reason: 'A reviewer requested changes. Address them and get a fresh approval first.' };
      if (s.approvals < 1) return { ok: false, reason: 'Needs at least one approval before merging.' };
      if (!checksPass(s)) return { ok: false, reason: 'Checks are failing. Fix them first.' };
      if (['merge', 'squash', 'rebase'].indexOf(mode) === -1) return { ok: false, reason: 'Pick merge, squash, or rebase.' };
      s.status = 'merged';
      s.merged = mode;
      return { ok: true };
    },
  };
  window.GHLearn.Sim.Issue = {
    fresh: function (f) {
      return { id: f.id, status: 'open', assignee: null, labels: [], linkedPR: null };
    },
    assign: function (s, who) { s.assignee = who; return s; },
    label: function (s, l) { if (s.labels.indexOf(l) === -1) s.labels.push(l); return s; },
    linkPR: function (s, n) { s.linkedPR = n; return s; },
    commentClose: function (s, body) {
      var m = /(fixes|closes|resolves)\s+#(\d+)/i.exec(body || '');
      if (m && s.linkedPR && parseInt(m[2], 10) === s.linkedPR) {
        s.status = 'closed';
        return { ok: true };
      }
      return { ok: false, reason: 'Use a closing keyword with the linked PR number, e.g. "Fixes #42".' };
    },
  };
})();
