import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { config, isPathAllowed } from '../config';

const execAsync = promisify(exec);

const SHELL_OPERATORS = /[;&|`]/;

export async function executeCommand(args: {
  command: string;
  working_directory?: string;
  timeout_ms?: number;
}): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const { command, working_directory, timeout_ms } = args;

  if (!config.ALLOW_SHELL_OPERATORS && SHELL_OPERATORS.test(command)) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error:
              'Shell operators (;, &, |, `) are disabled. Set ALLOW_SHELL_OPERATORS=true in .env to enable.',
          }),
        },
      ],
    };
  }

  const cwd = working_directory
    ? path.resolve(working_directory)
    : config.ALLOWED_PATHS[0] ?? process.cwd();

  if (working_directory && !isPathAllowed(cwd)) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: `Directory not in ALLOWED_PATHS: ${cwd}` }),
        },
      ],
    };
  }

  const timeout = Math.min(
    timeout_ms ?? config.COMMAND_TIMEOUT_MS,
    config.MAX_COMMAND_TIMEOUT_MS
  );

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd,
      timeout,
      shell: 'cmd.exe',
      env: process.env,
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ stdout, stderr, exit_code: 0, timed_out: false }),
        },
      ],
    };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; code?: number; killed?: boolean };
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            stdout: e.stdout ?? '',
            stderr: e.stderr ?? String(err),
            exit_code: e.code ?? 1,
            timed_out: e.killed ?? false,
          }),
        },
      ],
    };
  }
}
