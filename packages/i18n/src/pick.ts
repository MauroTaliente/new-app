import type { PickSegment } from './types.js';

/**
 * Returns one scope object or a shallow merge of several scopes from a loaded locale structure.
 */
export function pickScope<
  Structure extends Record<string, unknown>,
  T extends keyof Structure | readonly (keyof Structure)[],
>(structure: Structure, scope: T): PickSegment<Structure, T> {
  if (Array.isArray(scope)) {
    return scope.reduce((acc, cur) => {
      const chunk = structure[cur as keyof Structure];
      const obj = typeof chunk === 'object' && chunk !== null && !Array.isArray(chunk) ? chunk : {};
      return { ...acc, ...obj };
    }, {} as Record<string, unknown>) as PickSegment<Structure, T>;
  }
  return structure[scope as keyof Structure] as PickSegment<Structure, T>;
}
