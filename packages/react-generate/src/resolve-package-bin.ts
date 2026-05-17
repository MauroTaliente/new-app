import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

/** Resolve `dist/bin/*.js` via public export subpaths (no `package.json` in exports). */
export function resolvePackageBin(packageName: string, binName: string): string {
  const resolved = require.resolve(`${packageName}/generate`);
  return join(dirname(resolved), 'bin', binName);
}
