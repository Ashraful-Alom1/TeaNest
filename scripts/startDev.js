const { spawn } = require('child_process');

// Free ports 5173, 5174, 5001 before starting
require('./killPorts');

console.log('\x1b[36m%s\x1b[0m', '🌿 Starting Tea Nest Official Backend & Frontend Applications...');

// Print unified access link banner
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
  try { storeProcess.kill(); } catch {}
  try { adminProcess.kill(); } catch {}
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
