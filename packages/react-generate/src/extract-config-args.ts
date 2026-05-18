/** Args forwarded to codegen CLIs that only need `--config` (`react-networking-generate`, `react-i18n-generate`). */
export function extractConfigArgs(argv: string[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--config' || a === '-c') {
      const v = argv[++i];
      if (v) result.push('--config', v);
    }
  }
  return result;
}
