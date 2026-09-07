# Exercise 2: From grouped sessions to reasoned findings

From Exercise 1 you have `groups.json`: sessions clustered by real shared cause, each
tagged with a specific harness component, its control type (guide/sensor), and the
session IDs that support it. What you don't have yet is *why it matters*, *what to do
about it*, or *how sure you are* — that's this exercise.

## Task

1. Build a new skill, e.g. `.claude/skills/analyze-groups/`, that takes
   `groups.json` (plus `harness-snapshot.json` and `index.json`) and produces
   `analysis.json`: the same groups, each enriched with `why_it_matters`,
   `recommendation`, and `confidence`.
2. Decide, and write into the skill, when it needs to escalate from a group's
   metadata to actually opening a specific `sessions/{date}/{id}.json` for evidence
   — `groups.json` on its own is rarely enough to write a truthful `why_it_matters`.
3. Run it against your own (or the reference) `groups.json` and read the result. If a
   `why_it_matters` just restates the group's title in different words, that's the
   skill failing to escalate to real evidence — tighten it and run again.

This is a context-engineering exercise: when does the skill need real evidence
(a quoted error, a command that failed, a decision the agent itself explained)
rather than just the group metadata it started with?

## Why you can't just mechanically fill in the reasoning

Once sessions are correctly grouped, it's tempting to think the hard part is done —
just template a recommendation off the `harness_component`. It isn't. Two groups
pointing at the exact same file can need completely different treatment: a group
about a hook that's fully commented out might have an unambiguous fix (uncomment it,
or remove the registration), while a group about two guide files giving opposite
instructions has no fix a script can compute — the reasoning about *which* policy
should win only exists once you've actually read what both files say and, often, seen
a session where the conflict caused a real problem.

And a `why_it_matters` written without opening the session evidence tends to just
restate the group's title with more words. Real reasoning cites something specific: a
quoted error message, a command that got rejected, a line of code that changed
between two commits. That only comes from reading, not from the group metadata alone.

## Design questions

1. **Context loading.** Is `groups.json` + `harness-snapshot.json` + `index.json`
   enough by default? When should the skill escalate to a specific
   `sessions/{date}/{id}.json` for evidence before writing `why_it_matters`?
2. **Confidence.** What makes a finding "high" vs. "medium" vs. "low" confidence — how
   many sessions support it, how directly the evidence proves the claim, or something
   else? Design a rule you could apply consistently, not a vibe assigned per finding.
3. **Recommendation specificity.** "Fix this" is not a recommendation. What's the
   minimum level of detail a recommendation needs so someone unfamiliar with the
   group could act on it, or at least know exactly what to try?
4. **Consistency across findings.** If two findings would recommend contradictory
   changes (one implies enabling a hook, another implies removing it), should the
   skill catch that itself, or is that just something a human reviewer needs to
   notice?

## Success criteria

- Every finding's `why_it_matters` cites something you could only know from actually
  reading (a session file, a quoted error, a specific line) — you could point to the
  exact line that justifies it, not just the group's own metadata restated in more
  words.
- `confidence` is assigned by a rule you could explain to someone else — if you
  handed `groups.json` (no reasoning) to two different people, they'd land on the
  same confidence level for the same group.
- Every `recommendation` is concrete enough that someone unfamiliar with the
  investigation could act on it, or at least knows exactly what to check next — and
  stays inside the harness's own files, not "tell the team to be more careful."
- The skill doesn't invent reasoning for a group whose evidence doesn't actually
  support the claim it's making.

## Solution

See [`exercises/README.md`](README.md#reference-solutions) for how to check out
reference solutions without exposing them to your coding agent.
`exercises/solutions/exercise02/` (on the `solutions` branch) has a reference skill
design (`analyze-groups-SKILL.md`) and the resulting `analysis.json`, built from
`exercises/solutions/exercise01/groups.json`. Attempt your own design first — this
one's meant for comparison, not copying.
