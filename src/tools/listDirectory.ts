import * as fs from 'fs/promises';
import * as path from 'path';
import { isPathAllowed } from '../config';

interface Entry {
  name: string;
  type: 'file' | 'directory' | 'other';
  size?: number;
  modified?: string;
  children?: Entry[];
}

async function readDir(dirPath: string, depth: number, maxDepth: number): Promise<Entry[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const result: Entry[] = [];

  for (const dirent of entries) {
    const fullPath = path.join(dirPath, dirent.name);
    const type = dirent.isDirectory() ? 'directory' : dirent.isFile() ? 'file' : 'other';

    const entry: Entry = { name: dirent.name, type };

    if (dirent.isFile()) {
      try {
        const stat = await fs.stat(fullPath);
        entry.size = stat.size;
        entry.modified = stat.mtime.toISOString();
      } catch {
        // ignore stat errors
      }
    }

    if (dirent.isDirectory() && depth < maxDepth) {
      try {
        entry.children = await readDir(fullPath, depth + 1, maxDepth);
      } catch {
        entry.children = [];
      }
    }

    result.push(entry);
  }

  return result;
}

export async function listDirectory(args: {
  path: string;
  recursive?: boolean;
  max_depth?: number;
}): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const resolved = path.resolve(args.path);

  if (!isPathAllowed(resolved)) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: `Path not allowed: ${resolved}` }) }],
    };
  }

  try {
    const maxDepth = args.recursive ? (args.max_depth ?? 2) : 0;
    const entries = await readDir(resolved, 0, maxDepth);
    return { content: [{ type: 'text', text: JSON.stringify(entries, null, 2) }] };
  } catch (err: unknown) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }],
    };
  }
}
