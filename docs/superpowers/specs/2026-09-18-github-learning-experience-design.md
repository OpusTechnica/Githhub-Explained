# GitHub Learning Experience — Design Spec

**Date:** 2026-09-18
**Status:** Approved design (Sections 1–5 signed off by human partner)
**Approach:** A — Story-driven journey + shared simulation engine
**Stack:** Static zero-dependency site (HTML + CSS + vanilla JS, no build step)
**Structure:** Hybrid path + hub (guided chapters 1–8 with progress, always-open playgrounds)
**Scope:** Deep core (Git, branches, PRs, Issues, forks, conflicts) + solid intros (Actions, releases, ecosystem)

## 1. Goal & Success Criteria

**Goal:** Take a complete GitHub beginner to an advanced, confident GitHub user through a flagship interactive learning product built around one continuous story.

A complete beginner enters without feeling intimidated. An intermediate developer discovers useful terminology and workflow knowledge. An advanced learner gains a coherent mental model of how GitHub collaboration actually works. After completing the experience, the learner can look at a real GitHub repository and understand what they are seeing, and can follow common PR, Issue, branch, review, CI/CD, release, and collaboration conversations without constantly looking up terminology. The product teaches understanding, not merely vocabulary.

## 2. Global Constraints (binding on every implementation task)

- Zero runtime dependencies: no frameworks, no build step, no CDN JS, no webfont downloads. `index.html` opens directly from disk and from any static host.
- System font stacks only: UI `-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Inter, Helvetica, Arial, sans-serif`; mono `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`.
- Octicon-style icons vendored inline in `assets/icons.svg`; no emoji as icons.
- Light + dark-dimmed themes via `[data-theme]` on `<html>`, persisted in `localStorage`; default follows `prefers-color-scheme`.
- All motion uses `cubic-bezier(0.16, 1, 0.3, 1)`; fast 132ms / normal 220ms / slow 352ms. Transform + opacity only. `prefers-reduced-motion` renders final states instantly.
- Touch targets ≥ 44px. Full keyboard operability. Simulation state changes announced via ARIA live regions. Icon-only buttons carry `aria-label`.
- State is never color-only: every status pairs color with an icon + text label.
- Voice contract (§7) is a hard gate: no content file passes review unless every concept is plain-first, example-anchored, professionally named second, and confusion-proofed.
- Accuracy contract (§6): current GitHub Docs + current developer conventions; `main` as default branch; `pull` taught as fetch + merge; no legacy project boards presented as current.

## 3. Brand Direction (samde synthesis)

- **Retrieval:** samde engine, brief "interactive GitHub learning platform for beginners, technical education, Primer GitHub UI authenticity, calm intelligent developer tool, dark and light mode" → domain Developer Tools & Infrastructure, dark bias, snappy-spring. Leaders: GitHub (1.655) + Incident (contrast axis). Recipe `recipe-github-incident-5e88e4`: 70% GitHub foundation + 20% Incident elevation + 10% Incident accent. All 6 coherence gates passed.
- **What the brand feels like:** calm, intelligent, technically truthful — "GitHub itself teaching you GitHub."
- **What the brand never feels like:** a course template, generic dark SaaS, a playful mascot-driven kids app, or a marketing landing page.
- **Visual thesis:** "Primer-authentic surfaces with a patient teacher's voice — sharp, quiet, and precise, where every color and motion state means something real on GitHub."
- **Positioning:** restrained-technical; quiet with bold state colors only; sharp geometry (2–8px radii, hairline borders); neutral-cool with one warm teacher accent; technical-first, human-captioned; motion explains state, never decorates; calm.
- **Dominant 70% (EXTRACTED, GitHub Primer):** dark canvas `#0d1117`, hairline borders, sharp geometry, system + mono type pairing, semantic state colors.
- **Supporting 20% (ADAPTED, Incident editorial):** airy reading rhythm, generous section spacing, crisp focus rings — remapped onto Primer tokens, Incident's orange accent rejected.
- **Accent 10% (NEWLY DESIGNED):** one warm "teacher" highlight reserved for beginner callouts, "You are here" position, and quiz encouragement. Maximum one accent per view.
- **Rejected:** glassmorphism, hero gradients, glow affordances, 3D treatments, playful mascot, custom easing curves, purple/multicolor gradients.

## 4. Pedagogy & Information Architecture

One continuous narrative — fictional "Acme Notes" app, same repo, same characters — threads all chapters. Concepts taught in dependency order; every new term uses only previously learned concepts. Git concepts and GitHub platform concepts are always badged so learners never confuse the two.

1. **Mental model first.** What Git is (a time machine for files; a save-point system) vs what GitHub is (the clubhouse: sharing, conversation, automation around Git) vs how they differ. Metaphors before commands.
2. **Your first repo.** Repositories, files, README, commits (working tree → staging area → commit), SHA, remotes, origin, clone, fetch, pull, push, the local-to-GitHub loop.
3. **Branching without fear.** Branches, `main`, HEAD, tracking branches, remote-tracking branches, merge, merge conflicts, reset / revert / restore, stash, detached HEAD (optional deep-dive).
4. **Collaborating with pull requests.** PR lifecycle, draft PRs, reviews, approvals, requested changes, suggestions, conversations, checks, required checks, conflicts, merge vs squash merge vs rebase merge, cherry-pick, rebase, branch strategies.
5. **Issues as work orders.** Purpose, labels, assignees, milestones, templates, issue forms, linked issues, closing keywords, the issue → branch → PR → close loop.
6. **Open source via forks.** Fork, upstream, sync with upstream, contributing workflow, etiquette.
7. **Shipping & automation (solid intros).** Actions mental model (workflow / job / step / runner / trigger / artifact), releases / tags / semver / release notes / packages, Discussions, Projects, CODEOWNERS, rulesets / branch protection, secrets, environments, Dependabot, notifications.
8. **Capstone: ship a feature end-to-end.** Gated 8-step checklist: issue → branch → commits → push → PR → review → conflict resolution → merge → release note. Each step verified in-simulation before the next unlocks.

Cross-cutting mechanics: persistent "You are here" pipeline strip (working tree → commit → branch → remote → pull request → review → merge → release) on every chapter; beginner-first cards with "Take it deeper (optional)" toggles; recap cards re-surfacing 2–3 older concepts per chapter (spaced repetition); prediction-first micro-quizzes with why-explanations.

## 5. Interaction Model (five shared engines)

All engines are vanilla JS, keyboard-accessible, driven by data files, sharing the token system. No per-chapter bespoke widgets.

1. **Branch-graph visualizer (`scripts/graph.js`).** SVG commit lanes; scenarios scripted as data (diverge → merge, rebase replay, conflict markers). Click/hover a node reveals what changed; step controls ("Replay rebase") animate commit-by-commit with pause/step; reduced-motion shows final state.
2. **Simulated GitHub panels (`scripts/github-sim.js`).** Faithful Primer-style chrome: repo header + branch picker + file browser; PR view with Conversation / Files changed / Checks tabs, Approve / Request changes buttons, merge-box states; Issue view with labels, assignees, linked PR, close-via-keyword; review comment threads; Checks rows animate skeleton → spinner → pass/fail.
3. **Command sandbox (`scripts/sandbox.js`).** Accepts ~15 commands: `clone`, `status`, `add`, `commit`, `branch`, `switch`, `restore`, `stash`, `log`, `fetch`, `pull`, `push`, `merge`, `rebase`, `reset`. Each command renders a conceptual-state diff in the pipeline strip; wrong-order commands get gentle coaching shown next to the input. Simulation only — never touches real git.
4. **Quiz engine (`scripts/quiz.js`).** Multiple-choice, prediction ("what happens if you push now?"), and sequencing (order the workflow steps). Instant feedback explains why with a link back to the simulation state. Progress in `localStorage`.
5. **Glossary + cross-links (`scripts/glossary.js`).** ~60 terms (list in §6), client-side search, every card tagged Git vs GitHub, relates-to links; `[[term]]` references in curriculum content render as hover/click popovers.

Hub composition: landing hero (pipeline overview) → guided path rail (chapters 1–8 with progress dots) → always-open playground cards (command sandbox, branch lab, glossary). Chapter page pattern: concept cards + one simulation + quiz + recap + next-chapter link. Hash routing (`scripts/router.js`); progress (`scripts/progress.js`) persisted.

## 6. Content Plan & Accuracy Contract

Source of truth: current GitHub Docs and current developer conventions. UI copy in simulations mirrors real GitHub labels ("Request changes", "Squash and merge", "Linked pull requests"). Explicitly excluded as current practice: `master` as default, unexplained `git pull`, legacy Projects (classic) boards.

**Conversations-decoded set (12 entries; each = phrase → what they mean → what to do → linked simulation):** "open a PR", "push your branch", "rebase onto main", "the checks are failing", "request changes", "LGTM / approve", "merge the PR", "squash and merge", "fork the repo", "sync with upstream", "resolve the conflicts", "cut a release / tag it".

**Glossary (~60 terms):** repo, README, commit, SHA, branch, main, HEAD, working tree, staging area, index, detached HEAD, stash, reset, revert, restore, remote, origin, upstream, tracking branch, remote-tracking branch, clone, fetch, pull, push, merge, merge conflict, rebase, cherry-pick, squash, PR, draft PR, review, approval, requested changes, suggestion, checks, required checks, CODEOWNERS, rulesets / branch protection, issue, label, assignee, milestone, template, issue form, linked issue, closing keyword, fork, contributing, Actions, workflow, job, step, runner, trigger, artifact, environment, secret, release, tag, versioning / semver, release notes, package, Discussion, Project, Dependabot, notification.

**Quizzes:** at least one prediction-style item per chapter (e.g. Ch.3: main moved while your branch was open — what happens on merge? Ch.4: checks red + approvals green under branch protection — can you merge?). Every answer explains why.

## 7. Voice & Explanation Contract (binding)

Explain like they're 15; respect like they're a future colleague. Every major concept uses the five-beat pattern:

1. **Say it plain** — one friendly sentence, zero jargon. ("A repository is just a project folder with a memory.")
2. **Make it real** — an everyday example before any code. (Save-points in a game for commits; duplicating a game save for branches; photocopying a recipe book for forks; airport security for CI checks; a group chat for PR reviews.)
3. **Show it** — the simulation or diagram immediately adjacent, not paragraphs later.
4. **Name it properly** — "Developers call this a *commit*. Now you can too." Professional term always after understanding, never before.
5. **Catch the confusion** — a "Beginners often think X, but actually Y" line on every major concept.

Tone: warm, encouraging, never condescending; short sentences; contractions welcome; humor light and rare. Concept cards carry at most ~60 words before the example. Advanced material hides behind "Take it deeper (optional)" toggles. Reference example: "A branch is like duplicating your game save before trying something risky. If the experiment fails, your original save is untouched. Developers call the safe original `main`, and your experiment a branch."

## 8. Visual System (implementation tokens)

Three-layer tokens in `styles/tokens.css`, consumed via semantic → component variables. No hardcoded values in components.

**Dark theme (`[data-theme="dark"]`, default after `prefers-color-scheme`):** `--canvas: #0d1117; --surface-1: #161b22; --surface-2: #1c2128; --border: #30363d; --text: #e6edf3; --muted: #8b949e; --success: #3fb950; --danger: #f85149; --attention: #d29922; --info: #58a6ff; --teacher: #e8a13c` (warm highlight; exact value must pass 4.5:1 against surface-1 for text use, else restricted to non-text accents).

**Light theme (`[data-theme="light"]`):** `--canvas: #ffffff; --surface-1: #f6f8fa; --surface-2: #eaeef2; --border: #d0d7de; --text: #1f2328; --muted: #59636e; --success: #1a7f37; --danger: #d1242f; --attention: #9a6700; --info: #0969da; --teacher: #9a6700`-family warm tone, contrast-checked.

**Geometry:** buttons 6px, inputs 6px, cards 6–8px, pills full, hairline 1px borders dominant, single-shadow elevation only. **Spacing:** 4px base; section rhythm 48/64. **Type:** system UI stack for chrome; mono for SHAs/commands/diffs; headings `text-wrap: balance`, body `text-wrap: pretty`, SHAs/counters `font-variant-numeric: tabular-nums`.

**Motion:** `cubic-bezier(0.16, 1, 0.3, 1)`; fast 132ms / normal 220ms / slow 352ms; transform + opacity only; interaction feedback ≤ 200ms with ease-out entrances; stepped replays pausable; reduced-motion → instant final state.

**De-slop rules (baseline-ui, adapted to vanilla CSS):** no gradients; no glow as affordance; no custom easing beyond the SAMDE curve; fixed z-scale (`--z-base 0, --z-sticky 10, --z-popover 50, --z-dialog 100`); errors adjacent to the action; Checks loading uses structural skeletons; every empty state offers one clear next action.

## 9. File Plan

- `index.html` — hub + hash-routed chapters, theme toggle, progress rail, pipeline strip.
- `styles/tokens.css` — three-layer tokens + both themes. `styles/components.css` — cards, panels, sim chrome. `styles/simulations.css` — graphs, PR/Issue panels, sandbox.
- `scripts/router.js`, `scripts/graph.js`, `scripts/github-sim.js`, `scripts/sandbox.js`, `scripts/quiz.js`, `scripts/glossary.js`, `scripts/progress.js`, `scripts/main.js`.
- `data/curriculum.js` (8 chapters, voice-checked), `data/scenarios.js` (Acme Notes scripts), `data/glossary.js`, `data/quizzes.js`, `data/decoded.js`.
- `assets/icons.svg` (inline Octicon-style set).

## 10. Verification

Per project Phase 4 gate: hand-test every engine (graph replay incl. rebase/conflict, PR approve/request-changes/merge states, Issue close-via-keyword, sandbox ~15 commands including wrong-order coaching, quiz scoring, glossary search/links, capstone gating, theme toggle, progress persistence); keyboard-only walkthrough; 390px mobile + 1440px desktop checks; contrast re-check on state badges; `verify-web` sweep/shot/tap/console evidence stored next to the work. No "done" without fresh evidence.

## 11. Traceability & Rejections

- Primer-authentic chrome → EXTRACTED from GitHub/Primer conventions (user-requested) + samde Leader GitHub.
- Editorial reading rhythm + focus treatment → ADAPTED from Incident (accent color rejected).
- Teacher accent, five-beat explanation pattern, Acme Notes thread, capstone gating → NEWLY DESIGNED for this brief.
- Rejected: approach B (module islands — incoherent), approach C (content-first — undershoots flagship bar); glassmorphism/gradients/3D/mascot (break GitHub-authentic restraint); framework builds (violate zero-dependency decision).
