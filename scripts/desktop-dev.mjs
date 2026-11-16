// Run the desktop shell against `next dev` (hot reload) instead of the bundled server.
// Note: the dev origin is localhost:3000, so it has its own IndexedDB (separate from
// the installed app's data).
import { spawn } from 'node:child_process';
import http from 'node:http';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const electronPath = require('electron');
const URL = 'http://localhost:3000';

const next = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['next', 'dev'], { stdio: 'inherit', shell: process.platform === 'win32' });

const wait = () => new Promise(resolve => {
  const ping = () => http.get(URL, res => { res.resume(); resolve(); }).on('error', () => setTimeout(ping, 300));
  ping();
});

await wait();
const app = spawn(electronPath, ['.'], { stdio: 'inherit', env: { ...process.env, ELECTRON_START_URL: URL } });
app.on('exit', code => { next.kill(); process.exit(code ?? 0); });
