# Cleaned session-log schema

This describes the output format for the script that reads raw Claude Code session
logs from `~/.claude/projects/{PROJECT_NAME}/*.jsonl` and produces a distilled
artifact for an agent to analyze (looking for harness — CLAUDE.md/AGENT.md/hooks/
skills — flaws worth fixing). Three example files in this folder show the shape:

- `example-harness-snapshot.json` — one snapshot of the harness itself (instructions,
  hooks, skills, permissions), captured once per analysis run.
- `example-session.json` — one cleaned, normalized transcript per real session file.
- `example-index.json` — a weekly rollup listing every session with cheap-to-scan
  summary stats, for triage before opening individual session files.

Output layout on disk:

```
harness-snapshot.json
index.json
sessions/{date}/{session_id}.json
sessions/{date}/{session_id}/subagents/{agent_id}.json
```

## Why JSON, and why three artifacts instead of one file

JSON is the right call: structured, trivial for an agent to parse/query, and easy to
truncate per-field. But raw session files mix two different concerns — "what is the
harness configured to do" and "what actually happened in a conversation" — and mixing
them per-session would mean re-embedding the full CLAUDE.md/AGENT.md/hooks text in
every single session file. Splitting them lets the analysis agent load the harness
config once and diff many sessions' behavior against it.

## Two things to get right that aren't obvious from the raw logs

### 1. PreToolUse/PostToolUse hook activity is not observable from the transcript

Only `UserPromptSubmit` hooks are visible inline: their
`hookSpecificOutput.additionalContext` gets merged into the next turn's context, so the
cleaning script can emit a `hook_injection` event for those. `Stop` hooks show up as a
`system` record with `subtype: "stop_hook_summary"` (fields: `hookInfos`, `hookErrors`,
`preventedContinuation`, etc.).

`PreToolUse` and `PostToolUse` hooks are **not** logged anywhere in the JSONL — no
stdout/stderr, no exit code, nothing. So the script cannot tell, from transcript data
alone, whether e.g. `post-edit-autocommit.js` actually ran after an Edit/Write. The
only way to find out is to statically read the hook file (is it commented out /
does it early-return?) and, if you need to confirm real-world firing, correlate the
`Edit`/`Write` tool-call timestamps recorded in `events[]` against `git log` commit
timestamps in the same repo — that correlation is intentionally left to whatever
consumes this cleaned output, not the cleaning script itself.

Because of this gap, `harness-snapshot.json` marks each hook with
`observable_in_transcript: true|false`, and each session's `harness_signals` block
splits `hooks_observed_firing` (things we actually saw injected) from
`hooks_not_observable` (things wired up in settings.json that the transcript can't
confirm one way or the other).

### 2. `sessionId` vs `session_id` can disagree within one file

On a resumed/continued session, some records in a single `.jsonl` file carry a
camelCase `sessionId` and other records carry a different snake_case `session_id`
left over from the session it was resumed from. Group by the file's own UUID
(the filename), not by trusting either in-record field — cross-check with
`canonical_session_id_note` in the cleaned output when they disagree, rather than
silently picking one.

## Truncation rules

- Tool input/output over ~2000 chars → keep `preview` (first ~500 chars) +
  `original_length_chars` + `content_truncated: true`, drop the rest.
- User prompt text over ~4000 chars → same preview/length treatment.
- Subagent transcripts are never inlined into the parent session file — only a
  summary block (`agent_id`, `agent_type`, `description`, `tool_use_count`,
  `duration_ms`, `outcome_summary`) with a pointer to the subagent's own file under
  `sessions/{date}/{session_id}/subagents/{agent_id}.json`.

## `harness_signals` is structural, not interpretive

The cleaning script should only emit facts it can directly observe or compute
(hook enabled/disabled, hook injections seen, tool errors, permission denials, plan
mode transitions, skill invocations, repeated failed attempts). Judging *whether*
those facts indicate a harness problem — e.g. "CLAUDE.md and AGENT.md contradict each
other and that caused rework in turn 8" — is the downstream analysis agent's job, not
this script's.
