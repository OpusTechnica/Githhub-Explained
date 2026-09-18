window.GHLearn = window.GHLearn || {};
window.GHLearn.data = window.GHLearn.data || {};
window.GHLearn.data.scenarios = {
  'diverge-merge': { title: 'Two branches diverge, then merge',
    lanes: ['main', 'dark-mode'],
    steps: [
      { label: 'Start: one shared save-point', note: 'Both branches point at the same commit.',
        nodes: [{ id: 'c1', lane: 'main', msg: 'initial commit', head: true }] },
      { label: 'Work splits', note: 'Sam commits on main; Priya commits on dark-mode.',
        nodes: [{ id: 'c1', lane: 'main', msg: 'initial commit' }, { id: 'c2', lane: 'main', msg: 'fix typo', head: true }, { id: 'c3', lane: 'dark-mode', msg: 'dark theme' }] },
      { label: 'Merge', note: 'Priya merges dark-mode into main. One story again.',
        nodes: [{ id: 'c1', lane: 'main', msg: 'initial commit' }, { id: 'c2', lane: 'main', msg: 'fix typo' }, { id: 'c3', lane: 'dark-mode', msg: 'dark theme' }, { id: 'c4', lane: 'main', msg: 'merge dark-mode', head: true }] },
    ] },
  'rebase': { title: 'Rebase: replay onto fresh main',
    lanes: ['main', 'feature'],
    steps: [
      { label: 'Feature branches off old main', note: 'Two commits on feature; main is still.',
        nodes: [{ id: 'c1', lane: 'main', msg: 'base' }, { id: 'c2', lane: 'feature', msg: 'try an idea' }, { id: 'c3', lane: 'feature', msg: 'refine it', head: true }] },
      { label: 'Main moves on', note: 'Sam ships a fix while Priya works.',
        nodes: [{ id: 'c1', lane: 'main', msg: 'base' }, { id: 'c4', lane: 'main', msg: 'hotfix', head: false }, { id: 'c2', lane: 'feature', msg: 'try an idea' }, { id: 'c3', lane: 'feature', msg: 'refine it', head: true }] },
      { label: 'Replayed', note: 'Feature commits replay onto the new tip. Clean, straight history.',
        nodes: [{ id: 'c1', lane: 'main', msg: 'base' }, { id: 'c4', lane: 'main', msg: 'hotfix' }, { id: 'c2r', lane: 'main', msg: 'try an idea (replayed)' }, { id: 'c3r', lane: 'main', msg: 'refine it (replayed)', head: true }] },
    ] },
  'conflict': { title: 'Merge conflict: same line, two edits',
    lanes: ['main', 'feature'],
    steps: [
      { label: 'Same line edited twice', note: 'Both changed the app title. Git cannot choose for you.',
        nodes: [{ id: 'c1', lane: 'main', msg: 'base', head: false }, { id: 'c2', lane: 'main', msg: 'title: Acme Notes', head: true }, { id: 'c3', lane: 'feature', msg: 'title: My Notes' }] },
      { label: 'Conflict markers', note: 'Git marks the spot. You pick the winner, then commit.',
        nodes: [{ id: 'c1', lane: 'main', msg: 'base' }, { id: 'c2', lane: 'main', msg: 'title: Acme Notes', head: true }, { id: 'c3', lane: 'feature', msg: 'title: My Notes' }] },
      { label: 'Resolved', note: 'Priya keeps both ideas, commits the resolution.',
        nodes: [{ id: 'c1', lane: 'main', msg: 'base' }, { id: 'c2', lane: 'main', msg: 'title: Acme Notes' }, { id: 'c4', lane: 'main', msg: 'resolve: Acme Notes (dark)', head: true }] },
    ] },
};

window.GHLearn.data.pr = {
  id: 'pr-42', title: 'Add dark mode', branch: 'dark-mode', base: 'main',
  files: [
    { path: 'theme.css', adds: 30, dels: 2 },
    { path: 'app.js', adds: 12, dels: 4 },
    { path: 'README.md', adds: 5, dels: 0 },
  ],
  checks: [
    { name: 'tests', status: 'pass' },
    { name: 'lint', status: 'pass' },
  ],
  reviewers: ['sam'],
};
