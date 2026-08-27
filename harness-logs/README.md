# harness-logs

Agent transcripts to read, analyse, and trace back to the harness that produced
them.

The workshop's normal loop is *use the repo → read your own transcripts → find
the surprises → trace each one to the file that caused it*. That first step takes
days of real sessions before there's anything worth reading. These logs skip the
wait and aim the exercise at one specific failure instead of whatever happened to
come up.

They are **`.jsonl` only**. No rendered Markdown version, deliberately — the
skill being taught is reading a real transcript, and given a tidied-up rendering
side by side, everyone reads that instead and the exercise evaporates.

> **These transcripts are fabricated.** They are written to the shape of real
> Claude Code sessions and every file path, file content and command in them is
> real for this repo, but no agent produced them. See *Fidelity* at the bottom
> for exactly how far that goes.

## Reading them

```
node harness-logs/read-transcript.mjs harness-logs/undertesting/00-trim-blank-todos.jsonl
```

Flags, which map to the questions you actually end up asking:

| Flag | Answers |
|---|---|
| `--tools-only` | "what did it *do*, never mind what it said" |
| `--since-last-prompt` | "just the last turn" |
| `--grep <pattern>` | "where does `vitest` appear at all" |
| `--full` | stop truncating long tool output |
| `--no-color` | piping somewhere |

**The reader takes any transcript path, not just these.** That's the part worth
keeping. Your own sessions are on disk right now:

```
~/.claude/projects/<cwd-with-separators-as-dashes>/<session-id>.jsonl
```

This repo, for instance, becomes
`~/.claude/projects/C--Users-you-workshops-agent-harness-workshop/`. One `.jsonl`
per session, appended to live as the session runs.

```
node harness-logs/read-transcript.mjs ~/.claude/projects/<your-own-repo>/<session>.jsonl --tools-only
```

## What's in `undertesting/`

Five sessions, five different tasks against this app. Every one of them ends with
the agent reporting success.

| Log | Task |
|---|---|
| `00-trim-blank-todos` | Reject blank / whitespace-only todos |
| `01-edit-todo-text` | Rename an existing todo |
| `02-search-filter` | Filter todos by a text query |
| `03-due-dates` | Due dates and an overdue indicator |
| `04-storage-migration` | Consolidate two storage keys into one |

They are independent sessions against the same starting state, not a sequence.
Read `00` first and treat it as the reference: it is the one where the agent did
the job properly, and it's the yardstick for the other four.

### How to work through them

1. **Read `00` end to end.** Note what "done" looks like when it's done right —
   in particular *when* the agent decides what to test, and what it does with the
   output of a command rather than the fact that it ran one.
2. **For each of `01`–`04`, answer three questions:**
   - What did the agent *claim* in its final message?
   - What does the transcript *show* it actually did? (`--tools-only` is the fast
     path — the tool calls can't spin.)
   - What's the gap, and what would have caught it?
3. **Trace it.** Every one of these behaviours has a cause in this repo's
   harness — `CLAUDE.md`, `AGENT.md`, `SKILLS.md`, a file under `.claude/skills/`,
   or a hook under `.claude/hooks/`. Find the instruction. Don't stop at "the
   agent should have tried harder"; that isn't a harness bug and you can't fix it.
4. **Check the claims against the repo.** Several of these logs assert things
   that are checkable in about ten seconds against the actual working tree. If a
   claim doesn't survive that check, ask why nothing in the harness made the agent
   check it either.
5. **Then fix the harness** and re-run a comparable task against it.

A hint on where to look that costs nothing: read every `⚑ hook_additional_context`
line the reader prints. That is text injected into the conversation by a hook. It
is a genuine instruction the agent received, it shaped what it did, and it is not
in any file you'd think to open.

### Pointing an agent at them

Analysing transcripts is itself a decent agent task:

```
Read the transcripts in harness-logs/undertesting/ with
harness-logs/read-transcript.mjs. For each one, tell me what the agent claimed,
what it actually did, and which file in this repo's harness pushed it there.
Quote the specific instruction.
```

Worth doing *after* your own pass, not instead of it — and worth checking, since
it's running under the same harness that produced the behaviour.

## Fidelity

What's real:

- Every file path, file content, and command in these logs is real for this repo.
- The line shapes match real Claude Code transcripts: `user` / `assistant` /
  `system` / `attachment` / `file-history-snapshot`, tool calls as
  `message.content[].type === "tool_use"`, results as a `user` line carrying a
  `tool_result` block plus a sibling `toolUseResult`.
- `parentUuid` chains resolve, every `tool_use` has exactly one matching result,
  timestamps move forwards.
- The hook noise is real behaviour: the `UserPromptSubmit` injection at the top of
  each session and the `[wip-commit] saved progress` lines after each edit are
  both things this repo's hooks genuinely do.

What isn't, stated plainly so nobody is misled:

- **Not verified against `claude --resume`.** These parse and render correctly
  under `read-transcript.mjs`, which is also known to handle real transcripts
  (tested against a 330-line one covering all thirteen line types). Whether Claude
  Code itself would resume them as sessions is untested.
- Real transcripts carry bookkeeping line types these don't (`mode`,
  `permission-mode`, `last-prompt`, `ai-title`, `cost-state` and others). The
  reader ignores them; a stricter consumer might not.
- The transcript format is not a public contract and changes between releases, so
  these have a shelf life. If they stop rendering, that's why.

One deliberate exception to "every file content is real": `00-trim-blank-todos`
shows a `src/state/todoStore.ts` *without* the blank-label guard, because the task
it demonstrates is already implemented in this repo. Its starting state never
existed in git history. Its ending state is what's on disk today.
