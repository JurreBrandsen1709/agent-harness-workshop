# Exercise 2: A skill that proposes harness fixes

## What you start with

From Exercise 1 you now have three artifacts for a given project's harness:

- `harness-snapshot.json` — what the harness currently *is* (guides and sensors).
- `index.json` — per-session mechanical facts (no aggregates, no clustering — just
  what happened, session by session).
- `analysis.json` — real findings: specific harness components, evidence, reasoning,
  recommendations, confidence.

## Your task

Build a new skill (e.g. `.claude/skills/propose-harness-fixes/`) that takes those
three files as its context and produces a concrete, reviewable set of proposed
changes to the harness. It must **propose only — never apply a fix itself.** A human
reviews and decides.

This exercise is about **context engineering**: which of the three files does the
skill actually need to load, in what order, and when should it go back and read
something it didn't start with? Getting a good answer out of an agent here depends
less on prompt wording and more on what context it's given and how that context is
structured.

## Why you can't just hand `analysis.json` to an agent and say "fix these"

Not every finding in `analysis.json` is equally safe to act on. Walk through the
findings in `exercises/solutions/analysis-workshop.json` and
`exercises/solutions/analysis-home.json` (the reference outputs from Exercise 1) and
notice they fall into different categories:

- **Mechanically verifiable, unambiguous.** E.g. "these three hooks are registered
  but every line is commented out" — the fix is directly checkable against the same
  file the finding cites. A confident, concrete proposal is safe here.
- **Correct diagnosis, but the fix requires a decision only a human can make.** E.g.
  CLAUDE.md and AGENT.md give opposite instructions on whether the agent should
  auto-commit — the finding is airtight, but *which* policy should win isn't in the
  data anywhere. An agent that picks one silently and "fixes" it is guessing.
- **Correct diagnosis, but the fix touches something outside what's observable.**
  E.g. a recurring prompt contains hallucinated file paths from some report-
  generation step that isn't visible anywhere in the repo — proposing a patch to a
  system you can't see isn't a real fix, it's a guess dressed up as one.

A skill that treats all three of these the same way — and just starts writing
patches — will produce some good fixes and some confidently wrong ones, with no way
to tell which is which from the output alone. That's the design problem to solve.

## Things to design (this is the exercise — there's no solution provided yet)

1. **What context does the skill load, and when?** Does it need full `sessions/*.json`
   files at all, or is `harness-snapshot.json` + `index.json` + `analysis.json`
   usually enough? When should it escalate to reading a specific session file for
   more evidence before proposing something?
2. **How does it distinguish the three categories above** before proposing anything?
   Consider whether `analysis.json`'s schema needs to grow a field for this (e.g.
   something like `fix_type: "mechanical" | "policy_decision" | "needs_investigation"`)
   — and if so, whether that's set during Exercise 1's analysis phase or computed by
   this new skill.
3. **What does a "proposal" look like for each category?** A mechanical finding
   probably deserves an actual proposed diff/patch. A policy-decision finding
   probably deserves two labeled options with tradeoffs, not a patch. A
   needs-investigation finding probably deserves a named next step ("go find where
   X is generated"), not a fix attempt.
4. **What should the skill refuse to do?** Think about what happens if it's handed
   an incomplete or stale `analysis.json`, or a finding whose `evidence_session_ids`
   don't actually exist in `index.json`. Should it sanity-check its own inputs before
   proposing anything from them?

## Success criteria

- Given the same three input files twice, a human reviewer can tell, for each
  proposal, whether it's safe to apply as-is, a decision they need to make, or
  something that needs more digging — without having to re-derive that themselves.
- The skill never edits the harness directly. It writes proposals; it doesn't act on
  them.
- Feed it the two reference `analysis.json` files in `exercises/solutions/` (or,
  better, your own from Exercise 1) and see whether its proposals for each category
  actually match the distinctions above — or whether it treats a policy decision as
  if it were a mechanical fix.
