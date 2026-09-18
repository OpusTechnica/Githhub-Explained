(function () {
  window.GHLearn = window.GHLearn || {};
  var N = 0;
  function sha() { N += 1; return 'c' + String(N).padStart(4, '0'); }
  function fresh() {
    // Ruling (Task 5): brief tests exec branch/commit on a fresh state without
    // cloning first, so fresh states start cloned. `clone` stays idempotent and
    // the needClone path still guards manually-uncloned states.
    return {
      cloned: true, remoteAhead: 0,
      files: {}, commits: [{ id: 'c0000', msg: 'initial commit' }],
      branches: { main: 0 }, head: 'main', pushed: 1, stash: [],
    };
  }
  function dirtyFiles(st) {
    return Object.keys(st.files).filter(function (f) { return st.files[f] === 'dirty'; });
  }
  function stagedFiles(st) {
    return Object.keys(st.files).filter(function (f) { return st.files[f] === 'staged'; });
  }
  var KNOWN = ['clone', 'status', 'add', 'commit', 'branch', 'switch', 'restore',
    'stash', 'log', 'fetch', 'pull', 'push', 'merge', 'rebase', 'reset'];
  function exec(st, line) {
    var parts = String(line).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return { output: '', coaching: null, changed: false };
    var cmd = parts[0].toLowerCase();
    function needClone() {
      if (!st.cloned) return { output: 'Not a repo yet.', coaching: 'Start with: clone https://github.com/acme/notes.git', changed: false };
      return null;
    }
    if (cmd === 'clone') {
      st.cloned = true;
      return { output: 'Cloned acme/notes. You now have the full history on your computer.', coaching: null, changed: true };
    }
    if (KNOWN.indexOf(cmd) === -1) {
      return { output: 'Unknown command: ' + parts[0], coaching: 'Try one of: ' + KNOWN.join(', '), changed: false };
    }
    var nc = needClone();
    if (nc) return nc;
    if (cmd === 'status') {
      var d = dirtyFiles(st), s = stagedFiles(st);
      var unpushed = Math.max(0, st.commits.length - st.pushed);
      var msg = 'On branch ' + st.head + '. ';
      msg += s.length ? 'Staged: ' + s.join(', ') + '. ' : 'Nothing staged. ';
      msg += d.length ? 'Changed, not staged: ' + d.join(', ') + '. ' : 'Working tree clean. ';
      msg += unpushed ? unpushed + ' save-point(s) not yet on GitHub.' : 'Everything is up to date with origin.';
      return { output: msg, coaching: null, changed: false };
    }
    if (cmd === 'add') {
      var f = parts[1];
      if (!f || st.files[f] !== 'dirty') return { output: 'Nothing to stage.', coaching: 'Edit a file first in your head (mark it dirty), e.g. imagine changing ' + (f || 'app.js') + ', or check status.', changed: false };
      st.files[f] = 'staged';
      return { output: 'Staged ' + f + ' (packed your bag).', coaching: null, changed: true };
    }
    if (cmd === 'commit') {
      var s2 = stagedFiles(st);
      if (!s2.length) return { output: 'Nothing staged, nothing recorded.', coaching: 'Run "add <file>" first, then commit. Staging is packing; committing is taking the photo.', changed: false };
      var m = /-m\s+"([^"]+)"/.exec(line) || /-m\s+'([^']+)'/.exec(line) || /-m\s+(\S+)/.exec(line);
      var msg2 = m ? m[1] : 'work in progress';
      s2.forEach(function (x) { st.files[x] = 'clean'; });
      st.commits.push({ id: sha(), msg: msg2 });
      st.branches[st.head] = st.commits.length - 1;
      return { output: 'Save-point recorded: "' + msg2 + '".', coaching: null, changed: true };
    }
    if (cmd === 'branch') {
      var b = parts[1];
      if (!b) return { output: 'Branch name needed.', coaching: 'Try: branch dark-mode', changed: false };
      if (b === '__proto__' || b === 'constructor' || b === 'prototype') return { output: 'Branch name "' + b + '" is reserved.', coaching: 'Pick a plain branch name like dark-mode or fix-login.', changed: false };
      st.branches[b] = st.branches[st.head];
      return { output: 'Created branch ' + b + ' (duplicated your game save).', coaching: null, changed: true };
    }
    if (cmd === 'switch') {
      var t = parts[1];
      if (!Object.prototype.hasOwnProperty.call(st.branches, t)) return { output: 'No branch ' + t + '.', coaching: 'Create it first: branch ' + (t || 'my-branch'), changed: false };
      st.head = t;
      return { output: 'Now on ' + t + '. Your files reflect its latest save-point.', coaching: null, changed: true };
    }
    if (cmd === 'restore') {
      var rf = parts[1];
      if (rf && st.files[rf] === 'dirty') { st.files[rf] = 'clean'; return { output: rf + ' restored. Your experiment there is gone; history untouched.', coaching: null, changed: true }; }
      return { output: 'Nothing to restore.', coaching: null, changed: false };
    }
    if (cmd === 'stash') {
      var dd = dirtyFiles(st);
      dd.forEach(function (x) { delete st.files[x]; });
      st.stash.push(dd);
      return { output: 'Stashed ' + dd.length + ' file(s) in a drawer. Working tree clean.', coaching: null, changed: true };
    }
    if (cmd === 'log') {
      return { output: st.commits.map(function (c) { return c.id + ' ' + c.msg; }).join('\n'), coaching: null, changed: false };
    }
    if (cmd === 'fetch' || cmd === 'pull') {
      if (st.remoteAhead > 0 && cmd === 'pull') {
        st.remoteAhead = 0;
        return { output: 'Pulled: fetched from origin, then merged. You are up to date.', coaching: null, changed: true };
      }
      return { output: 'Fetched. Origin has nothing new. (pull = fetch + merge.)', coaching: null, changed: false };
    }
    if (cmd === 'push') {
      if (st.commits.length === st.pushed) return { output: 'Everything up-to-date.', coaching: null, changed: false };
      st.pushed = st.commits.length;
      return { output: 'Pushed ' + st.head + ' to origin. Your save-points are now on GitHub.', coaching: null, changed: true };
    }
    if (cmd === 'merge') {
      var mb = parts[1];
      if (!Object.prototype.hasOwnProperty.call(st.branches, mb)) return { output: 'No branch ' + mb + '.', coaching: 'switch to main first, then merge <branch>.', changed: false };
      st.commits.push({ id: sha(), msg: 'merge ' + mb + ' into ' + st.head });
      st.branches[st.head] = st.commits.length - 1;
      return { output: 'Merged ' + mb + ' into ' + st.head + '. Two histories, one story.', coaching: null, changed: true };
    }
    if (cmd === 'rebase') {
      return { output: 'Rebase is covered in Chapter 3 — it replays your save-points onto a fresh base.', coaching: 'Finish chapters 1–2 first, then try the branch lab.', changed: false };
    }
    if (cmd === 'reset') {
      if (st.commits.length > 1) {
        var rm = st.commits.pop();
        st.branches[st.head] = st.commits.length - 1;
        return { output: 'Undid save-point "' + rm.msg + '". (Soft reset: your files are untouched.)', coaching: null, changed: true };
      }
      return { output: 'Nothing to undo.', coaching: null, changed: false };
    }
    return { output: 'Hmm.', coaching: null, changed: false };
  }
  window.GHLearn.Sandbox = { fresh: fresh, exec: exec, commands: KNOWN };
})();
