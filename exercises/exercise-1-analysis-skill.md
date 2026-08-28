# Exercise 1: From mechanical extraction to real analysis

## What you start with

The `session-logs` skill (`.claude/skills/session-logs/`) currently does one thing:
it runs a deterministic script that reads raw Claude Code session logs and produces
two files:

- `harness-snapshot.json` — a point-in-time capture of the harness itself (CLAUDE.md/
  AGENT.md text, registered hooks with enabled/disabled status, the skill list,
  permissions), each entry tagged `control_type: "guide"` or `"sensor"`.
- `index.json` — one compact entry per session (`ai_title`, `first_prompt_preview`,
  timing/cost, and a `harness_signals` summary: which tools errored, which tools
  failed repeatedly, which skills were invoked, how many permission denials, hook
  fire counts).

Both are produced by plain rule-based extraction — string matching, counting,
truncation. No model call anywhere. Run it yourself first:

```
node .claude/skills/harness-snapshot/scripts/generate-harness-snapshot.mjs
node .claude/skills/session-logs/scripts/generate-sessions.mjs
```

Open the resulting `docs/log-schema/index.json`. This is all you're handed. Your
task: given only `harness-snapshot.json` and `index.json`, decide **which sessions
show that something in the harness needs to change, and what.**

## Why "just add more mechanical rollups" doesn't work

The obvious next move is to have the script itself compute the answer: sum up tool
errors by tool name, count how often each hook fired, group sessions that look
similar. That was tried here, and it failed in an instructive way.

The script originally grouped sessions by shared vocabulary in their `ai_title` and
first prompt — a keyword-overlap heuristic, filtered so that words appearing in
almost every session (like "security" in a batch of security-review sessions)
wouldn't count. It seemed to work. Then it merged two **completely unrelated**
sessions into one group, purely because both happened to contain the words "agent"
and "workshop" — words that are structurally common in this repo (it's a workshop
*about* agent harnesses), not evidence the two sessions were about the same thing.

Raising the similarity threshold patched that one case. But the failure mode is
structural, not a tuning problem: **a keyword-frequency heuristic cannot tell the
difference between "these sessions share vocabulary because they're about the same
recurring task" and "these sessions share vocabulary because they're both written in
English about this repo."** Any fix at the threshold level just moves where the next
false merge happens on different data.

There's a second, more important failure: mechanical counts can't produce insight
that requires *reading and reasoning*. The rollup could tell you "5 sessions had a
`Read` tool error" — a number. It could not tell you that all 5 of those errors were
the agent trying to read a file path that had clearly been hallucinated from a
*different* environment (a Linux-style `/home/user/repo/...` path, a path with a
different username, a stale OneDrive path) — because noticing that requires actually
opening the failed tool calls, reading the attempted paths, and recognizing the
pattern. No aggregate or cluster surfaces that; only reading does.

**The conclusion this repo's own build process reached:** decide *what's relevant*
with an LLM, not a script. The deterministic script's job stops at extracting
per-session facts. Deciding which facts matter, how sessions relate, and what to do
about it is a judgment call — it belongs in a phase where an agent actually reads the
data and reasons about it, and it should be **written down** (persisted), not just
reasoned about once in a chat and forgotten.

## Your task

Extend the `session-logs` skill with a second phase. Concretely:

1. Update `.claude/skills/session-logs/SKILL.md` to describe a "Phase 2: Analyze"
   step: after running the extraction script, the agent running the skill must read
   `harness-snapshot.json` and every session's compact entry in `index.json`, and
   write a new file, `analysis.json`, containing real findings.
2. Design the shape of a "finding." At minimum, each one should force whoever writes
   it to be concrete rather than vague — think about what fields make a claim
   checkable: which specific file/setting is this about? Is it a guide or a sensor?
   Which sessions actually support this claim? What's the reasoning connecting the
   evidence to the conclusion — not just a restated count? What would you actually
   change? How sure are you?
3. Actually run phase 2 yourself against this repo's real `index.json` +
   `harness-snapshot.json` and produce a real `analysis.json`.

## Rules for a real finding (not a template fill)

- **Group by actual meaning, not shared words.** If sessions are genuinely the same
  recurring ask (even phrased completely differently), that's one finding. Don't
  group sessions just because a keyword-matcher would.
- **Every finding must name a specific harness component** — an actual hook file, an
  actual CLAUDE.md section, an actual permissions entry. "Something seems off" is
  not a finding.
- **Don't stop at what `index.json` already tells you.** If a count looks
  interesting, go open the relevant `sessions/{date}/{id}.json` file(s) and check
  what's actually in the `tool_input_summary`/`error_preview` before writing the
  finding — that's usually where the real root cause is, not in the count itself.
- **Prioritize by real impact, not by which finding has the most sessions attached.**
  A single confirmed permission denial that reveals a missing guardrail can matter
  more than ten sessions sharing a topic.
- **Don't manufacture findings to fill a quota.** If the data only supports two solid
  findings, write two.

## Self-check

Before you consider this done, ask:

- Could someone unfamiliar with the raw logs read only `analysis.json` and know
  exactly which file to open and what to check, without re-deriving your reasoning?
- Is at least one of your findings something you could **not** have written from the
  mechanical counts in `index.json` alone — did you have to actually read something?
- If two of your findings recommend contradictory changes, did you notice, and say so?

## Solution

See `exercises/solutions/`: `session-logs-phase-2.md` is the reference "Phase 2:
Analyze" instructions, and `analysis-workshop.json` (this repo's own harness) plus
`analysis-home.json` (a second, independent dataset) are reference outputs. Don't
open these until you've attempted the exercise yourself. Compare your findings
against these — differences in wording are fine; differences in whether a finding is
concrete, evidenced, and reasoned are the thing
to check for.
