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
})();
