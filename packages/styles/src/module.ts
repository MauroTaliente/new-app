import { type ClassValue } from 'clsx';
import { theme, defaultTheme } from './tokens';

// Types
type Expand<T> = T extends (...args: any) => any
  ? T : T extends object ? T extends infer O
  ? { [K in keyof O]: Expand<O[K]> }
  : never : T;

type IsPlainObject<T> =
  T extends any[] ? false
  : T extends (...args: any[]) => any ? false
  : T extends object ? true
  : false;

export type BuildLeaf = ClassValue | ClassValue[];

export type BuildRecord = { [key: string]: BuildStyles };

export type BuildStyles = BuildLeaf | BuildRecord;

export type ProcessedModel<T> = Expand<{
  [K in keyof T]:
    IsPlainObject<T[K]> extends true ? ProcessedModel<T[K]>
    : T[K] extends string[] ? T[K][number]
    : T[K] extends string ? T[K]
    : string;
}>;

export type ThemeName = (typeof theme)[number];

// Consts
export const DEFAULT_THEME = defaultTheme;
