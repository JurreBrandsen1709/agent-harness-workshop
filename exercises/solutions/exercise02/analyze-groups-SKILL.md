---
name: analyze-groups
description: Turn groups.json (grouped sessions, no reasoning) into analysis.json (fully-reasoned findings with why_it_matters, recommendation, confidence).
---

# Solution reference: `analyze-groups` (Exercise 2)

This is a reference implementation of the skill Exercise 2 asks you to design.
Compare against your own — differences in wording are fine, differences in *when it
goes back for more evidence* and *how consistently it assigns confidence* are the
thing to check.

## Context loading

1. Always load `groups.json`, `harness-snapshot.json`, and `index.json` together —
   at this dataset's size that's well under what fits in context directly, so there's
   no reason to summarize or partially load them.
2. For each group, check whether `index.json`'s compact per-session fields
   (`first_prompt_preview`, `harness_signals`) already contain enough to write a
   truthful `why_it_matters`. If the honest answer would just restate the group's
   `title` in different words, that's the signal to escalate: open the specific
   `sessions/{date}/{id}.json` files in `evidence_session_ids` and look for something
   concrete — a quoted error, a rejected tool call, a line the agent itself flagged.
3. Don't open every session file by default. `groups.json` already did the work of
   deciding which sessions are relevant to which group; re-reading all of them for
   every group defeats the point of having a grouping stage at all.

## Writing `why_it_matters`

A `why_it_matters` that could apply to any group in this dataset (or any dataset) is a
sign nothing was actually read. Good instances cite something specific enough that a
reader could go verify it directly: a literal error string, a session ID plus what
happened in it, a specific pair of commits. If two group's evidence sessions turn out,
on reading, to actually be weaker than the group's title implied, say so — a smaller,
honest claim beats an inflated one the evidence doesn't support.

## Assigning `confidence`

Used here, consistently, rather than as a per-finding feeling:

- **high** — the evidence directly demonstrates the claim (a quoted error reproduces
  the failure; a rejected tool call is visible verbatim; a diff is checkable against
  the file the finding cites).
- **medium** — the evidence is real but the pattern is thinner (fewer sessions, or the
  connection between the sessions requires one inferential step).
- **low** — plausible from the available sessions, but would need more data or a
  session outside this dataset to be sure.

## Writing `recommendation`

Specific enough that someone who never read the sessions could act on it or knows
exactly what to check next — not "improve the guides" but which file, which section,
which concrete change. If two findings would recommend contradictory changes to the
same component, say so explicitly in both rather than leaving it for a reviewer to
notice on their own.

## Output

Write `analysis.json` next to `groups.json`. See
`exercises/solutions/exercise02/analysis.json` for the worked example against this
repo's own `exercise01/groups.json`.
