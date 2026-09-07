# Exercise 3: Implement a harness fix — with an agent that can't touch your source code

From Exercise 2 you have `analysis.json`: fully-reasoned findings, each with a
harness component, why it matters, a recommendation, and a confidence level. Nothing
has actually changed in the harness yet — that's this exercise.

## Task

Two things, and they depend on each other:

1. **Set up a dedicated, restricted agent** for this job — one that can read
   anything, but can only *write* within the harness surface (`todo-app/CLAUDE.md`,
   `todo-app/AGENT.md`, `todo-app/.claude/**`) and is explicitly denied write access
   to `todo-app/src/**` — the actual application code. It has no business changing
   app logic, only the harness around it.
2. **Build a skill**, e.g. `.claude/skills/implement-harness-fix/`, that this agent
   runs: it reads `analysis.json`, decides for each finding whether it's safe to
   implement directly, needs a human decision, or needs more investigation — and for
   the ones it can safely handle, actually makes the change, commits it, and opens a
   pull request.

This is a jump in blast radius from Exercise 2: that skill only ever wrote a JSON file
that nothing else read. This one writes real files and opens a real PR. The
write-restriction above is exactly what makes that jump survivable — design it first,
not as an afterthought once the skill already works.

## Why you can't just point an unrestricted agent at `analysis.json` and say "fix these"

Walk through your own (or the reference) `analysis.json` and notice the findings
aren't equally safe to act on:

- **Mechanically verifiable.** E.g. "this hook is registered but every line is
  commented out" — checkable against the same file the finding cites. Safe to
  implement directly.
- **Correct diagnosis, fix needs a human decision.** E.g. two guide files give
  opposite instructions on autonomy — airtight finding, but *which* policy should win
  isn't in the data anywhere. An agent that picks one silently is guessing, not
  implementing.
- **Correct diagnosis, fix touches something unobservable.** E.g. a recurring failure
  depends on which shell/OS the team actually uses — something not settled by
  anything in `analysis.json`. Implementing a "fix" here isn't a fix, it's a guess
  dressed up as one.

An agent that treats all three the same and just starts editing files will produce
some good changes and some confidently wrong ones, indistinguishable in the resulting
PR unless you design for the difference up front.

## Things to design

1. **Tool and permission design for the agent.** Beyond denying writes to
   `todo-app/src/**`: does it need unrestricted `Bash` (it has to run `git`/`gh`
   commands), or should that be scoped too? What's the actual risk of unrestricted
   `Bash` for an agent whose whole job is "implement a harness fix and open a PR"?
2. **Classifying findings before acting.** Does `analysis.json`'s schema need a new
   field for this (e.g. `fix_type: "mechanical" | "policy_decision" |
   "needs_investigation"`) — and if so, is it set by Exercise 2's skill, or computed
   fresh by this one?
3. **What the agent actually does per category.** Mechanical: implement for real —
   diff, commit, PR. Policy-decision: don't guess — surface the two (or more) options
   with tradeoffs, and either stop or open a draft PR that says so explicitly.
   Needs-investigation: don't touch anything — report the concrete next step.
4. **The permission boundary catches things the classification doesn't.** What
   happens when a "mechanical" finding's fix would actually need to touch
   `todo-app/src/**`? Does the agent refuse the whole finding, split it, or escalate
   to a human — and how does it notice this *before* attempting the write, not after
   it's denied?
5. **Refusing bad input.** What should happen if `analysis.json` is stale, or a
   finding's `evidence_session_ids` don't exist in `index.json`? Should the skill
   sanity-check its inputs before implementing anything from them?

## Success criteria

- The agent literally cannot write to `todo-app/src/**` — verify this by actually
  trying to get it to, not just by reading the permission config and assuming it
  holds.
- Mechanical findings get implemented for real: a diff, a commit, a PR.
- Policy-decision and needs-investigation findings are never silently "fixed" — they
  come out flagged, with the reasoning for *why* they weren't touched, not guessed at.
- Every tool the agent has access to has a one-sentence justification for why it
  needs it — you'll need this again in Exercise 4, when the HDR has to explain these
  decisions.
- The PR traces back to the specific `analysis.json` finding that motivated it.

## Self-check

- Did you verify the write-restriction actually holds, rather than assuming the deny
  rule works because you wrote it correctly?
- Would a reviewer be able to tell, from the PR alone, which finding and which
  category of fix produced it?
- Did the skill ever guess at a policy decision instead of stopping and saying so?
- If a finding's evidence didn't check out, did the agent notice, or did it implement
  anyway?

## Solution

Reference solutions live on the `solutions` branch, not on `master` — check it out
into a **separate** directory so it's never in your agent's working tree:

```
git fetch origin solutions
git worktree add ../workshop-solutions solutions
```

`../workshop-solutions/exercises/solutions/exercise03/` has a reference restricted-
agent definition, a reference skill design (`implement-harness-fix-SKILL.md`), and an
example of what it produces for each of the three categories against
`../workshop-solutions/exercises/solutions/exercise02/analysis.json`. Attempt your own
design first — this one's meant for comparison, not copying. Remove the worktree when
you're done: `git worktree remove ../workshop-solutions`.
