import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { extractConfigArgs } from './extract-config-args.js';
import { extractNetworkingArgs } from './extract-networking-args.js';

export const REACT_GENERATE_HELP = `Usage: react-generate [options...]

Runs in order:
  1) react-styles-generate — same flags as standalone (see react-styles-generate --help)
  2) react-session-generate — uses --config from argv if present
  3) react-networking-generate — uses --config / --output from argv if present
  4) react-i18n-generate — uses --config from argv if present
  5) react-theme-generate — uses --config from argv if present

Note: react-session-generate runs before react-networking-generate — the generated
API registry imports \`apiRuntime\` from the generated session module.

Typical app (cwd next to react33.config.json):
  react-generate

With explicit config path:
  react-generate --config ./react33.config.json
`;

export type RunReactGenerateOptions = {
  stylesBin: string;
  sessionBin: string;
  networkingBin: string;
  i18nBin: string;
  themeBin: string;
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
  }) as unknown as SpawnSyncReturns<string>;
  if (stylesRun.status !== 0) {
    return stylesRun.status ?? 1;
  }
  if (stylesRun.error) {
    logError(String(stylesRun.error));
    return 1;
  }

  // Session runs before networking: the generated API registry imports `apiRuntime`
  // from the generated session module, so that module must exist first.
  const configArgsForSession = extractConfigArgs(argv);
  const sessionRun = spawn(execPath, [options.sessionBin, ...configArgsForSession], {
    stdio: 'inherit',
    cwd,
  }) as unknown as SpawnSyncReturns<string>;
  if (sessionRun.status !== 0) {
    return sessionRun.status ?? 1;
  }
  if (sessionRun.error) {
    logError(String(sessionRun.error));
    return 1;
  }

  const netArgs = extractNetworkingArgs(argv);
  const netRun = spawn(execPath, [options.networkingBin, ...netArgs], {
    stdio: 'inherit',
    cwd,
  }) as unknown as SpawnSyncReturns<string>;
  if (netRun.status !== 0) {
    return netRun.status ?? 1;
  }
  if (netRun.error) {
    logError(String(netRun.error));
    return 1;
  }

  const configArgs = extractConfigArgs(argv);
  const i18nRun = spawn(execPath, [options.i18nBin, ...configArgs], {
    stdio: 'inherit',
    cwd,
  }) as unknown as SpawnSyncReturns<string>;
  if (i18nRun.status !== 0) {
    return i18nRun.status ?? 1;
  }
  if (i18nRun.error) {
    logError(String(i18nRun.error));
    return 1;
  }

  const themeRun = spawn(execPath, [options.themeBin, ...configArgs], {
    stdio: 'inherit',
    cwd,
  }) as unknown as SpawnSyncReturns<string>;
  if (themeRun.error) {
    logError(String(themeRun.error));
    return 1;
  }
  return themeRun.status ?? 0;
}
