import { type ReactNode, type JSX } from 'react';

export type Expand<T> = T extends (...args: any) => any
  ? T : T extends object ? T extends infer O
  ? { [K in keyof O]: Expand<O[K]> }
  : never : T;

type GetString<T> = T extends string ? T : string;

type ChangeKey<B, C, A> = `${GetString<B>}${GetString<C>}${GetString<A>}`;

export type KnownParamsContext = {
  name: string;
  initValues: any;
  reducer: (_: any, d: any) => any;
};

type Mutate<F> = F extends (_: any, n: infer B) => any ? (n: B) => void : never;

type MapProvider<T extends KnownParamsContext> = {
  [Key in T['name']as ChangeKey<'', Capitalize<Key>, 'Provider'>]: ({ children, value }: { children: ReactNode, value?: any }) => JSX.Element;
};
type MapState<T extends KnownParamsContext> = {
  [Key in T['name']as ChangeKey<'use', Capitalize<Key>, 'State'>]: () => T['initValues'];
};
type MapUpdater<T extends KnownParamsContext> = {
  [Key in T['name']as ChangeKey<'use', Capitalize<Key>, 'Updater'>]: () => Mutate<T['reducer']>;
};

type Mapper<T extends KnownParamsContext> = Expand<MapProvider<T> & MapState<T> & MapUpdater<T>>;

export type ReturnContext<T extends KnownParamsContext> = Mapper<T>;

export const capitalized = (s: string) => (s ? s[0]?.toUpperCase() + s.slice(1) : s);
