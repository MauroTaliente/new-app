# @react33/react-session

Estrategias de **sesión** para apps en el navegador — sin acoplarse a un contrato de API.

## v0: Bearer + refresh

`createBearerSessionManager`:

- Access en **memoria**
- Refresh en `@react33/react-persistence`
- `ensureFreshSession()` con **single-flight**
- JWT en `@react33/react-helpers`

El transporte (`refresh`) lo define la app. Sin React obligatorio.

```ts
import { createBearerSessionManager } from '@react33/react-session';

export const session = createBearerSessionManager({
  storageKey: 'app.session',
  selectors: {
    selectAccessToken: (t) => t.access_token,
    selectRefreshToken: (t) => t.refresh_token,
  },
  refresh: async (refreshToken) => {
    const res = await mySdk.refresh({ refresh_token: refreshToken });
    return res.ok ? res.data : null;
  },
});
```

## Wiring — dos paths

### Path A — codegen vía `react33.config.json` (recomendado)

Si tu app maneja el registry desde `react33.config.json` (`react33Networking.apis`), exponé un **runtime module** que sea dueño de la creación de session + el export `ApiRuntime`. El generador wire-a el resto.

`react33.config.json`:

```json
{
  "react33Networking": {
    "registryOutput": "./src/api/apis.generated.ts",
    "runtimeModule": "./api.runtime",
    "apis": { "main": { "url": "https://api.example.com" } }
  }
}
```

`src/api/api.runtime.ts`:

```ts
import type { ApiRuntime } from '@react33/react-networking';
import {
  createBearerSessionManager,
  createBearerSessionLoad,
} from '@react33/react-session';

export const session = createBearerSessionManager<MyTokens>({
  storageKey: 'app.session',
  storage: 'localStorage',
  selectors: {
    selectAccessToken: (t) => t.access_token,
    selectRefreshToken: (t) => t.refresh_token,
  },
  refresh: async (rt) =>
    (await mySdk.refresh({ refresh_token: rt })).data ?? null,
});

export const apiRuntime: ApiRuntime = {
  defineDefinitions: (base) => base, // o overrides de base URL por env
  load: createBearerSessionLoad(session),
  defaults: {
    retries: { 401: 1 },
    onRetry: async ({ status }) => {
      if (status === 401) await session.ensureFreshSession();
    },
  },
};
```

El `apis.generated.ts` generado levanta `apiRuntime` y wire-a `createApiRegistry` automáticamente. **Nada más cambia** cuando cambiás de estrategia, sumás una reacción a 401, o cambiás base URLs por env — solo editás `api.runtime.ts`.

### Path B — `createApiRegistry` a mano

Si componés el registry a mano (sin codegen):

```ts
import { createApiRegistry } from '@react33/react-networking';
import {
  createBearerSessionManager,
  createBearerSessionLoad,
} from '@react33/react-session';
import { definitions } from './apis.generated';

export const session = createBearerSessionManager<MyTokens>({ /* ... */ });

export const apis = createApiRegistry(definitions, {
  load: createBearerSessionLoad(session),
  defaults: {
    retries: { 401: 1 },
    onRetry: async ({ status }) => {
      if (status === 401) await session.ensureFreshSession();
    },
  },
});
```

Mismo comportamiento; elegí el path que coincida con tu setup de codegen.

El `load` se re-ejecuta **antes de cada reintento** (ver `@react33/react-networking`), así que el access token refrescado llega automáticamente al request reintentado.

El callback `onRetry` recibe el contexto completo del reintento, incluyendo la response que falló:

```ts
onRetry: async ({ status, response, attempt }) => {
  if (status === 401 && response?.data?.code === 'TOKEN_EXPIRED') {
    await session.ensureFreshSession();
  }
  if (status === 429) {
    const after = response?.headers?.get('Retry-After');
    // ... backoff custom usando `after` ...
  }
},
```

### Headers custom

Sobrescribí `headers` para esquemas distintos a bearer:

```ts
createBearerSessionLoad(session, {
  headers: { 'X-Api-Key': '{token}' },
});
```

Pasá `proactiveRefresh: false` para desactivar el chequeo previo (ej. si querés que el refresh corra solo en `onRetry`):

```ts
createBearerSessionLoad(session, { proactiveRefresh: false });
```

## Elección de `storage` — trade-off de seguridad

La opción `storage` (`'sessionStorage'` por default, `'localStorage'` opt-in) controla dónde se persiste el **refresh token**. El access token siempre vive en memoria.

| Storage | Duración | Cross-tab | Exposición a XSS |
|---|---|---|---|
| `sessionStorage` (default) | Hasta cerrar la pestaña | ❌ per-tab | Scripts same-origin en la pestaña pueden leer |
| `localStorage` | Hasta que se limpie | ✅ compartido | Scripts same-origin en CUALQUIER pestaña pueden leer; persiste entre cierres |

**Ambos son JS-readable** por scripts same-origin, así que un XSS que inyecte script en tu origen puede exfiltrar el refresh token sin importar la elección. Las diferencias:

- `sessionStorage` acota la **ventana temporal** de exposición (se cierra al cerrar la pestaña) y **no** persiste entre sesiones ni se comparte entre pestañas.
- `localStorage` habilita UX cross-tab (login en una pestaña actualiza todas) pero el token sobrevive hasta `clearSession()` o limpieza manual del usuario.

Para reducir al máximo la exposición a XSS, usar una estrategia de **cookie HttpOnly** en el backend (en roadmap). El default actual (`sessionStorage`) es un middle ground pragmático para SPAs.

## Sincronización cross-tab (solo `localStorage`)

Con `storage: 'localStorage'`, el manager se suscribe a eventos `storage` para la key del refresh. Si **otra pestaña** borra o actualiza esa key, esta pestaña invalida el access + payload decodificado en memoria y actualiza su referencia al refresh. El próximo request que dispara `ensureFreshSession()` usa el refresh nuevo (o no hace nada si la key fue limpiada).

Con `storage: 'sessionStorage'` (default), esto es no-op por diseño del navegador: `sessionStorage` es per-tab.

## Ciclo de vida: `dispose()`

El manager devuelve un método `dispose()` que desconecta el suscriptor cross-tab. Managers de larga vida (uno por app) lo pueden ignorar. Tests, componentes transitorios, o código que reemplaza la instancia del manager deberían llamarlo.

```ts
const session = createBearerSessionManager(/* ... */);
// ... más adelante, en el teardown:
session.dispose();
```

## Agregar nuevas estrategias de sesión

Cada estrategia vive como un **par** de archivos en `src/`:

```
src/
├── <strategy>-session.ts        # create<Strategy>SessionManager(options)
├── <strategy>-session-load.ts   # create<Strategy>SessionLoad(manager, options?)
```

Convenciones:

- **Manager factory**: `create<Strategy>SessionManager(options)` — opciones específicas, devuelve el manager (objeto plano de funciones).
- **Bridge factory**: `create<Strategy>SessionLoad(manager, options?)` — devuelve un `LoadRequestProps` de `@react33/react-networking`.
- **Cada estrategia es self-contained** — sin interface `SessionManager` compartido forzado. Cuando 2-3 estrategias expongan la misma operación, factorizar el shape común; hasta entonces, no anticipar.
- **Tests al lado**: `test/<strategy>-session.spec.ts` + `test/<strategy>-session-load.spec.ts`.
- **Sin React en el core** — paquetes de provider/context viven al lado como factories separadas o en un paquete React hermano.

Estrategias futuras consideradas (roadmap):

- **HttpOnly cookie session** — sin token JS-readable; depende de endpoints de cookie del backend. El bridge no inyecta header; depende de `credentials: 'include'`.
- **Session id opaco** — un solo token, estado en servidor, sin decode de JWT.
- **`SessionProvider` de React** — capa opcional de reactividad UI, sin dependencia desde el core.

## Fuera de alcance por diseño

- **Interceptors de response / reacción a 401 más allá de `onRetry`** — usar `onRetry` de `@react33/react-networking` al nivel de la app.
- **Una interface `SessionManager` compartida** — abstracción prematura; va a emerger cuando coexistan varias estrategias.
