#!/usr/bin/env node
// Stop hook — runs `npm run build` and blocks stopping if it fails, so a broken
// build (see analysis.json finding #1) can't ship silently at the end of a turn.

import { execSync } from 'node:child_process';

try {
  execSync('npm run build', { cwd: process.env.CLAUDE_PROJECT_DIR, stdio: 'pipe' });
  process.exit(0);
} catch (err) {
  const output = (err.stdout?.toString() ?? '') + (err.stderr?.toString() ?? '');
  process.stderr.write(`npm run build failed — fix before stopping:\n${output}\n`);
  process.exit(2);
}
