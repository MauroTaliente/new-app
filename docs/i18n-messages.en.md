# i18n: messages, `formatMessage`, and typing

The `@maurotaliente/react-i18n` package provides **plain-string** ICU formatting via **`formatMessage(locale, pattern, values?)`**, and **rich** interpolation via **`ct`**. Locale resolution (`getLocale`, browser helpers, Next adapters) stays separate—this page is about **message shape** and **TypeScript**.

## When to use what

| API | Use case |
|-----|----------|
| **`formatMessage`** | Plain strings, attributes, `document.title`, logs, passing a resolved string to a child that should not receive React nodes. |
| **`ct`** | UI strings that may include React elements (bold, links) in the pattern. |

Both accept **ICU MessageFormat** patterns (plurals, `select`, `{name}` placeholders). Values are **`MessageValues`** (`string | number | boolean | Date | null | undefined`).

## Namespaces and modules

There is no runtime “namespace” object required by the library. Common patterns:

- **One file per locale** — e.g. `en.ts`, `es.ts` exporting a dictionary `Record<string, string>` (or nested objects merged at load time).
- **Feature-scoped maps** — export small objects per route or package and merge where the app composes dictionaries.

Lazy-loading: use **dynamic `import()`** for locale chunks if bundle size matters; the public API does not prescribe a loader.

## Typed message maps

Use **`defineMessages`** to mark a const object as your message source without changing runtime behavior:

```ts
import { defineMessages, formatMessage } from '@maurotaliente/react-i18n';

const labels = defineMessages({
  greeting: 'Hello, {name}!',
  count: 'You have {count, plural, one {# item} other {# items}}.',
});

const s = formatMessage('en', labels.greeting, { name: 'Ada' });
```

`defineMessages` is an identity function; it exists for **inference** and documentation. You can use **`as const`** alone on a smaller map if you prefer.

## Next.js and server components

Server-only loaders and `next.client` adapters live under **`@maurotaliente/react-i18n/next`** and **`@maurotaliente/react-i18n/next/server`** (see package README). Keep **dictionaries** serializable (strings only in `formatMessage` paths); **`ct`** is for client components where React nodes are allowed.
