/** `listTrips` → `ListTrips`, `pokemon_list` → `PokemonList` */
export function operationIdToPascal(operationId: string): string {
  return operationId
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/** `admin` → `Admin` for `useAdminRequest` */
export function scopeToPascal(scope: string): string {
  return scope.charAt(0).toUpperCase() + scope.slice(1);
}

/** `PaginatedTrips` → `emptyPaginatedTrips` */
export function schemaNameToEmptyConstant(schemaName: string): string {
  return `empty${schemaName}`;
}

export function refNameFromRef(ref: string): string | null {
  const m = ref.match(/#\/components\/schemas\/([^/]+)$/);
  return m?.[1] ?? null;
}
