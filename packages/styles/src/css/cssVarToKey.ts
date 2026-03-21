/**
 * Maps a CSS custom property name to a camelCase JS key, e.g. `--color-bg-100` → `colorBg100`.
 */
export function cssVarToKey(prop: string): string {
  const raw = prop.startsWith('--') ? prop.slice(2) : prop;
  const parts = raw.split('-').filter(Boolean);
  if (parts.length === 0) return raw;
  return (
    parts[0] +
    parts
      .slice(1)
      .map((p) => (p.length ? p.charAt(0).toUpperCase() + p.slice(1) : p))
      .join('')
  );
}
