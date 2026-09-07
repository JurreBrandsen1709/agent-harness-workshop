# Solution reference: `session-logs` Phase 2 (Exercise 1)

This is the "Phase 2: Analyze" section as it existed in the built solution's
`.claude/skills/session-logs/SKILL.md`, before the skill was stripped back to a
Phase-1-only starter for the workshop. Use this to compare against your own
Exercise 1 attempt — not to copy in before you've tried it yourself.

The corresponding example output is `exercises/solutions/exercise01/analysis.json`,
generated against this repo's own `harness-logs/` dataset.

---

## Phase 2: Analyze (your judgment, required)

Read `harness-snapshot.json` and every session's compact entry in `index.json`
(`ai_title`, `first_prompt_preview`, `harness_signals`) — this is small enough to hold
in context directly, you don't need to open individual `sessions/*.json` files unless
one entry looks worth a closer read. Then write `analysis.json` (same directory as
`index.json`) with your actual findings:

```json
{
  "generated_at": "<ISO timestamp>",
  "based_on": { "harness_snapshot": "harness-snapshot.json", "index": "index.json" },
  "findings": [
    {
      "id": 1,
      "title": "Short label for the finding",
      "control_type": "guide | sensor | guide+sensor",
      "harness_component": "the specific file/setting this is about, e.g. .claude/hooks/post-edit-autocommit.js or ~/.claude/settings.json permissions.allow",
      "evidence_session_ids": ["..."],
      "why_it_matters": "the reasoning connecting the evidence to the gap — not just a restated count",
      "recommendation": "a concrete change, specific enough to act on",
      "confidence": "high | medium | low"
    }
  ]
}
```

This is real analysis, not a template to fill in mechanically:

- **Group by actual meaning, not shared words.** If several sessions are clearly the
  same recurring ask (even phrased differently), that's one finding, not several. If
  two sessions share vocabulary but aren't really related, don't group them — you're
  not bound by any keyword threshold, use judgment.
- **Every finding must name a specific harness component** (a specific hook file, a
  specific CLAUDE.md/AGENT.md section, a specific permissions entry, a missing guide
  that should exist) and its `control_type`, per the guide/sensor framing in
  `harness-snapshot.json`. "Something seems off" is not a finding.
  `evidence_session_ids` must point at sessions that actually support the claim —
  don't cite a session just because it's in the list.
  A confirmed sensor-side signal — an `enabled: true` hook whose `hooks_observed_firing` count is 0 across every session, or an `enabled: false` hook that's registered like it's supposed to be live (dead sensor) — is exactly the kind of thing worth its own finding.
- **Prioritize by real impact**, not by which one has the most sessions attached. A
  single confirmed permission denial that reveals a missing guardrail can matter more
  than ten sessions sharing a topic.
- **Don't manufacture findings to fill a quota.** If the data only supports two solid
  findings, write two.

Re-run phase 2 (rewrite `analysis.json`) whenever `index.json` or
`harness-snapshot.json` changes meaningfully — it's not auto-derived, so it goes stale
if you don't.
