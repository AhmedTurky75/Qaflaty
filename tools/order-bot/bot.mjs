#!/usr/bin/env node
/**
 * Entry point. The bot's sources are TypeScript and are run without a build step, but which
 * Node versions do that unaided differs:
 *
 *   < 22.6      no type stripping at all — nothing to do but ask for a newer Node
 *   22.6–22.17  supported behind --experimental-strip-types
 *   >= 22.18    on by default
 *
 * Rather than make the caller know which they have, re-exec with the flag when the running
 * process cannot load a .ts file on its own.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const MAIN = join(dirname(fileURLToPath(import.meta.url)), 'src', 'main.ts');
const args = process.argv.slice(2);

if (process.features.typescript) {
  // This process can load TypeScript directly.
  await import(MAIN);
} else {
  const [major = 0, minor = 0] = process.versions.node.split('.').map(Number);
  const canStripWithFlag = major > 22 || (major === 22 && minor >= 6);

  if (!canStripWithFlag) {
    console.error(
      `order-bot needs Node 22.6 or newer to run its TypeScript sources (found ${process.version}).\n` +
        'Node 22.18+ or 24+ is recommended — those run it with no flags at all.',
    );
    process.exit(2);
  }

  const result = spawnSync(process.execPath, ['--experimental-strip-types', MAIN, ...args], {
    stdio: 'inherit',
    // Keeps Node's "Type Stripping is an experimental feature" notice off the run's output.
    env: { ...process.env, NODE_NO_WARNINGS: '1' },
  });

  if (result.error) {
    console.error(`Could not start the bot: ${result.error.message}`);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}
