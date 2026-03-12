import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getSystemInfo(): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();

  let processes: string[] = [];
  try {
    const { stdout } = await execAsync('tasklist /FO CSV /NH', { timeout: 10000 });
    processes = stdout
      .trim()
      .split('\n')
      .slice(0, 30) // top 30 processes
      .map((line) => {
        const parts = line.split('","');
        const name = parts[0]?.replace(/^"/, '') ?? '';
        const pid = parts[1] ?? '';
        const mem = parts[4]?.replace(/"$/, '') ?? '';
        return `${name} (PID: ${pid}, Mem: ${mem})`;
      });
  } catch {
    processes = ['(could not retrieve process list)'];
  }

  const info = {
    hostname: os.hostname(),
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    uptime_seconds: os.uptime(),
    cpu: {
      model: cpus[0]?.model ?? 'unknown',
      cores: cpus.length,
    },
    memory: {
      total_mb: Math.round(totalMem / 1024 / 1024),
      free_mb: Math.round(freeMem / 1024 / 1024),
      used_mb: Math.round((totalMem - freeMem) / 1024 / 1024),
    },
    processes,
  };

  return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] };
}
