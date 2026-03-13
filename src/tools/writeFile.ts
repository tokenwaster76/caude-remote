import * as fs from 'fs/promises';
import * as path from 'path';
import { isPathAllowed } from '../config';

export async function writeFile(args: {
  path: string;
  content: string;
  encoding?: 'utf8' | 'base64';
  create_dirs?: boolean;
}): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const resolved = path.resolve(args.path);

  if (!isPathAllowed(resolved)) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: `Path not allowed: ${resolved}` }) }],
    };
  }

  try {
    if (args.create_dirs) {
      await fs.mkdir(path.dirname(resolved), { recursive: true });
    }

    const encoding = args.encoding ?? 'utf8';
    const buf = encoding === 'base64' ? Buffer.from(args.content, 'base64') : Buffer.from(args.content, 'utf8');
    await fs.writeFile(resolved, buf);

    return {
      content: [{ type: 'text', text: JSON.stringify({ ok: true, bytes_written: buf.length, path: resolved }) }],
    };
  } catch (err: unknown) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }],
    };
  }
}
