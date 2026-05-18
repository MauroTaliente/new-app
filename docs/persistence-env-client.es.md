# Variables de entorno de persistencia — llegar al cliente (browser)

Los runtimes generados (`i18n.runtime.generated.tsx`, `theme.runtime.generated.ts`) pueden leer una variable de entorno **opcional** para sobreescribir `persistenceMode` del `react33.config.json` (`cookie` vs `localStorage`).

Defaults del codegen:

| Sección | Clave por defecto |
|---------|-------------------|
| `react33I18n` | `REACT33_I18N_PERSISTENCE` |
| `react33Theme` | `REACT33_THEME_PERSISTENCE` |

**Importante:** poner `REACT33_*=cookie` en `.env` **no alcanza**. El bundler tiene que **exponer** ese nombre al código del cliente (`import.meta.env` / `process.env` inlined). Si no, `readClientEnv()` no ve el valor y la app sigue con `persistenceMode` del JSON — parece que “el .env no hace nada”.

Desactivar override por env: `"persistenceEnvKey": ""` en `react33I18n` / `react33Theme`.

---

## Vite

### Qué hace Vite

Por defecto solo las variables que empiezan con **`VITE_`** se copian a **`import.meta.env`** en el bundle del **browser**.

`REACT33_*` **no** entra salvo que amplies los prefijos.

### Configuración (necesaria para las claves `REACT33_*` por defecto)

1. **`vite.config.ts`**

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  envPrefix: ['VITE_', 'REACT33_'],
  // ...
});
```

2. **`.env`** (raíz del proyecto, junto a `vite.config.ts`)

```env
REACT33_THEME_PERSISTENCE=cookie
REACT33_I18N_PERSISTENCE=cookie
```

3. **Reiniciar** `vite` / `vite dev` tras cambiar `.env` o `envPrefix`.

4. **TypeScript (opcional):** `src/vite-env.d.ts`

```ts
interface ImportMetaEnv {
  readonly REACT33_THEME_PERSISTENCE?: 'localStorage' | 'cookie';
  readonly REACT33_I18N_PERSISTENCE?: 'localStorage' | 'cookie';
}
```

### Comprobar en el browser

Consola DevTools:

```js
import.meta.env.REACT33_THEME_PERSISTENCE
// → "cookie" | "localStorage" | undefined
```

Si es `undefined`, la variable **no** está expuesta — revisá `envPrefix` y `.env`, y reiniciá.

### Alternativa: solo `VITE_`

Sin `envPrefix: ['REACT33_']`, definí la clave en config:

```json
"react33Theme": {
  "persistenceEnvKey": "VITE_THEME_PERSISTENCE"
}
```

y usá solo `VITE_*` en `.env` (funciona con el default de Vite).

---

## Next.js

### Qué hace Next

Solo las variables con prefijo **`NEXT_PUBLIC_`** se inlined en bundles de **cliente**.

`REACT33_THEME_PERSISTENCE` en `.env` existe en **servidor** (`process.env`) pero **no** en Client Components hasta que renombres o overrides en config.

### Configuración (recomendada)

1. **`.env.local`**

```env
NEXT_PUBLIC_REACT33_THEME_PERSISTENCE=cookie
NEXT_PUBLIC_REACT33_I18N_PERSISTENCE=cookie
```

2. **`react33.config.json`**

```json
"react33Theme": {
  "persistenceMode": "cookie",
  "persistenceEnvKey": "NEXT_PUBLIC_REACT33_THEME_PERSISTENCE"
},
"react33I18n": {
  "persistenceEnvKey": "NEXT_PUBLIC_REACT33_I18N_PERSISTENCE"
}
```

3. **`pnpm generate`** para regenerar el runtime con la clave correcta.

4. **Reiniciar** `next dev` tras cambios de env.

### Sin override por env (lo más simple)

Solo `react33.config.json`:

```json
"react33Theme": { "persistenceMode": "cookie", "cookieName": "my-theme" }
```

o `"persistenceEnvKey": ""`.

---

## Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| Cambié `.env` y no cambia el modo | Variable no expuesta al cliente | Vite: `envPrefix` + restart. Next: `NEXT_PUBLIC_` + `persistenceEnvKey` + regenerate |
| `import.meta.env.REACT33_*` es `undefined` | Falta `REACT33_` en `envPrefix` | Añadir en `vite.config.ts`, reiniciar |
| Funciona en dev, no en prod | `.env` no en CI/host | Configurar env en el deploy y rebuild |

---

## Referencia (demo)

[`apps/demo/vite.config.ts`](../apps/demo/vite.config.ts), [`apps/demo/.env.example`](../apps/demo/.env.example), [`apps/demo/src/vite-env.d.ts`](../apps/demo/src/vite-env.d.ts).

Más detalle en inglés: [persistence-env-client.en.md](./persistence-env-client.en.md).
