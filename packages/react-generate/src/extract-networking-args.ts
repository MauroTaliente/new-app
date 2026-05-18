import { extractConfigArgs } from './extract-config-args.js';

/** Args forwarded to `react-networking-generate` (`--config`, `--output`). */
export function extractNetworkingArgs(argv: string[]): string[] {
  const result = extractConfigArgs(argv);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--output' || a === '-o') {
      const v = argv[++i];
      if (v) result.push('--output', v);
    }
  }
  return result;
}
