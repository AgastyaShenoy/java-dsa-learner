// electron-builder hook: copy the standalone Next server into resources/server.
// (Done here rather than with extraResources, which drops node_modules folders.)
const { cpSync, existsSync } = require('node:fs');
const { join } = require('node:path');

exports.default = async function afterPack(context) {
  const from = join(context.packager.projectDir, '.next', 'standalone');
  if (!existsSync(join(from, 'server.js'))) throw new Error('Run `npm run desktop:build` first: .next/standalone is missing.');
  const to = join(context.appOutDir, 'resources', 'server');
  cpSync(from, to, { recursive: true, dereference: true });
  console.log(`  • copied standalone server  to=${to}`);
};
