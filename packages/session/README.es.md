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

## Codegen — la colección `react33Session` (recomendado)

`react33Session` en `react33.config.json` es una **colección** de sesiones nombradas — una
sola app puede sostener varias, cada una autenticando distintas APIs con su propio token.
`react-session-generate` la convierte en dos módulos; vos solo escribís a mano el **seam**
no-serializable de cada sesión.

```json
{
  "react33Session": {
    "runtimeOutput": "./src/api/session.runtime.generated.ts",
    "primarySession": "main",
    "sessions": {
      "main":    { "strategy": "bearer",   "runtimeModule": "./main.session.runtime",
                   "bearer": { "storageKey": "app.session", "storage": "localStorage" },
                   "retry":  { "statuses": { "401": 1 }, "tokenExpiredCode": "TOKEN_EXPIRED" } },
      "partner": { "strategy": "external", "runtimeModule": "./partner.session.runtime" }
    }
  },
  "react33Networking": {
    "registryOutput": "./src/api/apis.generated.ts",
    "runtimeModule": "./session.runtime.generated",
    "apis": {
      "billing": { "url": "https://billing.example.com", "session": "main" },
      "reports": { "url": "https://reports.example.com",  "session": "partner" }
    }
  }
}
```

**`apis.<name>.session`** es la foreign key — liga una API a una sesión por nombre. Una API
sin `session` no recibe auth. Varias APIs pueden compartir una misma sesión.

### Los dos archivos generados (el split server/client)

| Archivo | ¿`'use client'`? | Contiene | Lo importa |
|---|---|---|---|
| `session.runtime.generated.ts` | no — server-safe | los managers de sesión + `apiRuntime` (`loads`, `defaultsByApi`) | `apis.generated.ts` (`react33Networking.runtimeModule` → acá) |
| `session.runtime.client.generated.ts` | sí | `SessionProvider` + `useSession`/`useSessionState` de `primarySession` | tu árbol React |

Una sola key `runtimeOutput` nombra el archivo agnóstico; el path `.client` se **deriva**. El
split mantiene la frontera de React fuera del seam server-safe de networking.

### El seam — `bearer`, `bearer-static`, `external`

El `runtimeModule` de cada sesión es un archivo escrito a mano. Lo que tiene que exportar
depende de `strategy`:

- **`bearer`** — `selectors: BearerSessionSelectors<Tokens>` + `refresh`. El codegen arma el
  cableado `createBearerSessionManager` + `createBearerSessionLoad`. Access en memoria, refresh
  token persistido, `ensureFreshSession()` disponible.
- **`bearer-static`** — `selectors: BearerStaticSessionSelectors<Tokens>` (solo `selectAccessToken`)
  — **sin `refresh`**. Un access token managed sin flujo de refresh: react33 sostiene y decodifica
  el token y expone el snapshot + `load`, pero un 401 es terminal (re-autenticás a nivel app).
  Se para entre `bearer` y `external` — tenés el decode de JWT + snapshot reactivo gratis sin ser
  dueño de un refresh token. El bloque opcional `bearerStatic` elige dónde vive el token (`memory`
  por default, o `sessionStorage`/`localStorage`).

  ```ts
  // kiosk.session.runtime.ts — strategy: "bearer-static"
  import type { BearerStaticSessionSelectors } from '@react33/react-session';
  export type KioskTokens = { access_token: string };
  export const selectors: BearerStaticSessionSelectors<KioskTokens> = {
    selectAccessToken: (t) => t.access_token,
  };
  ```
- **`external`** — `load: LoadRequestProps` (siempre) y `sessionStore?: SessionStore` (solo
  cuando esta sesión es la `primarySession`). El codegen cablea el `load` directo en
  `apiRuntime.loads` y **no** construye ningún manager de react33. Es el escape hatch para
  auth de terceros — Firebase, Auth0, Supabase, NextAuth, un endpoint de token-exchange:

  ```ts
  // partner.session.runtime.ts — strategy: "external"
  import { mergeRequestProps, type LoadRequestProps } from '@react33/react-networking';
  export const load: LoadRequestProps = async (shared) =>
    mergeRequestProps(shared, {
      headers: { Authorization: `Bearer ${await getAuth().currentUser?.getIdToken()}` },
    });
  ```

  react33 nunca autentica — **cablea auth dentro de networking**. Con `external`, el manager,
  el storage y el refresh single-flight quedan sin uso; el SDK de terceros es dueño de ese
  ciclo de vida.

### Retry por-API — `defaultsByApi`

El bloque opcional `retry` de una sesión se emite **por-API** dentro de `apiRuntime.defaultsByApi`
vía `createBearerSessionRetry`, de modo que un 401 de una API refresca solo el token de **esa**
sesión. Con `tokenExpiredCode` seteado, un 401 cuyo código de body difiere (o está ausente) es
terminal — no refresca. Orden de codegen: `react-session-generate` corre antes que
`react-networking-generate`.

## Wiring a mano (sin codegen)

Preferí el codegen de `react33Session` de arriba. Los dos paths siguientes son para apps que
componen el runtime module o el registry a mano — los mismos primitivos, cableados manualmente.

### Path A — runtime module a mano

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

### Por qué `proactiveRefresh` + `onRetry` reactivo es seguro de combinar

Ambos hooks llaman a `session.ensureFreshSession()`, así que una lectura ingenua sugiere un doble refresh por request cuando el access token está vencido. No lo es: el manager corre **single-flight** — los callers concurrentes de `ensureFreshSession()` (el pre-flight proactivo, el `onRetry` reactivo tras un 401, incluso requests paralelos en la misma pestaña) comparten la **misma promesa en vuelo**. Solo corre un refresh de red; todos los demás esperan su resultado.

Esto es lo que hace robusta a la combinación recomendada sin coordinación a nivel de la app:

- **Proactivo (`createBearerSessionLoad` con `proactiveRefresh: true`)** maneja el caso *común* — tu access token está vencido antes de que el request salga de la pestaña. El refresh se paga una vez, fuera del camino crítico del reintento.
- **Reactivo (`onRetry` en 401)** maneja la *race* — el token era válido cuando el request salió pero fue revocado o venció entre el envío y la respuesta. El single-flight garantiza que la promesa del camino proactivo (si se inició alguna en paralelo) se reutiliza.

Si querés puro reactivo (sin chequeo pre-flight, refresh solo en 401), pasá `proactiveRefresh: false` a `createBearerSessionLoad` — ver "Headers custom" más abajo.

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

## Reactividad de UI con `createSessionRuntime`

El manager core es framework-agnostic — sin React, sin observables — pero expone un par
chiquito `subscribe(listener)` + `getSnapshot()` (los mismos primitivos que necesita
`useSyncExternalStore`). El **subpath** opcional `@react33/react-session/runtime` arma
encima un trío tipado de `SessionProvider` + `useSession` / `useSessionState`, en paralelo
a `createThemeRuntime` de `@react33/react-theme`.

Cableálo en tu runtime module, al lado del manager:

```ts
// src/api/api.runtime.ts
import {
  createBearerSessionManager,
  createBearerSessionLoad,
} from '@react33/react-session';
import { createSessionRuntime } from '@react33/react-session/runtime';
import type { ApiRuntime } from '@react33/react-networking';

export const session = createBearerSessionManager<MyTokens>({ /* ... */ });

export const apiRuntime: ApiRuntime = {
  defineDefinitions: (base) => base,
  load: createBearerSessionLoad(session),
  defaults: { /* ... */ },
};

// Capa de UI — misma referencia `session`, ahora observable.
export const { SessionProvider, useSession, useSessionState } =
  createSessionRuntime({ session });
```

Montá el Provider una vez cerca de la raíz:

```tsx
// src/app/Providers.tsx
'use client';
import { SessionProvider } from '@/api/api.runtime';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

Leé el snapshot en cualquier lado debajo:

```tsx
'use client';
import { useSession } from '@/api/api.runtime';

export function Header() {
  const [{ hasAccess, accessPayload }, session] = useSession();
  return hasAccess
    ? <button onClick={session.clearSession}>Logout {accessPayload?.sub}</button>
    : <a href="/login">Sign in</a>;
}
```

**Qué es reactivo** — `hasAccess`, `hasRefresh`, `accessPayload` re-renderizan en login,
logout, clear cross-tab y al completarse un refresh. El snapshot es estable por referencia
cuando nada cambia (el manager lo memoiza), así que `useSyncExternalStore` no tiene tearing
ni re-renderiza de más.

**¿Por qué un Provider si el manager es global?** Ancla la testeabilidad (montás un manager
falso vía Provider en tests), expone errores tipados cuando los consumidores se olvidan de
envolver el árbol, y mantiene la API en paralelo a `useTheme`/`useI18n` — la memoria se
transfiere entre paquetes.

**Payload tipado** — ambos hooks aceptan un genérico de payload JWT en el call site, igual
que lo hace `manager.decodeAccessPayload<T>()`:

```tsx
type MyClaims = { sub: string; roles: string[] };
const [{ accessPayload }] = useSession<MyClaims>();
accessPayload?.roles; // tipado
```

El subpath solo se carga cuando lo importás — las apps que usan solo el manager + bridge
quedan React-free.

## Estrategias lado a lado — dónde vive cada dato

Una pregunta recurrente al leer este README: *"¿por qué Bearer sostiene un `accessPayload`
ahí mismo en el snapshot, pero las sesiones cookie-only necesitan pegarle a `/me`?"* El
split es estrategia-por-estrategia, no framework-por-framework. El runtime que tienen
adelante es el mismo — lo que cambia es **dónde vive el dato autoritativo** y **qué trabajo
está dispuesta a hacer la estrategia en el navegador**.

### Matriz de storage

| Aspecto | Bearer (hoy) | Cookie + `/me` (planeado) | Session id opaco (planeado) |
|---|---|---|---|
| **Credencial de auth** | Refresh token en `sessionStorage` (default) o `localStorage` | Cookie HttpOnly, propiedad del navegador — JS no la puede leer ni escribir | Un solo token opaco en storage **o** cookie |
| **Chequeo de vencimiento del access** | JWT `exp` decodificado localmente → refresh proactivo posible | Desconocido para el cliente — estrictamente **reactivo** (401 → bootstrap) | Desconocido para el cliente — estrictamente reactivo |
| **Datos de usuario (nombre, roles, …)** | **Decodificados del access JWT** (`accessPayload.sub`, `.roles`, …) — cero lecturas de red | **Traídos de `/me`**, opcionalmente cacheados en `localStorage` para UX | **Traídos de `/me`** también |
| **Flujo de login** | `POST /login` → el server devuelve `{ access, refresh }` → `setSession(tokens)` | `POST /login` (credentials: include) → el server setea la cookie → la app llama `bootstrap()` para hidratar identidad desde `/me` | Igual que cookie, o token devuelto en el body |
| **Refresh** | Orquestado por el cliente: `ensureFreshSession()` llama tu SDK de `refresh` | Orquestado por el server (rotación de cookie). El cliente es puramente reactivo | Igual que cookie |
| **Logout** | `clearSession()` limpia memoria + storage | `POST /logout` (el server invalida la cookie) → `clear()` resetea el cache local | `POST /logout` → `clear()` |
| **Bridge (`load`)** | `createBearerSessionLoad(session)` → inyecta el header `Authorization: Bearer {token}` (soporta templates) | `createCookieSessionLoad(session)` → setea `credentials: 'include'`, sin inyección de header | Setea el header `Authorization` **o** `credentials: 'include'`, según el transporte |
| **Forma del snapshot** (leído vía `useSession`) | `{ hasAccess, hasRefresh, accessPayload }` | `{ isAuthenticated, identity }` | `{ isAuthenticated, identity }` |

`sessionStorage` y `localStorage` no desaparecen con las estrategias cookie-only — solo
cumplen otro rol: para Bearer sostienen el refresh token (la credencial), para
cookie/opaco son un **cache de UX opcional** del último perfil de `/me` para que la UI no
parpadee un skeleton en cada navegación. El server sigue siendo la fuente de verdad de
cualquier manera; el cache es solo una pista.

### Qué es exclusivo de cada estrategia — y por qué nada de eso está en el runtime

Tres cosas que solo Bearer puede hacer, todas porque dependen de sostener un JWT en memoria:

- **Chequeo de skew** (`isAccessTokenExpired(skewSec)`). "El token vence en 30s, refrescá
  ahora" solo es posible cuando el cliente ve el claim `exp`. Las sesiones cookie-only no
  pueden — la cookie es HttpOnly, el navegador es dueño de su tiempo de vida. El refresh
  proactivo es una feature de Bearer; las sesiones cookie refrescan reactivamente
  (401 → bootstrap).
- **Decode de claims sin red**. Leer `accessPayload.roles` es una llamada de decode en
  Bearer, un round-trip a `/me` en cookie/opaco.
- **`createBearerSessionLoad`**. Setea el header `Authorization: Bearer {token}`. Las
  estrategias cookie necesitan su propio bridge que en cambio prende `credentials: 'include'`.

Nada de esto está cableado en `createSessionRuntime`. Todo vive en
`createBearerSessionManager` y `createBearerSessionLoad`. El runtime solo lee `subscribe`
+ `getSnapshot` de cualquier `SessionStore<TSnapshot>` — ese es todo el contrato. Cuando
llegue cookie-session, la forma de su snapshot es decisión suya; el runtime la infiere por
genéricos y `useSession()` lleva la tupla correcta al call site.

### Qué le pasa a tu código de UI el día que llegue cookie-session

Un componente que lee la sesión hoy:

```tsx
const [{ hasAccess, accessPayload }] = useSession<MyJwtClaims>();
hasAccess && <span>Hello {accessPayload?.name}</span>;
```

El mismo componente con cookie-session:

```tsx
const [{ isAuthenticated, identity }] = useSession<MyProfile>();
isAuthenticated && <span>Hello {identity?.name}</span>;
```

Mismo import path (`useSession` desde tu `api.runtime.ts`), mismo hook, mismo Provider.
Solo cambian los nombres de los campos del snapshot porque reflejan la cosmovisión de la
estrategia. Esa es la postergación que nos podemos permitir porque el runtime tiene la
forma de `SessionStore`, no de `BearerSessionManager`.

### Dónde vive el round-trip a `/me` en la estrategia cookie (preview)

Para Bearer, la llamada de red es el **refresh** (`ensureFreshSession`). Para cookie/opaco,
es un **bootstrap** que hidrata la identidad:

```ts
// Sketch — todavía no shippeado.
const session = createCookieSessionManager({
  meEndpoint: '/me',
  selectors: { selectIdentity: (res) => res.user },
  cache: { storage: 'localStorage', key: 'app.profile' }, // cache de UX opcional
});

// Al arrancar la app, después del UI de login, o en un evento de login cross-tab:
await session.bootstrap();  // GET /me; en 200 -> emit; en 401 -> queda anónimo

// En tu apiRuntime:
defaults: {
  retries: { 401: 1 },
  onRetry: async ({ status }) => {
    if (status === 401) await session.bootstrap();
  },
}
```

Notá cómo `defaults.retries` + `onRetry` es idéntico entre Bearer y cookie — la estrategia
decide qué hace `ensureFreshSession` vs `bootstrap`, pero la política de retry a nivel del
registry se ve igual. Esa es la parte del diseño que hace que "cambiar de estrategia" sea
un cambio de un solo archivo en `api.runtime.ts`, no un refactor transversal.

## Sincronización cross-tab (solo `localStorage`)

Con `storage: 'localStorage'`, el manager se suscribe a eventos `storage` para la key del refresh. Si **otra pestaña** borra o actualiza esa key, esta pestaña invalida el access + payload decodificado en memoria y actualiza su referencia al refresh. El próximo request que dispara `ensureFreshSession()` usa el refresh nuevo (o no hace nada si la key fue limpiada).

Con `storage: 'sessionStorage'` (default), esto es no-op por diseño del navegador: `sessionStorage` es per-tab.

### Lock de refresh cross-tab (refresh tokens rotativos)

`ensureFreshSession()` corre el refresh bajo un **lock cross-tab** (la [Web Locks API](https://developer.mozilla.org/docs/Web/API/Web_Locks_API)) — la contraparte cross-tab del guard single-flight in-tab. El nombre del lock se scope-a a `storageKey`, así sesiones distintas nunca se bloquean entre sí.

Esto importa cuando el backend emite **refresh tokens rotativos de un solo uso** (OAuth 2.0 BCP): sin el lock, dos pestañas cuyos access tokens expiran juntos refrescan ambas con el *mismo* token — una gana, el request de la otra es rechazado y limpia la sesión, y ese borrado de storage propaga el logout de vuelta a la pestaña ganadora. Con el lock, solo una pestaña refresca a la vez; cada pestaña que espera **re-lee el refresh token desde storage**, así gasta el token recién rotado en vez del viejo. Sin logout espurio, sin cascada.

Cuando `navigator.locks` no está disponible (navegadores viejos, SSR), degrada con gracia al guard in-tab.

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
- **Sin React en el entry default** — el manager + bridge son framework-agnostic. El pegamento de React vive detrás del subpath `./runtime` (`@react33/react-session/runtime`), opt-in.

Estrategias futuras consideradas (roadmap):

- **HttpOnly cookie session** — sin token JS-readable; depende de endpoints de cookie del backend. El bridge no inyecta header; depende de `credentials: 'include'`.
- **Session id opaco** — un solo token, estado en servidor, sin decode de JWT.
- ~~**`SessionProvider` de React**~~ — shippeado: ver `createSessionRuntime` más arriba (`@react33/react-session/runtime`).

## Fuera de alcance por diseño

- **Interceptors de response / reacción a 401 más allá de `onRetry`** — usar `onRetry` de `@react33/react-networking` al nivel de la app.
- **Una interface `SessionManager` compartida** — abstracción prematura; va a emerger cuando coexistan varias estrategias.
