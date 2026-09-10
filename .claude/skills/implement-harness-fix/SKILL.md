---
name: implement-harness-fix
description: Validate and implement one evidenced harness finding without touching todo-app/src/**.
---

# Implement Harness Fix

Use this skill only through the `harness-fix-implementer` agent. The agent may edit
harness and tooling files under `todo-app/`, but it must never edit, create, delete,
or stage files under `todo-app/src/**`.

## Inputs and refusal rules

- Read `docs/log-schema/analysis.json` as the source of findings.
- Read `docs/log-schema/index.json` and confirm every `evidence_session_ids` value in
  the selected finding exists in `index.sessions[].session_id`.
- Read the referenced harness files before deciding a fix is still applicable.
- If a session is missing, the finding is stale: do not edit, commit, or open a PR.
- If the proposed fix needs `todo-app/src/**`, refuse the whole finding and report the
  path that crosses the boundary.
- Leave findings other than the selected one untouched. In full mode, classify all
  findings but implement only one safe finding.

## Classification

Assign exactly one category before acting:

- `mechanical`: the recommendation is directly checkable against a named harness or
  tooling file, has no unresolved `conflicts_with`, and does not need a product or
  team policy choice. Finding 1 is the reference mechanical case: the app-local
  TypeScript config must use `include: ["src"]`.
- `policy_decision`: the evidence is sound but the recommendation conflicts with
  another finding or requires choosing a team policy. Do not guess. Finding 4 is in
  this category because it conflicts with finding 2's automatic-commit question.
- `needs_investigation`: the proposed change depends on an environment or fact not
  established by the evidence, or the current target cannot be verified.

Finding 2 must not be silently enabled because it conflicts with finding 4. Finding 3
may be classified as mechanical in isolation, but it is not selected for this exercise.

## Execution protocol

1. Announce the selected finding id, category, evidence validation result, and target
   files before editing.
2. Decide whether each proposed harness change warrants an HDR before editing. A
  mechanical path repair with one obvious outcome does not. A permission change,
  new agent, blocking hook, policy choice, or responsibility move between harness
  components does. Record that decision in the run report.
3. For a change that warrants an HDR, capture the evidence, alternatives, rationale,
  expected effect, consequences, and validation plan before making the edit. Write
  the record from that captured context using `exercises/hdr-template.md`; never
  reconstruct rationale from the final diff. Put HDRs under
  `docs/harness-decisions/` with a stable `HDR-XXXX-*.md` name and add them to the
  same branch and PR as the harness change.
4. If the captured context does not establish a template field, write `[Not
  established by the available evidence]` rather than inventing an explanation.
5. For `mechanical`, make the smallest harness/tooling edit. Do not modify
   `analysis.json`, `groups.json`, or application source.
6. Run the narrowest relevant verification first. For finding 1, run `npm install`
   only when dependencies are absent, then run `npm run build` from `todo-app/`.
7. Review `git diff --check` and the focused diff. The commit message must include the
   finding id and category, for example: `fix(harness): repair finding 1 build path`.
8. Try to open a PR that names the finding id, evidence validation, category, HDR
  decision, and verification. If `gh` authentication or push access is unavailable,
  retain the local commit and write `PR_DESCRIPTION.md` with the same traceability
  instead.
9. For `policy_decision` and `needs_investigation`, do not edit or commit. Report the
   reason, the evidence that was checked, and the concrete human decision or next
   investigation needed.

The agent must include the HDR decision and any HDR path in its PR body. For this
exercise, the restricted agent and its blocking scope guard are meaningful changes
and require an HDR even though the selected finding's `tsconfig` edit does not.

## Required report

The final report must list every finding classified in the run and state one of:
`implemented`, `escalated`, or `refused-stale`. For each proposed change include
`HDR: warranted` or `HDR: not warranted` and the reason. For the implemented finding
include changed files, verification output, commit id, and PR URL or the local PR
description path. Explicitly state that findings not selected were left untouched.
