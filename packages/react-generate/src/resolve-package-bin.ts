import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const ownRequire = createRequire(import.meta.url);

/**
 * Resolve a generator package's `dist/bin/<binName>` via its public `./generate`
 * export subpath (`package.json` is not in `exports`).
 *
 * Resolution prefers the **consumer's** installed copy — resolved from `cwd`
 * (where `react33.config.json` lives) — and only falls back to react-generate's
 * own tree. This decouples the orchestrator's version from the leaf generators:
 * bumping e.g. `@react33/react-i18n` in the app picks up the new bin without
 * republishing react-generate (whose `workspace:*` deps would otherwise pin the
 * leaf versions frozen at react-generate's own publish time).
 */
export function resolvePackageBin(
  packageName: string,
  binName: string,
  cwd: string = process.cwd(),
): string {
  const requirers = [createRequire(join(cwd, 'package.json')), ownRequire];
  let lastError: unknown;
  for (const req of requirers) {
    try {
      const resolved = req.resolve(`${packageName}/generate`);
      return join(dirname(resolved), 'bin', binName);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}
