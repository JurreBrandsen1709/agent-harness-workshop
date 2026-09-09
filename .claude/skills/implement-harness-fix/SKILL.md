---
name: implement-harness-fix
description: Classifies docs/log-schema/analysis.json findings as mechanical, policy_decision, or needs_investigation, then implements the mechanical ones for real (diff, commit, PR) via the harness-fix-implementer subagent — flagging only the specific parts that genuinely need a human, not whole findings by default. Use when asked to act on, implement, or fix harness-analysis findings.
---

# Implement Harness Fix

`analysis.json` (from the `analyze-groups` skill) names *what's wrong* and *what to
do about it*, but not every finding is safe to act on the same way. This skill sorts
that out and then runs the `harness-fix-implementer` subagent to do the safe part for
real — never the main session, and never anything under `todo-app/src/**` (a
`PreToolUse` hook enforces that independently of this skill). Everything else under
`todo-app/` is writable: the goal is to keep a human out of the loop wherever a
finding's own text makes the safe/unsafe boundary explicit, and only pull one in for
the part that's genuinely a judgment call — not for a whole finding just because part
of it is contested.

## What to read

- `docs/log-schema/analysis.json` — the findings to act on.
- `docs/log-schema/harness-snapshot.json` — current confirmed state of harness
  components, to sanity-check a finding's claim before implementing it.
- `docs/log-schema/index.json` — per-session facts, to verify `evidence_session_ids`
  actually resolve to real sessions.

## Step 0: refuse stale input

Compare `analysis.json.generated_at` against `harness-snapshot.json` and
`index.json`'s own generation timestamps. If `analysis.json` predates either, **stop
the entire run** and report which file is stale — the findings may describe a
harness state that's no longer current. Do not implement, flag, or open anything.

## Step 1: verify evidence, per finding

For each finding, check that every id in `evidence_session_ids` exists in
`index.json`. If any don't resolve, classify that finding as **needs_investigation**
("evidence unverifiable — session id(s) not found in index.json") and skip
classification below for it.

## Step 2: classify every remaining finding

Read the full `recommendation` text for what it actually asks for — most
recommendations bundle more than one concrete action. Classify at the level of each
action, not just the finding as a whole:

1. **mechanical action** — a concrete, literal change (add/remove/edit this text, in
   this file, to say this) inside `todo-app/**` (anything except `todo-app/src/**`),
   that can be checked against the file's current content, and that nothing else in
   the same recommendation says to withhold. Implement it — do not let one contested
   action in a recommendation block the rest of it.
2. **contested action (conflict)** — a specific action that either the recommendation
   itself flags as conditional on another finding ("do not do X without also
   resolving finding N"), or that directly implements the side of a `conflicts_with`
   link. Only the named action is contested, not the whole recommendation unless the
   entire recommendation *is* that one action (e.g. the recommendation has no
   internal structure to split — it's a single either/or, like "make document A or
   document B canonical"). Never implement a contested action; route it into the
   draft-PR conflict writeup (Step 3).
3. **policy_decision** — the recommendation (or, per #2, an un-splittable whole
   finding) requires picking between multiple valid options and `analysis.json`
   doesn't settle which one wins.
4. **needs_investigation** — the fix depends on something not observable from
   `analysis.json`/session data (e.g. which shell/OS the team actually uses).

A finding commonly produces a mix: most of its recommendation is mechanical, one
specific action inside it is contested. Treat these independently — implement the
mechanical part for real, flag only the contested sliver.

State the classification and one-sentence reasoning for every finding (and every
split-out action within it) before acting — this is the artifact that makes
"deliberately not touched" auditable, not silently skipped.

## Step 3: act, delegating all writes to `harness-fix-implementer`

Do not edit or commit anything from the main session — hand every action below to the
`harness-fix-implementer` subagent, one finding (or one mechanical slice of a finding)
at a time, so the write/bash guard hooks are the ones enforcing scope, not this
skill's own judgment.

- **mechanical** (a whole finding, or the non-contested slice of one): instruct the
  subagent to create branch `harness-fix/finding-<id>-<slug>`, make exactly the
  recommended edit(s), commit with a message citing the finding id/title, and
  `gh pr create` with a body quoting `harness_component`, `why_it_matters`,
  `recommendation`, and `confidence` from `analysis.json` (and, if part of this
  finding's recommendation was withheld as contested, naming that remainder and
  pointing at the conflict PR below in the same body). If `gh`/a remote isn't
  available, the subagent stops after the local commit and the skill reports the
  branch name plus a written PR description as the substitute.
- **contested action(s) / un-splittable policy conflicts**: group every contested
  action or whole-finding conflict that references the same `conflicts_with` pair
  into one **draft** PR — no code diff — whose body lists the options/tradeoffs for
  each side and states plainly it needs a human decision. If more than one finding
  touches the same conflict, one draft PR covering all of them is better than several
  overlapping ones. Without `gh`/a remote, report this as a flagged entry instead (no
  branch needed — there's no diff to hold).
- **policy_decision** (no conflict link, just inherently ambiguous) and
  **needs_investigation**: no subagent call, no branch, no PR. Report the finding id,
  category, and the concrete next step or exact tradeoff a human needs to weigh.

## Step 4: final summary

Report every finding id, what was implemented vs. flagged (down to the sub-action
level where a finding was split), and its outcome (PR/branch link, or the flagged
reason) in one list — this is what makes "nothing was silently fixed or silently
over-flagged" checkable at a glance.

## Verifying the write-restriction actually holds

Don't trust the hook by reading it — try to break it. After running this skill once,
separately instruct `harness-fix-implementer` to edit a file under
`todo-app/src/**` and confirm `harness-fix-write-guard.js` blocks it with exit code 2,
not that the subagent simply declined. Writes to `todo-app/tsconfig.json` or
`todo-app/package.json` should now succeed — only `todo-app/src/**` is denied.
