# Exercise 1: From mechanical extraction to real analysis

You have `harness-logs/`: two weeks of real session transcripts from an agent working
in `todo-app/` (see [MISSION_BRIEFING.md](../MISSION_BRIEFING.md) if you haven't
read it). Nobody has gone back and read them yet.

This repo already has a `session-logs` skill (`.claude/skills/session-logs/`) that
turns those raw transcripts into two structured files — `harness-snapshot.json` (what
the harness currently is) and `index.json` (per-session facts: tool errors, hook
fires, permission denials, that kind of thing). But it stops there. It doesn't decide
what any of that *means* — that's mechanical extraction, not analysis, and nobody has
added the second half yet.

Your task: add that second phase to the skill — one where an agent actually reads the
extracted data and writes down real findings: specific, evidenced claims about what's
wrong with the harness and why.

## Setup

Run both scripts from the repo root (or let your agent do this for you), pointing at the fabricated dataset in
`harness-logs/`:

```
node .claude/skills/harness-snapshot/scripts/generate-harness-snapshot.mjs todo-app docs/log-schema/harness-snapshot.json
node .claude/skills/session-logs/scripts/generate-sessions.mjs harness-logs docs/log-schema todo-app
```

This writes `docs/log-schema/harness-snapshot.json` and `docs/log-schema/index.json`
(+ `docs/log-schema/sessions/{date}/{id}.json`). Everything in them is rule-based
extraction — string matching, counting, truncation. No model call anywhere. Open
`index.json` — that, plus `harness-snapshot.json`, is all you're handed.

## Task

You can do steps 1-2 yourself or have your coding agent do them while you steer —
either is fine, and doing it yourself first often makes step 3 easier. Steps 3-4 are
where it stops being optional: that's where you write instructions an agent follows,
and check what it actually does with them.

1. Read `harness-snapshot.json` and every session's compact entry in `index.json`
   (`ai_title`, `first_prompt_preview`, `harness_signals`). Open an individual
   `sessions/{date}/{id}.json` only when something looks worth a closer read.
2. Decide which sessions show that something in the harness needs to change, and
   what.
3. Add a new `## Phase 2: Analyze` section to `.claude/skills/session-logs/SKILL.md`,
   right after its existing (Phase 1, mechanical extraction) content. **This is the
   actual deliverable of this exercise** — everything else is either input to it or a
   check on whether it worked. Write it as instructions for what to do, not a record
   of what you did, and make it self-contained: whoever (or whatever) reads
   `SKILL.md` next won't have this exercise doc open next to it, so don't just say
   "see exercise-1.md" — the section needs to actually say the thing. At minimum it
   must specify:
   - **What to read**: `harness-snapshot.json` and every session's compact
     `index.json` entry — and when to go further and open a specific
     `sessions/{date}/{id}.json`.
   - **What to write, and where**: `analysis.json`, in the same directory as
     `index.json`, following a finding schema — reuse the one below or write your own
     as long as it forces the same specifics (component, evidence, reasoning,
     recommendation, confidence).
   - **What separates a real finding from a vague one**: turn the "Rules for a real
     finding" below into actual instructions in `SKILL.md` — an agent reading only
     `SKILL.md` needs to be pushed away from padding findings or grouping by
     shared keywords, the same way you are right now.
4. Have your agent follow the `SKILL.md` you just wrote — don't write
   `docs/log-schema/analysis.json` by hand — and see what it produces. Read the
   result: if it's vague, padded, or groups sessions by shared words instead of
   shared meaning, that's `SKILL.md`'s instructions failing, not just a bad run. Go
   tighten the Phase 2 section and run it again.

### Finding schema

```json
{
  "generated_at": "<ISO timestamp>",
  "based_on": { "harness_snapshot": "harness-snapshot.json", "index": "index.json" },
  "findings": [
    {
      "id": 1,
      "title": "Short label",
      "control_type": "guide | sensor | guide+sensor",
      "harness_component": "the specific file/setting this is about",
      "evidence_session_ids": ["..."],
      "why_it_matters": "the reasoning connecting evidence to the gap — not a restated count",
      "recommendation": "a concrete, specific change",
      "confidence": "high | medium | low"
    }
  ]
}
```

### Rules for a real finding

- **Group by meaning, not shared words.** Two sessions about the same recurring ask
  are one finding, even if worded completely differently. Don't group sessions just
  because they share vocabulary.
- **Name a specific harness component** — an actual hook file, an actual CLAUDE.md
  section, an actual permissions entry. "Something seems off" isn't a finding.
- **Go beyond `index.json` when a count looks interesting.** Open the relevant
  `sessions/{date}/{id}.json` and check the actual `tool_input_summary`/
  `error_preview` — that's usually where the root cause is, not in the count.
- **Prioritize by impact, not session count.** One confirmed permission denial that
  reveals a missing guardrail can matter more than ten sessions sharing a topic.
- **Don't pad to hit a quota.** Two solid findings beat five weak ones.

## Why not just compute this mechanically?

Already tried, in this repo's own history: a keyword-overlap heuristic across
`ai_title`/first-prompt text merged two unrelated sessions because both happened to
contain "agent" and "workshop" — words that are structurally common in a workshop
*about* agent harnesses, not evidence the sessions were related. Tuning the threshold
just moves where the next false merge happens. Worse, a rollup can tell you "5
sessions hit a tool error" but can't tell you *why* — that all 5 were hallucinated
file paths from a different environment, say — because noticing that pattern requires
actually reading the failed calls. Deciding what's relevant is a judgment call; it
belongs in a phase where an agent reads and reasons, and writes the result down.

## Success criteria

- `SKILL.md`'s Phase 2 section is instructions an agent can follow on its own, not a
  log of what you did this one time.
- Your agent produced `analysis.json` by following those instructions — you didn't
  hand-write it to match your own earlier read.
- Every finding names a specific harness component and cites real
  `evidence_session_ids` — no vague "something seems off" findings.
- At least one finding required opening a session file, not just reading
  `index.json`'s counts.
- If two findings would recommend contradictory changes, that's called out, not left
  silently inconsistent.

## Self-check

- Could someone who's never seen the raw logs read only `analysis.json` and know
  exactly which file to open and what to check?
- Is at least one finding something you could **not** have written from
  `index.json`'s counts alone?
- If two findings recommend contradictory changes, did you say so?

## Solution

Reference solutions live on the `solutions` branch, not on `master` — so they're
never sitting in your working directory where a coding agent could read them while
you're still attempting the exercise. Check the branch out into a **separate**
directory:

```
git fetch origin solutions
git worktree add ../workshop-solutions solutions
```

`../workshop-solutions/exercises/solutions/exercise01/` has the reference
`harness-snapshot.json`, `index.json`, `sessions/`, and `analysis.json` for this same
`harness-logs/` dataset, plus `session-logs-phase-2.md` for the reference Phase 2
instructions. Open these yourself, in an editor — don't point your agent at that
worktree. Don't look before attempting the exercise; compare after. Differences in
wording are fine; differences in whether a finding is concrete, evidenced, and
reasoned are what to check for.

Remove the worktree when you're done comparing: `git worktree remove ../workshop-solutions`.
