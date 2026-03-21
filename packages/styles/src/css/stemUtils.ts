/**
 * `design-tokens` → `designTokens` for valid JS object keys in generated code.
 */
export function stemToCamelCase(stem: string): string {
  if (!stem.includes('-')) return stem;
  return stem.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}
