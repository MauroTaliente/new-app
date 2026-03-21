/** Collapse a union into an intersection (for merged scope segments). */
export type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

/** Pick one or merged scopes from a single-locale structure (root object of one language). */
export type PickSegment<
  Structure extends Record<string, unknown>,
  T extends keyof Structure | readonly (keyof Structure)[],
> = T extends keyof Structure
  ? Structure[T]
  : T extends readonly (keyof Structure)[]
    ? UnionToIntersection<Structure[T[number]]>
    : never;
