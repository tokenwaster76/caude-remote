import * as fs from 'fs/promises';
import * as path from 'path';
import { isPathAllowed } from '../config';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function readFile(args: {
  path: string;
  encoding?: 'utf8' | 'base64';
}): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const resolved = path.resolve(args.path);

  if (!isPathAllowed(resolved)) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: `Path not allowed: ${resolved}` }) }],
    };
  }

  try {
    const stat = await fs.stat(resolved);
    if (stat.size > MAX_BYTES) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: `File too large (${stat.size} bytes, max ${MAX_BYTES})` }),
          },
        ],
      };
    }

    const encoding = args.encoding ?? 'utf8';
    const buf = await fs.readFile(resolved);
    const text = encoding === 'base64' ? buf.toString('base64') : buf.toString('utf8');
    return { content: [{ type: 'text', text }] };
  } catch (err: unknown) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }],
    };
  }
}
