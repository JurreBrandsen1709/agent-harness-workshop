# Workshop exercises

All exercises analyze (and eventually act on) the same fabricated dataset:
`harness-logs/` (11 raw session transcripts for the `todo-app/` TODO app). Five
exercises in total, meant to be done in order — from raw evidence to an actual
reviewed and validated harness fix:

1. [`exercise-1-analysis-skill.md`](exercise-1-analysis-skill.md) — the
   `session-logs` skill currently only mechanically extracts `index.json` and
   `harness-snapshot.json`. Add the analysis step that turns those into a real
   `analysis.json`: findings with a specific harness component, evidence, reasoning,
   a recommendation, and a confidence level. A solution exists — see "Reference
   solutions" below — don't open it before attempting the exercise.

2. [`exercise-2-propose-fixes-skill.md`](exercise-2-propose-fixes-skill.md) — build a
   new skill that takes `harness-snapshot.json` + `index.json` + `analysis.json` as
   context and proposes (never applies) concrete harness fixes. About context
   engineering: what to load, when to go back for more evidence, and how to tell a
   mechanically-safe fix apart from one that actually needs a human decision. A
   reference solution exists — see "Reference solutions" below.

3. **Prepare a harness change and open a PR** — take an approved proposal from
   Exercise 2 and actually apply it, through an agent deliberately denied write
   access to this app's production code (`todo-app/src/**`). The exercise is
   designing what tool/permission access that agent actually needs, and why — the
   skill's own architecture is provided, not left open. Not yet written up as its
   own exercise file.

4. [`exercise-4-hdr.md`](exercise-4-hdr.md) — extend the Exercise 3 flow to decide
   whether a change warrants a **Harness Decision Record** (the harness equivalent
   of an ADR — why the change was made, not just what changed) using
   [`hdr-template.md`](hdr-template.md), and to ship it in the same PR.

5. [`exercise-5-validation.md`](exercise-5-validation.md) — add a validation phase
   that runs *before* the PR from Exercises 3/4 reaches a human reviewer: checking
   the change against its own evidence chain (finding, proposal, diff, HDR) without
   spinning up new agent sessions to test it. Reports what it could and couldn't
   establish — it never approves its own change.

## Reference solutions

Reference solutions live on the **`solutions` branch, not on `master`** — kept off
the branch you work in so a coding agent helping with an exercise never has them in
its working tree. Check the branch out into a separate directory when you're ready to
compare, never into the directory your agent is operating in:

```
git fetch origin solutions
git worktree add ../workshop-solutions solutions
```

Open `../workshop-solutions/exercises/solutions/...` yourself, in an editor — don't
point your agent at that worktree, and don't look before attempting the exercise.
Remove it when you're done: `git worktree remove ../workshop-solutions`.

`master`'s own `.claude/settings.json` also denies the `Read`/`Grep`/`Glob` tools from
touching `exercises/solutions/**` as a second layer, in case solution files ever end
up copied into your working tree anyway.
