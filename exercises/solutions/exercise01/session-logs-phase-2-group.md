# Solution reference: `session-logs` Phase 2 (Exercise 1)

This is the "Phase 2: Group" section as it existed in the built solution's
`.claude/skills/session-logs/SKILL.md`, before the skill was stripped back to a
Phase-1-only starter for the workshop. Use this to compare against your own
Exercise 1 attempt — not to copy in before you've tried it yourself.

The corresponding example output is `exercises/solutions/exercise01/groups.json`,
generated against this repo's own `harness-logs/` dataset. Note what it does *not*
contain: no `why_it_matters`, no `recommendation`, no `confidence`. That reasoning is
Exercise 2's job, built from this output plus further reading — not this phase's.

---

## Phase 2: Group (your judgment, required)

Read `harness-snapshot.json` and every session's compact entry in `index.json`
(`ai_title`, `first_prompt_preview`, `harness_signals`) — this is small enough to hold
in context directly. Open an individual `sessions/*.json` file only when you need to
confirm whether two sessions are really the same underlying issue, not just similarly
worded. Then write `groups.json` (same directory as `index.json`) with your actual
groupings:

```json
{
  "generated_at": "<ISO timestamp>",
  "based_on": { "harness_snapshot": "harness-snapshot.json", "index": "index.json" },
  "groups": [
    {
      "id": 1,
      "title": "Short label for the group",
      "control_type": "guide | sensor | guide+sensor",
      "harness_component": "the specific file/setting this is about, e.g. .claude/hooks/post-edit-autocommit.js or ~/.claude/settings.json permissions.allow",
      "evidence_session_ids": ["..."]
    }
  ]
}
```

This is real grouping, not a template to fill in mechanically:

- **Group by actual meaning, not shared words.** If several sessions are clearly the
  same recurring ask (even phrased differently), that's one group, not several. If two
  sessions share vocabulary but aren't really related, don't group them — you're not
  bound by any keyword threshold, use judgment.
- **Every group must name a specific harness component** (a specific hook file, a
  specific CLAUDE.md/AGENT.md section, a specific permissions entry, a missing guide
  that should exist) and its `control_type`, per the guide/sensor framing in
  `harness-snapshot.json`. "Something seems off" is not a group.
  `evidence_session_ids` must point at sessions that actually support the claim —
  don't cite a session just because it's in the list.
  A confirmed sensor-side signal — an `enabled: true` hook whose
  `hooks_observed_firing` count is 0 across every session, or an `enabled: false` hook
  that's registered like it's supposed to be live (dead sensor) — is exactly the kind
  of thing worth its own group.
- **Don't manufacture groups to fill a quota.** If the data only supports two solid
  groups, write two.
- **Stop at grouping.** Naming the component and citing evidence is this phase's job.
  Deciding why it matters, what to do, and how confident you are needs more reading
  than this phase does — that's Phase 3, a separate skill (Exercise 2), not this one.

Re-run phase 2 (rewrite `groups.json`) whenever `index.json` or `harness-snapshot.json`
changes meaningfully — it's not auto-derived, so it goes stale if you don't.
