# Exercise 1: From mechanical extraction to real grouping

You have `harness-logs/`: two weeks of real session transcripts from an agent working
in `todo-app/` (see [MISSION_BRIEFING.md](../MISSION_BRIEFING.md) if you haven't
read it). Nobody has gone back and read them yet.

This repo already has a `session-logs` skill (`.claude/skills/session-logs/`) that
turns those raw transcripts into two structured files — `harness-snapshot.json` (what
the harness currently is) and `index.json` (per-session facts: tool errors, hook
fires, permission denials, that kind of thing). But it stops there. It doesn't decide
which sessions are actually about the same underlying problem — that's a judgment
call, not a mechanical one, and nobody has added it yet.

Your task: add a second phase to the skill where an agent reads the extracted data and
groups sessions by real, shared cause — not by shared vocabulary.

This exercise is scoped to grouping only: naming *what's wrong and where*, backed by
real sessions. The deeper judgment — why it matters, what to actually do about it, how
confident you are — is Exercise 2. Don't get ahead of yourself and start writing
recommendations here; that's the next exercise's point, not this one's.

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
2. Decide which sessions are really about the same underlying problem, and roughly
   which part of the harness is implicated.
3. Add a new `## Phase 2: Group` section to `.claude/skills/session-logs/SKILL.md`,
   right after its existing (Phase 1, mechanical extraction) content. **This is the
   actual deliverable of this exercise** — everything else is either input to it or a
   check on whether it worked. Write it as instructions for what to do, not a record
   of what you did, and make it self-contained: whoever (or whatever) reads
   `SKILL.md` next won't have this exercise doc open next to it, so don't just say
   "see exercise-1.md" — the section needs to actually say the thing. At minimum it
   must specify:
   - **What to read**: `harness-snapshot.json` and every session's compact
     `index.json` entry — and when to open a specific `sessions/{date}/{id}.json` to
     confirm two sessions are really the same issue, not just similarly worded.
   - **What to write, and where**: `groups.json`, in the same directory as
     `index.json`, following a group schema — reuse the one below or write your own
     as long as it forces the same specifics (component, control type, evidence).
   - **What separates a real group from keyword clustering**: turn the "Rules for a
     real group" below into actual instructions in `SKILL.md` — an agent reading only
     `SKILL.md` needs to be pushed away from grouping by shared words, the same way
     you are right now.
4. Have your agent follow the `SKILL.md` you just wrote — don't write
   `docs/log-schema/groups.json` by hand — and see what it produces. Read the result:
   if two unrelated sessions get merged because they share a word, or one real
   recurring issue gets split into two groups because the wording differs, that's
   `SKILL.md`'s instructions failing, not just a bad run. Go tighten the Phase 2
   section and run it again.

### Group schema

```json
{
  "generated_at": "<ISO timestamp>",
  "based_on": { "harness_snapshot": "harness-snapshot.json", "index": "index.json" },
  "groups": [
    {
      "id": 1,
      "title": "Short label",
      "control_type": "guide | sensor | guide+sensor",
      "harness_component": "the specific file/setting this is about",
      "evidence_session_ids": ["..."]
    }
  ]
}
```

Deliberately no `why_it_matters`, `recommendation`, or `confidence` fields yet — that
reasoning is Exercise 2's job, and it needs more than this schema gives you to do it
honestly.

### Rules for a real group

- **Group by meaning, not shared words.** Two sessions about the same recurring ask
  are one group, even if worded completely differently. Don't group sessions just
  because they share vocabulary.
- **Name a specific harness component and control type** — an actual hook file, an
  actual CLAUDE.md section, an actual permissions entry. "Something seems off" isn't a
  group.
- **Confirm ambiguous groupings by reading, not guessing.** If two sessions might or
  might not be the same issue, open the relevant `sessions/{date}/{id}.json` and check
  the actual `tool_input_summary`/`error_preview` before deciding — that's usually
  where you can tell for certain, not in the `index.json` summary.
- **Don't force it.** Don't pad a group with sessions that don't really belong, and
  don't split one real recurring issue into multiple groups just because the wording
  differs session to session.

## Why not just compute this mechanically?

Already tried, in this repo's own history: a keyword-overlap heuristic across
`ai_title`/first-prompt text merged two unrelated sessions because both happened to
contain "agent" and "workshop" — words that are structurally common in a workshop
*about* agent harnesses, not evidence the sessions were related. Tuning the threshold
just moves where the next false merge happens. Worse, a rollup can tell you "5
sessions hit a tool error" but can't tell you *why* — that all 5 were hallucinated
file paths from a different environment, say — because noticing that pattern requires
actually reading the failed calls. Deciding which sessions are really the same issue
is a judgment call; it belongs in a phase where an agent reads and reasons, and writes
the grouping down. What to actually do about it comes next, in Exercise 2.

## Success criteria

- `SKILL.md`'s Phase 2 section is instructions an agent can follow on its own, not a
  log of what you did this one time.
- Your agent produced `groups.json` by following those instructions — you didn't
  hand-write it to match your own earlier read.
- Every group names a specific harness component and control type, and cites real
  `evidence_session_ids` — no vague "something seems off" groups.
- At least one grouping decision required opening a session file — something you
  could **not** have made from `index.json`'s counts alone.
- No group exists purely because sessions share vocabulary, and no real recurring
  issue got split into two groups by wording differences.
- Someone who's never seen the raw logs could read only `groups.json` and know
  exactly which sessions and which harness file each group is about.
- You resisted adding `why_it_matters`, `recommendation`, or `confidence` here —
  that's Exercise 2's job, and adding it now means guessing without the tools
  Exercise 2 gives you to do it properly.

## Solution

See [`exercises/README.md`](README.md#reference-solutions) for how to check out
reference solutions without exposing them to your coding agent.
`exercises/solutions/exercise01/` (on the `solutions` branch) has the reference
`harness-snapshot.json`, `index.json`, `sessions/`, and `groups.json` for this same
`harness-logs/` dataset, plus `session-logs-phase-2-group.md` for the reference Phase
2 instructions. Don't look before attempting the exercise; compare after. Differences
in wording are fine; differences in whether a group is concrete, evidenced, and
correctly scoped are what to check for.
