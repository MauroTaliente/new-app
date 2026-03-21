#!/usr/bin/env node

/**
 * Runs `react-styles-generate` then `react-networking-generate` so one command
 * refreshes CSS-derived tokens and API registry + client hooks from `lib.config.json`.
 */

import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

/** Resolve `dist/bin/*.js` via public export subpaths (no `package.json` in exports). */
function resolvePackageBin(packageName: string, binName: string): string {
  const resolved = require.resolve(`${packageName}/generate`);
  return join(dirname(resolved), 'bin', binName);
}

/** Args relevant to react-networking-generate (`--config`, `--output`). */
function extractNetworkingArgs(argv: string[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--config' || a === '-c') {
      const v = argv[++i];
      if (v) result.push('--config', v);
    } else if (a === '--output' || a === '-o') {
      const v = argv[++i];
      if (v) result.push('--output', v);
    }
  }
  return result;
}

const argv = process.argv.slice(2);

if (argv.includes('--help') || argv.includes('-h')) {
  console.log(`Usage: react-generate [options...]

Runs in order:
  1) react-styles-generate — same flags as standalone (see react-styles-generate --help)
  2) react-networking-generate — uses --config / --output from argv if present

Typical app (cwd next to lib.config.json):
  react-generate

With explicit config path:
  react-generate --config ./lib.config.json
`);
  process.exit(0);
}

const stylesBin = resolvePackageBin('@maurotaliente/react-styles', 'generate-tokens.js');
const networkingBin = resolvePackageBin('@maurotaliente/react-networking', 'generate-apis.js');

const stylesRun = spawnSync(process.execPath, [stylesBin, ...argv], {
  stdio: 'inherit',
  cwd: process.cwd(),
});
if (stylesRun.status !== 0) {
  process.exit(stylesRun.status ?? 1);
}
if (stylesRun.error) {
  console.error(stylesRun.error);
  process.exit(1);
}

const netArgs = extractNetworkingArgs(argv);
const netRun = spawnSync(process.execPath, [networkingBin, ...netArgs], {
  stdio: 'inherit',
  cwd: process.cwd(),
});
if (netRun.error) {
  console.error(netRun.error);
  process.exit(1);
}
process.exit(netRun.status ?? 0);
