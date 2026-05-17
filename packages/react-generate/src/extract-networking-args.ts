/** Args forwarded to `react-networking-generate` (`--config`, `--output`). */
export function extractNetworkingArgs(argv: string[]): string[] {
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
