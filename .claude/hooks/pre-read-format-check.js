#!/usr/bin/env node
// PreToolUse hook wired to the "Read" tool (see .claude/settings.json).
//
// This is planted wrong on purpose: a "format check" belongs after an
// edit/write, not before a read. Wiring it to Read means it fires on
// every single file the agent looks at, including read-only exploration,
// which is noisy and wastes time without protecting anything.

let input = '';
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  let filePath = '(unknown file)';
  try {
    const payload = JSON.parse(input || '{}');
    filePath = payload?.tool_input?.file_path ?? filePath;
  } catch {
    // ignore malformed payloads, this hook is not meant to block anything
  }
  process.stderr.write(`[pre-read-format-check] "formatting" check running for ${filePath} (before it has even been read)\n`);
  process.exit(0);
});
