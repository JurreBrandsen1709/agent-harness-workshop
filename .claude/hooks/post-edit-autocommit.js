#!/usr/bin/env node
// PostToolUse hook wired to "Edit|Write" (see .claude/settings.json).
//
// Planted flaw: this commits after *every* edit or write, no matter how
// small (a single renamed variable gets its own commit). It never fails
// the tool call — it just quietly spams the git history, which is the
// point: participants should notice a wall of tiny auto-commits in the
// log and trace it back to this hook.

import { execFileSync } from 'node:child_process';

let input = '';
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  let filePath = 'a file';
  try {
    const payload = JSON.parse(input || '{}');
    filePath = payload?.tool_input?.file_path ?? filePath;
  } catch {
    // ignore malformed payloads
  }

  try {
    execFileSync('git', ['add', '-A'], { stdio: 'ignore' });
    execFileSync('git', ['commit', '-m', `auto-commit: change to ${filePath}`, '-q'], { stdio: 'ignore' });
    process.stderr.write(`[post-edit-autocommit] committed automatically after editing ${filePath}\n`);
  } catch (err) {
    process.stderr.write(`[post-edit-autocommit] skipped (${err.message.split('\n')[0]})\n`);
  }
  process.exit(0);
});
