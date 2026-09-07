# Exercise 4: Record why the harness changed

## What you start with

From the previous exercises, the continuous-improvement flow can now move from
observed agent behavior to a concrete harness change.

It can analyze past sessions, identify improvements, prepare harness changes, and
put those changes in a pull request.

That preserves **what changed**.

It does not yet preserve **why**.

A future reviewer may see that an instruction changed, a skill gained a tool, or
an agent lost a permission — without knowing which evidence led to that decision
or why this solution was chosen.

## What is a Harness Decision Record?

A **Harness Decision Record (HDR)** is a persistent record of a meaningful
decision about an agent harness.

Like an Architecture Decision Record (ADR), it captures the reasoning behind a
design choice. Its scope is the harness: instructions, skills, agents, hooks,
tools, permissions, knowledge, and other mechanisms that shape agent behavior.

An HDR helps someone later answer:

- What problem led to this decision?
- What did we decide?
- Why did we choose this approach?
- What alternatives or trade-offs mattered?
- What behavior do we expect to change?

The value is not the Markdown file itself. The value is preserving reasoning that
would otherwise disappear into a session, pull-request discussion, or diff.

A template is provided at:

`exercises/hdr-template.md`

## Does every harness change need an HDR?

Not necessarily.

An HDR records a **decision**, not every edit.

Fixing a typo or repairing an obviously broken path probably does not need one.
Giving an agent a new tool, changing its permissions, moving responsibility
between harness components, or changing a hook from advisory to blocking probably
does.

Too few HDRs means important reasoning disappears. Too many makes the decision
history noisy and less useful.

## Why "just summarize the diff" doesn't work

The obvious approach is to let an agent inspect the final diff and fill in the
HDR template afterwards.

But a diff only shows what changed.

It might show that an agent gained GitHub access. It cannot tell you whether that
was deliberately required to create pull requests or simply added because it
seemed useful.

Likewise, the absence of production-code write access might be an intentional
safety boundary — or something nobody considered.

If the HDR writer reconstructs those reasons afterwards, plausible reasoning can
quietly become invented reasoning.

The improvement flow therefore needs to preserve enough context about the
decision for the HDR writer to record it faithfully.

## Your task

Extend the continuous-improvement agent from Exercise 3 so that it considers
whether a harness change warrants an HDR and, when it does, produces one using:

`exercises/hdr-template.md`

The HDR must be added to the **same pull request** as the harness change.

Do not write the HDR yourself.

Design the flow so the agent has enough context to produce a trustworthy record
of the decision.

## Things to design

1. **What context does the HDR writer need?**

   Decide which existing artifacts it should use: the analysis, proposal, actual
   change, supporting evidence, or decisions captured while preparing the change.

2. **When should reasoning be captured?**

   Some reasoning cannot reliably be reconstructed from the final diff.

   Pay particular attention to decisions about tools and permissions: why was a
   capability granted, withheld, or restricted?

3. **How do you prevent invented rationale?**

   Decide what happens when the HDR template asks for reasoning that is not
   actually present in the available context.

   A visibly incomplete decision record is better than a convincing fictional one.

4. **When is an HDR warranted?**

   Decide how your flow distinguishes mechanical maintenance from a meaningful
   harness decision worth preserving.

5. **How does the HDR relate to the change?**

   Decide where HDRs live, how they are named, and how a reviewer can connect the
   decision record to the pull request and harness change it describes.

## Success criteria

- The continuous-improvement flow considers whether a change warrants an HDR.
- Meaningful harness decisions produce an HDR using `exercises/hdr-template.md`.
- The HDR is included in the same pull request as the change.
- The record connects the change to the evidence and reasoning behind it.
- Relevant tool and permission choices are explained, not merely listed.
- Missing reasoning is not silently invented.
- Trivial mechanical changes do not automatically create decision-record noise.
- A reviewer can understand **what changed and why** without replaying the entire
  improvement run.

## Self-check

Before you consider this done, ask:

- Could the HDR have been written honestly from the context available to the agent?
- Does it capture the actual decision rather than a plausible explanation of the diff?
- Are important tool and permission boundaries recorded as deliberate choices?
- Would this decision still be understandable six months from now?
- Are you recording meaningful decisions, rather than simply recording every change?