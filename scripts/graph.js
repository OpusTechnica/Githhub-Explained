(function () {
  window.GHLearn = window.GHLearn || {};
  function all() { return (window.GHLearn.data && window.GHLearn.data.scenarios) || {}; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  window.GHLearn.Graph = {
    scenario: function (id) {
      var sc = all()[id];
      if (!sc) throw new Error('unknown scenario ' + id);
      return sc;
    },
    stepCount: function (id) { return this.scenario(id).steps.length; },
    step: function (id, i) {
      var steps = this.scenario(id).steps;
      if (i < 0) i = 0;
      if (i >= steps.length) i = steps.length - 1;
      return steps[i];
    },
    renderSVG: function (id, i) {
      var sc = this.scenario(id);
      var st = this.step(id, i);
      var laneY = {};
      sc.lanes.forEach(function (l, k) { laneY[l] = 40 + k * 48; });
      var W = 120 + st.nodes.length * 90;
      var H = 40 + sc.lanes.length * 48;
      var h = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(sc.title) + '">';
      sc.lanes.forEach(function (l) {
        h += '<text x="8" y="' + (laneY[l] + 4) + '" font-size="12" fill="currentColor">' + esc(l) + '</text>';
      });
      var byLane = {};
      st.nodes.forEach(function (n) {
        byLane[n.lane] = byLane[n.lane] || [];
        byLane[n.lane].push(n);
      });
      Object.keys(byLane).forEach(function (lane) {
        var pts = byLane[lane].map(function (n, k) { return (110 + k * 90) + ',' + laneY[lane]; });
        h += '<path d="M' + pts.join(' L') + '" fill="none" stroke="currentColor" stroke-width="2"/>';
      });
      st.nodes.forEach(function (n, k) {
        var x = 110 + Object.keys(byLane).reduce(function (acc, lane) {
          return acc;
        }, 0) + k * 90;
        var y = laneY[n.lane];
        h += '<circle cx="' + x + '" cy="' + y + '" r="10" data-node="' + esc(n.id) + '">'
          + '<title>' + esc(n.msg) + '</title></circle>';
        h += '<text x="' + (x - 18) + '" y="' + (y - 16) + '" font-size="10" class="sha">' + esc(n.id) + '</text>';
        if (n.head) h += '<text x="' + (x + 14) + '" y="' + (y + 4) + '" font-size="10">HEAD</text>';
      });
      return h + '</svg>';
    },
  };
})();
