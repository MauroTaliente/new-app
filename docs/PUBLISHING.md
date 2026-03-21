# Publishing to npm (`@maurotaliente/react-*`)

Packages live under the scope **`@maurotaliente`** with a **`react-`** name prefix (e.g. `@maurotaliente/react-networking`). Version **0.0.1** is aligned across packages in this repo.

## Prerequisites

1. **npm account** — you must be logged in as a user who is allowed to publish to `@maurotaliente` (e.g. [npmjs.com/~maurotaliente](https://www.npmjs.com/~maurotaliente)).
2. **2FA** — enable on the npm account (recommended before publishing).
3. **Build** — from the repository root:

   ```bash
   pnpm install
   pnpm run build:packages
   pnpm test
   ```

## Publish all workspace packages

From the repository root:

```bash
pnpm login
pnpm publish -r --filter './packages/*' --no-git-checks
```

- Omit `--no-git-checks` if you want npm to verify a clean git tree.
- `workspace:*` dependencies are rewritten to the published semver when using `pnpm publish`.

Publish **in dependency order** is handled by pnpm when using `-r`; if a single package fails, fix it and retry.

## Publish one package

```bash
cd packages/helpers
pnpm publish --access public
```

(Each package already has `"publishConfig": { "access": "public" }`.)

## Codegen CLIs

Published **bin** names (see each package’s `package.json`):

| Command | Package |
|---------|---------|
| `react-generate` | `@maurotaliente/react-generate` (styles + APIs) |
| `react-styles-generate` | `@maurotaliente/react-styles` |
| `react-networking-generate` | `@maurotaliente/react-networking` |

In apps, prefer `pnpm exec react-generate` or `npx react-generate` so the local `node_modules/.bin` is used.

## After renaming (`@lib/*` → `@maurotaliente/react-*`)

Consumers must update `package.json` dependencies and all import paths. See [CHANGELOG.md](../CHANGELOG.md).
