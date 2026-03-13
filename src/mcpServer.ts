import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { executeCommand } from './tools/executeCommand';
import { readFile } from './tools/readFile';
import { writeFile } from './tools/writeFile';
import { listDirectory } from './tools/listDirectory';
import { getSystemInfo } from './tools/getSystemInfo';
import { takeScreenshot } from './tools/takeScreenshot';

export function createMcpServer(): McpServer {
  const server = new McpServer(
    { name: 'windows-remote', version: '1.0.0' },
    { capabilities: { logging: {} } }
  );

  // @ts-ignore — TS2589: Zod optional+describe chains exceed TS inference depth with MCP SDK generics
  server.tool(
    'execute_command',
    'Execute a shell command on the Windows machine and return stdout/stderr',
    {
      command: z.string().describe('Command to run (cmd.exe syntax)'),
      working_directory: z.string().optional().describe('Working directory (must be in ALLOWED_PATHS)'),
      timeout_ms: z.number().int().positive().optional().describe('Timeout in ms (max MAX_COMMAND_TIMEOUT_MS)'),
    },
    (args) => executeCommand(args)
  );

  server.tool(
    'read_file',
    'Read the contents of a file on the Windows machine',
    {
      path: z.string().describe('Absolute or relative file path'),
      encoding: z.enum(['utf8', 'base64']).optional().describe('Output encoding (default: utf8)'),
    },
    (args) => readFile(args)
  );

  // @ts-ignore — TS2589: same as above
  server.tool(
    'write_file',
    'Write content to a file on the Windows machine',
    {
      path: z.string().describe('Absolute or relative file path'),
      content: z.string().describe('Content to write'),
      encoding: z.enum(['utf8', 'base64']).optional().describe('Content encoding (default: utf8)'),
      create_dirs: z.boolean().optional().describe('Create parent directories if missing'),
    },
    (args) => writeFile(args)
  );

  server.tool(
    'list_directory',
    'List files and folders in a directory on the Windows machine',
    {
      path: z.string().describe('Directory path to list'),
      recursive: z.boolean().optional().describe('List recursively'),
      max_depth: z.number().int().positive().optional().describe('Max recursion depth (default: 2)'),
    },
    (args) => listDirectory(args)
  );

  server.tool(
    'get_system_info',
    'Get Windows system information: CPU, memory, uptime, and running processes',
    {},
    () => getSystemInfo()
  );

  server.tool(
    'take_screenshot',
    'Capture a screenshot of the Windows desktop',
    {
      monitor_id: z.number().int().nonnegative().optional().describe('Monitor index (0 = primary)'),
    },
    (args) => takeScreenshot(args)
  );

  return server;
}
