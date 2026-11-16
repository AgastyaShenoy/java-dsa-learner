// After `next build` (standalone output): copy the static assets next to the standalone
// server, the way `next start` would serve them. electron-builder then ships
// .next/standalone as resources/server.
import { cpSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const standalone = join(root, '.next', 'standalone');
if (!existsSync(join(standalone, 'server.js'))) {
  console.error('No .next/standalone/server.js. Run `next build` with output: "standalone" first.');
  process.exit(1);
}

cpSync(join(root, '.next', 'static'), join(standalone, '.next', 'static'), { recursive: true });
if (existsSync(join(root, 'public'))) cpSync(join(root, 'public'), join(standalone, 'public'), { recursive: true });

// Next copies the project's .env files into standalone; the desktop app must not ship them.
for (const f of ['.env', '.env.local', '.env.production', '.env.production.local']) {
  rmSync(join(standalone, f), { force: true });
}
console.log('standalone server ready at .next/standalone');
