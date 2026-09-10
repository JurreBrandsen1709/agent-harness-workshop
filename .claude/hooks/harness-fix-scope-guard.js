#!/usr/bin/env node

let input = '';
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  let payload;
  try {
    payload = JSON.parse(input || '{}');
  } catch {
    process.stderr.write('harness-fix-scope-guard received invalid hook input\n');
    process.exit(2);
  }

  if (payload.agent_type !== 'harness-fix-implementer') {
    process.exit(0);
  }

  const toolName = payload.tool_name ?? '';
  const toolInput = payload.tool_input ?? {};
  const candidate = [
    toolInput.file_path,
    toolInput.path,
    toolInput.command,
    toolInput.content,
    toolInput.new_string,
  ]
    .filter((value) => typeof value === 'string')
    .join('\n');
  const sourcePath = /(?:^|[\\/])todo-app[\\/]src(?:[\\/]|$)/i;

  if (sourcePath.test(candidate)) {
    process.stderr.write(
      `harness-fix-implementer may not write or stage todo-app/src/** via ${toolName}\n`,
    );
    process.exit(2);
  }

  if (toolName === 'Bash' && /(?:>|>>|tee|Set-Content|Out-File|Add-Content|New-Item)/i.test(candidate)) {
    process.stderr.write(
      'harness-fix-implementer may not use shell write operations; use Edit or Write for harness files\n',
    );
    process.exit(2);
  }

  process.exit(0);
});
