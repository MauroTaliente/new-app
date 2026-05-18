import { createRequire } from 'node:module';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** Resolve `jiti` from this package root (works under pnpm + `file:` links). */
function loadJiti() {
  let dir = dirname(fileURLToPath(import.meta.url));
  if (basename(dir) === 'bin') dir = dirname(dir);
  if (basename(dir) === 'dist') dir = dirname(dir);
  const require = createRequire(join(dir, 'package.json'));
  return require('jiti') as typeof import('jiti');
}

function pickLocaleRoot(
  mod: Record<string, unknown>,
  localeCode: string,
): Record<string, unknown> | undefined {
  const byLocale = mod[localeCode];
  if (byLocale != null && typeof byLocale === 'object' && !Array.isArray(byLocale)) {
    return byLocale as Record<string, unknown>;
  }
  const d = mod.default;
  if (d != null && typeof d === 'object' && !Array.isArray(d)) {
    const fromDefault = (d as Record<string, unknown>)[localeCode];
    if (
      fromDefault != null &&
      typeof fromDefault === 'object' &&
      !Array.isArray(fromDefault)
    ) {
      return fromDefault as Record<string, unknown>;
    }
    return d as Record<string, unknown>;
  }
  return undefined;
}

/** Load a locale dictionary module (`.ts` / `.js` / `.mjs`). */
export async function loadLocaleModule(
  filePath: string,
  localeCode: string,
): Promise<Record<string, unknown>> {
  const { createJiti } = loadJiti();
  const jiti = createJiti(filePath, { interopDefault: true });
  const mod = (await jiti.import(filePath)) as Record<string, unknown>;
  const fromJiti = pickLocaleRoot(mod, localeCode);
  if (fromJiti) return fromJiti;

  const fileUrl = pathToFileURL(filePath).href;
  const native = (await import(fileUrl)) as Record<string, unknown>;
  const fromNative = pickLocaleRoot(native, localeCode);
  if (fromNative) return fromNative;

  throw new Error(
    `${filePath}: expected export default or export const ${localeCode}`,
  );
}
