#!/usr/bin/env node
// Renders a Claude Code .jsonl transcript in a form you can actually skim.
//
// Works on any transcript, not just the fabricated ones in this folder — point
// it at ~/.claude/projects/<your-repo>/*.jsonl and it behaves the same. That is
// the point: the reader is the transferable part.
//
//   node read-transcript.mjs <path> [flags]
//
//   --tools-only          just the tool calls and their results
//   --since-last-prompt   only the final turn
//   --grep <pattern>      only lines matching (case-insensitive regex)
//   --full                don't truncate long tool output
//   --no-color            plain text

import { readFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith('--')));
const path = argv.find((a) => !a.startsWith('--'));
const grepAt = argv.indexOf('--grep');
const grep = grepAt !== -1 ? new RegExp(argv[grepAt + 1], 'i') : null;

if (!path) {
  console.error(
    [
      'usage: node read-transcript.mjs <transcript.jsonl> [flags]',
      '',
      '  --tools-only          just the tool calls and their results',
      '  --since-last-prompt   only the final turn',
      '  --grep <pattern>      only lines matching (case-insensitive regex)',
      '  --full                do not truncate long tool output',
      '  --no-color            plain text',
      '',
      'Transcripts live in ~/.claude/projects/<cwd-with-separators-as-dashes>/'
    ].join('\n')
  );
  process.exit(1);
}

const COLOR = !flags.has('--no-color') && process.stdout.isTTY !== false;
const c = (code, s) => (COLOR ? `[${code}m${s}[0m` : s);
const dim = (s) => c('2', s);
const bold = (s) => c('1', s);
const cyan = (s) => c('36', s);
const green = (s) => c('32', s);
const yellow = (s) => c('33', s);
const red = (s) => c('31', s);
const magenta = (s) => c('35', s);

const MAX = flags.has('--full') ? Infinity : 24;

function clip(text, max = MAX) {
  const lines = String(text ?? '').split('\n');
  if (lines.length <= max) return lines;
  return [...lines.slice(0, max), dim(`  … ${lines.length - max} more lines (--full to see them)`)];
}

function indent(lines, prefix = '    ') {
  return lines.map((l) => prefix + l).join('\n');
}

const raw = readFileSync(path, 'utf8').split('\n').filter((l) => l.trim());
const entries = [];
raw.forEach((line, i) => {
  try {
    entries.push(JSON.parse(line));
  } catch {
    console.error(red(`! line ${i + 1} is not valid JSON — skipping`));
  }
});

// --since-last-prompt: rewind to the final user prompt (a user line whose
// message content is a plain string, i.e. typed by a human, not a tool result).
let start = 0;
if (flags.has('--since-last-prompt')) {
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    if (e.type === 'user' && typeof e.message?.content === 'string') {
      start = i;
      break;
    }
  }
}

const toolNames = new Map(); // tool_use id -> name, so results can be labelled

function textOf(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
}

function stringifyResult(block) {
  const v = block.content;
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.map((b) => (b.type === 'text' ? b.text : `[${b.type}]`)).join('\n');
  return JSON.stringify(v, null, 2);
}

const out = [];
let shown = 0;

for (const e of entries.slice(start)) {
  const blocks = [];

  switch (e.type) {
    case 'user': {
      const content = e.message?.content;
      if (typeof content === 'string') {
        if (flags.has('--tools-only')) break;
        blocks.push(bold(cyan('▸ USER')), indent(clip(content)));
      } else if (Array.isArray(content)) {
        for (const b of content) {
          if (b.type !== 'tool_result') continue;
          const name = toolNames.get(b.tool_use_id) ?? 'tool';
          const body = stringifyResult(b);
          const isErr = b.is_error || /^Error:/m.test(body);
          blocks.push(
            (isErr ? red('  ← ') : green('  ← ')) + bold(name) + dim(` result`),
            indent(clip(body), '      ')
          );
        }
      }
      break;
    }

    case 'assistant': {
      for (const b of e.message?.content ?? []) {
        if (b.type === 'text') {
          if (flags.has('--tools-only')) continue;
          if (!b.text.trim()) continue;
          blocks.push(bold('● ASSISTANT'), indent(clip(b.text)));
        } else if (b.type === 'tool_use') {
          toolNames.set(b.id, b.name);
          const arg =
            b.input?.command ??
            b.input?.file_path ??
            b.input?.pattern ??
            b.input?.description ??
            '';
          blocks.push(yellow('  → ') + bold(b.name) + (arg ? dim(`  ${arg}`) : ''));
          const detail = b.input?.content ?? b.input?.new_string;
          if (detail && !flags.has('--tools-only')) {
            blocks.push(indent(clip(detail, flags.has('--full') ? Infinity : 12), '      '));
          }
        } else if (b.type === 'thinking') {
          if (flags.has('--tools-only')) continue;
          blocks.push(dim('◈ thinking'), dim(indent(clip(b.thinking, 6))));
        }
      }
      break;
    }

    case 'attachment': {
      if (flags.has('--tools-only')) break;
      const a = e.attachment ?? {};
      const label = a.type ?? 'attachment';
      // Hook injections are the interesting ones — they are instructions the
      // agent received that never appear in any file you'd think to open.
      const body = a.additionalContext ?? a.content ?? a.stdout ?? '';
      if (!body) {
        blocks.push(dim(`  ⚑ ${label}`));
      } else {
        blocks.push(magenta('  ⚑ ') + bold(label) + (a.hookName ? dim(`  ${a.hookName}`) : ''));
        blocks.push(indent(clip(body, 12), '      '));
      }
      break;
    }

    case 'system': {
      if (flags.has('--tools-only') && !e.content) break;
      const body = e.content ?? e.subtype ?? '';
      if (body) blocks.push(dim(`  ⚙ ${String(body).split('\n')[0]}`));
      break;
    }

    // Bookkeeping line types (mode, permission-mode, last-prompt, ai-title,
    // file-history-*, cost-state, …). Not content; skipped unless you ask.
    default:
      break;
  }

  if (!blocks.length) continue;
  const text = blocks.join('\n');
  if (grep && !grep.test(text)) continue;
  out.push(text);
  shown += 1;
}

console.log(out.join('\n\n'));

const kinds = entries.reduce((acc, e) => ((acc[e.type] = (acc[e.type] ?? 0) + 1), acc), {});
console.log(
  '\n' +
    dim(
      `── ${entries.length} lines · ${shown} shown · ` +
        Object.entries(kinds)
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => `${k}:${v}`)
          .join(' ')
    )
);
