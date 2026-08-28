# Agent Harness Workshop

A small, realistic-looking codebase for a workshop on improving an **agent harness** — the
instructions, skills, and hooks that shape how a coding agent (Claude Code or similar) behaves
in a repository.

## What's in here

- **A TODO app.** Node.js + TypeScript + TailwindCSS, built with Vite. It works, but it wasn't
  written carefully: naming conventions vary from file to file, there's a redundant
  abstraction layer, and a couple of overlapping types that don't need to both exist. That's
  deliberate — it's meant to resemble a codebase that grew without much oversight, the kind
  agents run into constantly.
- **An agent harness.** `CLAUDE.md`, `AGENT.md`, `SKILLS.md`, individual skill files under
  `.claude/skills/`, and hooks under `.claude/hooks/` / `.claude/settings.json`. The harness is
  also imperfect, on purpose — that's the actual subject of the workshop.

## Getting started

```
npm install
npm run dev
```

Then open the printed local URL. `npm run build` type-checks and builds for production.

## How the workshop works

1. **Use the repo.** Spend some time working in this codebase with an agent — add a feature,
   fix something, ask it to clean up a file, ask it to plan a change. Do this over a few
   sessions if you can; a single short session won't surface much.
2. **Read back your own transcripts.** Look at what the agent actually did versus what you
   asked for. Where did it go further than you expected? Where did it stop and ask when it
   should have just acted, or act when it should have asked? Where did it seem to reach for the
   wrong tool or skill?
3. **Trace the behavior to its source.** Every surprising behavior in this repo's harness has a
   cause somewhere in `CLAUDE.md`, `AGENT.md`, `SKILLS.md`, a skill file, or a hook. Find it.
4. **Fix the harness, not the symptom.** Tighten scope, resolve conflicting instructions,
   narrow overlapping skills, fix hooks that fire on the wrong event or too often. Re-run your
   scenarios and see whether the behavior actually changed.

If you're facilitating this workshop, see `FACILITATOR_GUIDE.md` for the full list of what was
planted and why — don't read it beforehand if you're a participant, it'll spoil the exercise.

## Project layout

```
src/
  main.ts                    entry point
  types.ts                   core Task type
  Todo.ts                    a second, overlapping TodoItem type
  state/todoStore.ts         app state
  features/todo/todoFeature.ts   a thin wrapper around the store
  components/                mixed naming conventions on purpose
  utils/                     storage + misc helpers
CLAUDE.md / AGENT.md / SKILLS.md
.claude/skills/               individual skill definitions
.claude/hooks/, .claude/settings.json   hook wiring
```
