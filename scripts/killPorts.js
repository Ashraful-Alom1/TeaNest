const { execSync } = require('child_process');

const ports = [5173, 5174, 5001];

for (const port of ports) {
  try {
    const out = execSync(`netstat -ano -p tcp | findstr :${port}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
    const lines = out.split('\n');
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5 && parts[1].endsWith(`:${port}`)) {
        const pid = parseInt(parts[parts.length - 1], 10);
        if (pid && pid > 0 && pid !== process.pid) {
          try {
            process.kill(pid, 'SIGKILL');
            console.log(`Freed port ${port} by terminating PID ${pid}`);
          } catch {}
        }
      }
    }
  } catch {
    // Port not in use, continue
  }
}
