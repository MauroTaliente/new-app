import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { extractNetworkingArgs } from './extract-networking-args.js';

export const REACT_GENERATE_HELP = `Usage: react-generate [options...]

Runs in order:
  1) react-styles-generate — same flags as standalone (see react-styles-generate --help)
  2) react-networking-generate — uses --config / --output from argv if present

Typical app (cwd next to react33.config.json):
  react-generate

With explicit config path:
  react-generate --config ./react33.config.json
`;

export type RunReactGenerateOptions = {
  stylesBin: string;
  networkingBin: string;
  cwd?: string;
  execPath?: string;
  spawn?: typeof spawnSync;
  log?: (message: string) => void;
  logError?: (message: string) => void;
};

export function runReactGenerate(argv: string[], options: RunReactGenerateOptions): number {
  const spawn = options.spawn ?? spawnSync;
  const cwd = options.cwd ?? process.cwd();
  const execPath = options.execPath ?? process.execPath;
  const log = options.log ?? console.log;
  const logError = options.logError ?? console.error;

  if (argv.includes('--help') || argv.includes('-h')) {
    log(REACT_GENERATE_HELP);
    return 0;
  }

  const stylesRun = spawn(execPath, [options.stylesBin, ...argv], {
    stdio: 'inherit',
    cwd,
  }) as SpawnSyncReturns<string>;
  if (stylesRun.status !== 0) {
    return stylesRun.status ?? 1;
  }
  if (stylesRun.error) {
    logError(String(stylesRun.error));
    return 1;
  }

  const netArgs = extractNetworkingArgs(argv);
  const netRun = spawn(execPath, [options.networkingBin, ...netArgs], {
    stdio: 'inherit',
    cwd,
  }) as SpawnSyncReturns<string>;
  if (netRun.error) {
    logError(String(netRun.error));
    return 1;
  }
  return netRun.status ?? 0;
}
