const { spawn } = require('child_process');
const http = require('http');

// 1. Free ports 5173, 5174, 5001 before starting
require('./killPorts');

console.log('\x1b[36m%s\x1b[0m', '🌿 Starting Tea Nest API & Sync Server...');

// 2. Start Sync Server first
const syncProcess = spawn('npx tsx watch scripts/syncServer.ts', [], {
  stdio: ['ignore', 'pipe', 'inherit'],
  shell: true,
});

syncProcess.stdout.on('data', (data) => {
  const line = data.toString();
  process.stdout.write(`\x1b[34m[SYNC]\x1b[0m ${line}`);
});

// 3. Wait until port 5001 is listening and responsive before launching Vite
function waitForBackend(callback, attempts = 0) {
  if (attempts > 50) {
    console.warn('\x1b[33m%s\x1b[0m', '[WARN] Backend taking longer than usual, proceeding to launch storefront...');
    return callback();
  }

  const req = http.get('http://127.0.0.1:5001/api/state', (res) => {
    res.resume();
    callback();
  });

  req.on('error', () => {
    setTimeout(() => waitForBackend(callback, attempts + 1), 100);
  });

  req.setTimeout(500, () => {
    req.destroy();
    setTimeout(() => waitForBackend(callback, attempts + 1), 100);
  });
}

waitForBackend(() => {
  console.log('\n\x1b[32m%s\x1b[0m', '✓ Tea Nest Backend API is ready on port 5001.');
  console.log('\x1b[1m\x1b[32m%s\x1b[0m', '⚡ Launching Unified Storefront & Admin Console...\n');

  // Print unified single link banner
  console.log('\x1b[33m%s\x1b[0m', '═══════════════════════════════════════════════════════════════');
  console.log('\x1b[1m\x1b[37m  🌿 TEA NEST UNIFIED ACCESS LINK:\x1b[0m');
  console.log('\x1b[1m\x1b[32m  ➜  http://localhost:5173/\x1b[0m');
  console.log('');
  console.log('\x1b[36m     • Storefront:       http://localhost:5173/\x1b[0m');
  console.log('\x1b[35m     • Admin Console:    http://localhost:5173/admin/\x1b[0m');
  console.log('\x1b[33m%s\x1b[0m\n', '═══════════════════════════════════════════════════════════════');

  const storeProcess = spawn('npm run dev:storefront', {
    stdio: ['ignore', 'inherit', 'inherit'],
    shell: true,
  });

  const adminProcess = spawn('npm run dev:admin', {
    stdio: ['ignore', 'inherit', 'inherit'],
    shell: true,
  });

  const cleanup = () => {
    try { syncProcess.kill(); } catch {}
    try { storeProcess.kill(); } catch {}
    try { adminProcess.kill(); } catch {}
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
});
