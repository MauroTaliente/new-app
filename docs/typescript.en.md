# TypeScript: public entry points

Import **types** from the same package entry you use at runtime (`@maurotaliente/react-networking`, `@maurotaliente/react-persistence`, etc.). The tables below list the main symbols; see each package’s `src/index.ts` for the full surface.

## `@maurotaliente/react-networking`

| Area | Types (examples) | Notes |
|------|------------------|--------|
| HTTP request / response | `RequestProps`, `RequestReturn`, `Request`, `LoadRequestProps`, `HttpMethod` | `RequestProps<Params>` types `body` as `Params` for JSON payloads. |
| Client fetch hook | `DynamicOptions`, `DynamicModel`, `AsyncFetch`, `Action`, `Setter`, `ResponseOrData`, `Context` | `useAsyncFetch` defaults are typed; override `action` / `setter` for real APIs. |
| Request cache | `RequestCacheOption`, `RequestCachePreset`, `RequestCache`, `createRequestCache`, `defaultRequestCache`, `buildRequestCacheKey` | Prefer `requestCache: 'global'` in apps; pass a `RequestCache` from `createRequestCache()` when you need a separate instance. |
| Registry / codegen | Types re-exported from `./types/api-registry` | Align with generated `apis.generated.ts` / client hooks. |

Server-only helpers (`request`, `createDataFlow`) and client hooks (`useAsyncFetch`) share these models so generated code and hand-written calls stay consistent.

## `@maurotaliente/react-persistence`

| Area | Types (examples) | Notes |
|------|------------------|--------|
| Storage factory | `StorageDriverOptions` | Passed to `createStorageApi`. |
| Cookies (browser) | `CookieWriteOptions`, `CookieClientOptions` | Client cookie helpers. |
| Cookies (server / store) | `CookieStoreLike`, `ServerCookieOptions` | For `getCookieFromStore` / `setCookieInStore`. |
| Auth bridge | `AuthProfile` | Re-exported from `@maurotaliente/react-networking` for HTTP load props. |

Hooks (`useGetLocal`, …) infer keys from your storage API; options types document the configurable knobs.

## `@maurotaliente/react-i18n`

| Area | Types (examples) | Notes |
|------|------------------|--------|
| ICU / plurals | `formatMessage`, `MessageValues` | `intl-messageformat` under the hood. |

## `@maurotaliente/react-helpers`, `@maurotaliente/react-context`, `@maurotaliente/react-theme`, `@maurotaliente/react-styles`, `@maurotaliente/react-hooks`

Prefer **named imports** and rely on each package’s `package.json` `types` / `exports` field. If a symbol is not exported from the package root, treat it as internal unless documented in that package’s README.

## `Expand` and call signatures

Internal helpers such as `Expand` may use loose function checks in conditional types so **call signatures** on `Action` / `Setter` stay callable. That does not widen your application code’s types—only how the types are expanded for display and inference.
