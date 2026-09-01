# Workshop exercises

Two exercises, meant to be done in order:

1. [`exercise-1-analysis-skill.md`](exercise-1-analysis-skill.md) — the
   `session-logs` skill currently only mechanically extracts `index.json` and
   `harness-snapshot.json`. Add the analysis step that turns those into a real
   `analysis.json`: findings with a specific harness component, evidence, reasoning,
   a recommendation, and a confidence level. Explains why doing this mechanically
   (aggregates, keyword clustering) doesn't work, using this repo's own build
   history as the worked example. A solution exists in `exercises/solutions/` —
   don't open it before attempting the exercise.

2. [`exercise-2-propose-fixes-skill.md`](exercise-2-propose-fixes-skill.md) — build a
   new skill that takes `harness-snapshot.json` + `index.json` + `analysis.json` as
   context and proposes (never applies) concrete harness fixes. About context
   engineering: what to load, when to go back for more evidence, and how to tell a
   mechanically-safe fix apart from one that actually needs a human decision. No
   solution provided — this one's open.
