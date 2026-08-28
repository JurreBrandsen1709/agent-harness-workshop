#!/usr/bin/env node
// Generates the harness-snapshot.json artifact described in docs/log-schema/README.md.
// Usage: node generate-harness-snapshot.mjs [project-dir] [output-path]
//
// project-dir is the directory containing the harness being analyzed (CLAUDE.md,
// AGENT.md, .claude/settings.json, .claude/hooks, .claude/skills) — defaults to
// "workshop", since this repo separates the workshop app/harness under test from
// the meta-tooling (this skill, docs/log-schema) that lives at the repo root.
// output-path is resolved relative to the current working directory, not project-dir.

import {
  existsSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import { join, dirname, resolve } from "node:path";

const invocationDir = process.cwd();
const projectDir = resolve(invocationDir, process.argv[2] || "workshop");
const outputPath = resolve(
  invocationDir,
  process.argv[3] || "docs/log-schema/harness-snapshot.json",
);

function readOrNull(relPath) {
  const abs = join(projectDir, relPath);
  return existsSync(abs)
    ? readFileSync(abs, "utf8").replace(/\r\n/g, "\n").trimEnd()
    : null;
}

function extractHookCommands(hooksBlock) {
  const results = [];
  for (const [event, entries] of Object.entries(hooksBlock || {})) {
    for (const entry of entries) {
      const matcher = entry.matcher ?? null;
      for (const hook of entry.hooks || []) {
        if (hook.type === "command") {
          results.push({ event, matcher, command: hook.command });
        }
      }
    }
  }
  return results;
}

function commandToRelFile(command) {
  const match = command.match(/\.claude[\\/]hooks[\\/][^"'\s]+\.js/);
  return match ? match[0].replace(/\\/g, "/") : null;
}

function analyzeHookFile(relFile) {
  const abs = join(projectDir, relFile);
  if (!existsSync(abs)) return { locActive: 0, locTotal: 0 };
  const lines = readFileSync(abs, "utf8").split("\n");
  let locTotal = 0;
  let locActive = 0;
  for (const raw of lines) {
    const line = raw.trim();
    if (line === "") continue;
    locTotal++;
    if (!line.startsWith("//")) locActive++;
  }
  return { locActive, locTotal };
}

const HOOK_EVENT_OBSERVABILITY = {
  UserPromptSubmit: {
    observable: true,
    note: () =>
      "If enabled, this hook's hookSpecificOutput.additionalContext is injected inline ahead of the next user turn and IS visible in the transcript (as a hook_injection event).",
  },
  Stop: {
    observable: true,
    note: () =>
      "Stop hooks surface via a system/stop_hook_summary record (hookInfos, hookErrors, preventedContinuation) even when they produce no additionalContext.",
  },
  PreToolUse: {
    observable: false,
    note: () =>
      "PreToolUse hook stdout/stderr is not persisted in session JSONL; enabled/disabled status can only be determined by reading this file, not by scanning transcripts.",
  },
  PostToolUse: {
    observable: false,
    note: () =>
      "PostToolUse hook stdout/stderr and side effects are not observable from the transcript alone; correlate this hook's tool_call timestamps against external state (e.g. git log) if you need to confirm it fired.",
  },
};

function buildHooks(settings) {
  return extractHookCommands(settings.hooks).map(
    ({ event, matcher, command }) => {
      const file = commandToRelFile(command);
      const { locActive, locTotal } = file
        ? analyzeHookFile(file)
        : { locActive: 0, locTotal: 0 };
      const observability = HOOK_EVENT_OBSERVABILITY[event] ?? {
        observable: false,
        note: () =>
          `Observability for '${event}' hooks is not yet characterized; verify manually.`,
      };
      return {
        file,
        event,
        matcher,
        command,
        enabled: locActive > 0,
        loc_active: locActive,
        loc_total: locTotal,
        observable_in_transcript: observability.observable,
        observability_note: observability.note(),
      };
    },
  );
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fields = {};
  for (const line of match[1].split("\n")) {
    const fieldMatch = line.match(/^([a-zA-Z_]+):\s*(.+)$/);
    if (fieldMatch) fields[fieldMatch[1]] = fieldMatch[2].trim();
  }
  return fields;
}

function buildSkills() {
  const skillsDir = join(projectDir, ".claude/skills");
  if (!existsSync(skillsDir)) return [];
  const skills = [];
  for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillMdPath = join(skillsDir, entry.name, "SKILL.md");
    if (!existsSync(skillMdPath)) continue;
    const frontmatter = parseFrontmatter(readFileSync(skillMdPath, "utf8"));
    skills.push({
      name: frontmatter.name || entry.name,
      path: `.claude/skills/${entry.name}/SKILL.md`,
      summary: frontmatter.description || "",
    });
  }
  return skills;
}

const settingsPath = join(projectDir, ".claude/settings.json");
const settings = existsSync(settingsPath)
  ? JSON.parse(readFileSync(settingsPath, "utf8"))
  : {};
const settingsLocalExists = existsSync(
  join(projectDir, ".claude/settings.local.json"),
);

const snapshot = {
  captured_at: new Date().toISOString(),
  project_dir: projectDir,
  instructions: {
    "CLAUDE.md": readOrNull("CLAUDE.md"),
    "AGENT.md": readOrNull("AGENT.md"),
    "SKILLS.md": readOrNull("SKILLS.md"),
    _note:
      "Generated mechanically: check CLAUDE.md and AGENT.md above for contradictory guidance or broken references and replace this placeholder with a concrete note if found — this script does not attempt semantic comparison.",
  },
  hooks: buildHooks(settings),
  skills: buildSkills(),
  permissions: {
    raw: settings.permissions || {},
    _note: settingsLocalExists
      ? ".claude/settings.local.json is also present and may override these permissions."
      : "No .claude/settings.local.json found; permissions come only from .claude/settings.json.",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(snapshot, null, 2) + "\n");
console.log(`Wrote harness snapshot to ${outputPath}`);
