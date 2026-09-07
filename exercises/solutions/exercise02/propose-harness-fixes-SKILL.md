---
name: propose-harness-fixes
description: Turn analysis.json findings into reviewable proposed harness changes. Never applies a fix — only writes proposals.json for a human to act on.
---

# Solution reference: `propose-harness-fixes` (Exercise 2)

This is a reference implementation of the skill Exercise 2 asks you to design. Compare
against your own design — differences in wording are fine, differences in *which
context gets loaded when* and *how proposals are categorized* are the thing to check.

## Context loading

1. Always load all three: `harness-snapshot.json`, `index.json`, `analysis.json`. All
   three together are typically under 15KB for a dataset this size — there's no reason
   to summarize or partially load them.
2. Before proposing anything, sanity-check the inputs:
   - Every `evidence_session_ids` entry in every finding must exist as a `session_id`
     in `index.json`. If one doesn't, drop that finding from consideration and say so
     in the output instead of proposing from it.
   - Every path named in a finding's `harness_component` should actually appear in
     `harness-snapshot.json` (or, if you have repo access, actually exist on disk).
     If it doesn't, treat the finding as stale — refuse to propose a fix for it, and
     say why (analysis.json was written against a different harness state).
3. Only open a specific `sessions/{date}/{id}.json` file if a finding's evidence needs
   verification you can't do from the compact `index.json` entry — e.g. confirming
   what a cited session's tool call actually contained before writing a diff. Don't
   load session files by default; `analysis.json`'s `why_it_matters` already did that
   reading during Exercise 1.

## Classifying each proposal: `fix_type`

Computed fresh by this skill, per proposal, not stored back into `analysis.json` —
Exercise 1's schema stays stable, and a finding can produce more than one proposal
with different fix_types (see finding 4 below).

- **`mechanical`** — the fix is a direct patch to the exact file/setting named in
  `harness_component`, checkable by re-reading that same file, and doesn't require
  choosing between two legitimate preferences absent from the data. Propose an actual
  diff.
- **`policy_decision`** — the diagnosis is solid, but the fix depends on a preference
  or precedence that isn't recorded anywhere in the three input files (which guide
  wins, whether to accept a new dependency). Propose two labeled options with
  tradeoffs. Do not silently pick one.
- **`needs_investigation`** — the finding points at something outside these three
  files entirely (an external system, an unconfirmed real-world fact). Propose a named
  next step, not a fix. If the transcripts themselves contain conflicting evidence
  (see finding 5 below), say that explicitly rather than picking the majority answer.

## Output

Write `proposals.json` next to `analysis.json`. Never edit the harness itself — this
skill only writes proposals; a human applies them. See
`exercises/solutions/exercise02/proposals-workshop.json` for the worked example against
this repo's own `exercise01` dataset.

## Cross-finding awareness

Before finalizing, check whether any two proposals conflict (one revives a hook the
other's policy option would delete, for instance). If so, make the dependency explicit
with a `blocked_by` reference rather than emitting two proposals that silently
contradict each other if both were applied.
