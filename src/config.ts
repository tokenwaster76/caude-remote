import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

const AUTH_TOKEN = requireEnv('AUTH_TOKEN');
if (AUTH_TOKEN.length < 32) {
  throw new Error('AUTH_TOKEN must be at least 32 characters long');
}

export const config = Object.freeze({
  PORT: parseInt(process.env['PORT'] ?? '3000', 10),
  AUTH_TOKEN,
  ALLOWED_PATHS: (process.env['ALLOWED_PATHS'] ?? 'C:\\Users\\Mario')
    .split(';')
    .map((p) => path.resolve(p)),
  COMMAND_TIMEOUT_MS: parseInt(process.env['COMMAND_TIMEOUT_MS'] ?? '30000', 10),
  MAX_COMMAND_TIMEOUT_MS: parseInt(process.env['MAX_COMMAND_TIMEOUT_MS'] ?? '300000', 10),
  ALLOW_SHELL_OPERATORS: process.env['ALLOW_SHELL_OPERATORS'] === 'true',
  TUNNEL_HOSTNAME: process.env['TUNNEL_HOSTNAME'] ?? '',
});

export function isPathAllowed(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  return config.ALLOWED_PATHS.some((allowed) => resolved.startsWith(allowed));
}
