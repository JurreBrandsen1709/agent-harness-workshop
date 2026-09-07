# Exercise 5: Validate before the human decides

## What you start with

The continuous-improvement flow can now:

- analyze previous agent sessions;
- propose harness improvements;
- prepare concrete harness changes;
- record meaningful decisions in an HDR;
- open a pull request containing the change and its decision record.

The pull request is your **Human-in-the-Loop**.

A human can inspect the change and decide whether to approve it.

But there is still a problem: the reviewer should not have to reconstruct the
entire improvement cycle themselves just to decide whether the change looks safe
and justified.

Before handing the pull request to them, the agent should validate as much as it
reasonably can.

## Why "just test the new behavior" is harder than it sounds

For normal code, validation often means running a deterministic test suite.

Harness changes are different.

Changing an instruction, skill, hook, tool, or permission can influence future
agent behavior, but proving that behavior would usually require running new agent
sessions against the changed harness.

Doing that for every small improvement would make a continuous-improvement loop
slow and expensive.

And even then, one successful agent run would not prove that the harness is now
correct in every situation.

So the goal here is not:

**Prove that the new harness will behave correctly.**

It is:

**Reduce uncertainty enough for a human to make a good review decision.**

## What can you validate without running new chats?

Quite a lot of the improvement chain is already observable.

For example, the agent can check whether:

- the change actually addresses the finding that caused it;
- the proposal, resulting diff, and HDR still describe the same decision;
- the original session evidence supports the claimed root cause;
- the changed harness now contains contradictory instructions or overlapping
  responsibilities;
- new tools or permissions match the responsibility they were introduced for;
- the change reaches outside the intended harness scope.

This does not prove future behavior.

It does give the reviewer evidence that the change is internally consistent,
traceable to a real problem, and does not introduce obvious new risks.

## Your task

Extend the continuous-improvement flow with a validation phase that runs **before
the pull request is handed to the human reviewer**.

Do not start new agent chats to test the changed harness.

Instead, use the artifacts and evidence already produced by the improvement flow
to validate the change.

Add the validation result to the pull request so the reviewer can see:

- what was checked;
- what passed or failed;
- what evidence supports those checks;
- what remains uncertain.

The agent may prepare the evidence.

The agent does **not** approve its own change.

The pull request remains the Human-in-the-Loop gate.

## Things to design

1. **What should be validated?**

   Decide which checks give useful confidence without turning every harness change
   into a large evaluation project.

   Consider traceability, original evidence, harness consistency, scope, tools,
   and permissions.

2. **What evidence should each check use?**

   A validation result should not just say `PASS`.

   Decide which artifacts allow the agent to justify that result: `analysis.json`,
   supporting sessions, the proposal, the final harness state, the diff, or the
   HDR.

3. **How much validation is enough?**

   Not every change deserves the same effort.

   Fixing an obviously broken path is different from granting a new tool or
   changing a blocking hook.

   Think about how the validation effort should scale with the impact and
   uncertainty of the change.

4. **How should uncertainty be reported?**

   Some things cannot be established without observing future agent behavior.

   Make that explicit rather than turning missing evidence into a green checkmark.

5. **What does the reviewer need in the pull request?**

   Design a compact validation summary that helps a human quickly decide whether
   to approve the PR or request changes.

   The reviewer should not need to replay the whole continuous-improvement cycle.

6. **What happens when validation finds a problem?**

   Validation should check whether the change conforms to the decision already
   made — not start another open-ended improvement cycle.

   Decide which problems the agent may correct within the existing decision,
   which require a new human decision, and when it should stop and leave the pull
   request in draft.

   A new idea for making the harness "even better" is not automatically a
   validation failure. Improvements outside the current decision belong in a
   future improvement cycle.

## Success criteria

- A harness change is validated before it is presented for human approval.
- Validation is based on evidence, not generic claims such as "looks good".
- The agent checks that finding, proposal, change, and HDR remain consistent.
- Relevant tool and permission boundaries are checked.
- The validation clearly states what could **not** be established.
- Validation effort is proportional to the change rather than identical for every
  PR.
- The validation summary is added to the pull request.
- Problems within the existing decision may be corrected, but validation does not
  expand the scope of the change.
- If resolving a validation problem requires a new design decision, the agent
  stops and leaves that decision to the human reviewer.
- Validation can stop even when further improvements are imaginable.
- The agent stops at **ready for human review** and never approves or merges its
  own harness change.

## Self-check

Before you consider this done, ask:

- Would a reviewer understand why each validation check passed or failed?
- Did the agent validate the actual change, rather than merely restating the HDR?
- Are important uncertainties visible?
- Is the validation lightweight enough that people would actually keep using this
  improvement loop?
- Can the human make a reasonable approval decision from the PR without
  reconstructing the entire analysis themselves?
- Could validation stop even if the agent can still imagine further improvements?