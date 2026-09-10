# HDR-0001: Restrict the harness-fix implementer to harness and tooling files

- **Status:** accepted
- **Date:** 2026-09-10
- **Deciders:** harness-fix-implementer agent and workshop participant
- **Harness area:** tools | hooks | skills | validation

## Context

Exercise 3 promotes analysis findings into real harness changes and pull requests. That
flow needs enough write and shell capability to edit harness/tooling configuration, run
verification, commit, and open a PR. The same capability must not allow the
implementation agent to alter the TODO application's production code.

### Evidence

- **Baseline:** The exercise requires an agent that can read anything and write under
  `todo-app/` except `todo-app/src/**`; the previous harness had no agent-specific
  boundary for this flow.
- **Observed evidence:** Exercise 3's analysis identifies a real harness maintenance
  change in `todo-app/tsconfig.json`, while the task's success criteria require an
  attempted write to `todo-app/src/**` to be rejected. The selected finding's nine
  evidence session IDs were checked against `docs/log-schema/index.json`.
- **Relevant conditions:** The implementer must use `Edit`/`Write` for files and `Bash`
  for build, git, and optional GitHub operations. The agent has no need to modify
  application source code.

## Decision

Add a dedicated `harness-fix-implementer` agent with read, edit, write, and Bash tools.
Register a `PreToolUse` scope guard that checks `agent_type` and rejects paths under
`todo-app/src/**`, including source-targeting shell writes and staging attempts. Keep
this restriction agent-specific so the main session and unrelated agents are not
blocked. Extend the implementation skill to validate evidence, classify findings,
record the HDR decision before editing, and keep the HDR in the same PR.

## Rationale

An agent-level hook is preferred over a project-wide deny rule because the latter would
also block the main session and unrelated agents from ordinary source work. Removing
`Bash` would prevent the required build, git, and PR workflow; allowing it without a
path-aware guard would leave a route around the source boundary. A separate allow-list
for only `CLAUDE.md` and `AGENT.md` was rejected because legitimate mechanical fixes
can target tooling files such as `tsconfig.json` and `package.json`.

## Expected effect

**Hypothesis:**  If the implementer is given harness-oriented tools while a
source-path guard checks its `agent_type`, the likelihood of completing mechanical
harness fixes without changing production code should increase under comparable
conditions.

## Consequences

- **Positive:** Mechanical harness fixes can be implemented and verified in one flow;
  attempted production-code writes fail before the tool acts; the boundary is visible
  and reviewable.
- **Negative:** The guard adds hook configuration and must recognize both direct file
  paths and shell commands. A legitimate fix that genuinely requires source changes
  is escalated rather than completed by this agent.
- **Uncertain / possible regressions:** The available evidence does not establish
  coverage for every shell syntax or path spelling. The guard's shell-write patterns
  may require adjustment after validation findings.

## Validation

- **Signal / metric:** PreToolUse guard exit status for allowed harness edits and
  blocked `todo-app/src/**` edits.
- **Evaluation method:** Send representative JSON hook payloads for `Edit` against
  `todo-app/tsconfig.json`, `Edit` against `todo-app/src/main.ts`, and `Bash` using a
  source-targeting write command; run `npm run build` from `todo-app/`.
- **Evaluation window:** The Exercise 3 implementation run and future harness-fix PRs.
- **Success criteria:** Harness edits are allowed, source writes are rejected with a
  non-zero hook exit, the selected mechanical finding is implemented, and the app
  build passes.
- **Reconsider / revert when:** The agent cannot complete permitted harness/tooling
  fixes, or a source write bypass is demonstrated.
- **Regression signals:** A blocked source write returns zero, the main session is
  blocked by the guard, or a legitimate tooling fix is incorrectly classified as a
  source write.

### Revalidation triggers

- A new harness tool, hook event, or agent implementation changes the write path.
- A future finding requires a file boundary outside the current harness/tooling scope.
- A validation run demonstrates an unhandled shell syntax or path representation.

## Result

- **Outcome:** validated
- **Observed effect:** Direct edits to `todo-app/tsconfig.json` were allowed. An edit
  targeting `todo-app/src/main.ts` and a Bash `Set-Content` targeting that path were
  rejected with exit code 2. `npm run build` passed after the include-path fix.
- **Unexpected effects / regressions:** `npm install` reported two audit findings and
  an npm configuration warning; these were environment/package notices and did not
  fail the build. No main-session or unrelated-agent behavior was tested in this run.
- **Limitations:** The tests covered representative direct Edit and Bash payloads,
  not every possible shell command, path spelling, or agent runtime integration.
- **Follow-up:** keep
