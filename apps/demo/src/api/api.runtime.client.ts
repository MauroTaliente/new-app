'use client';

/**
 * Single seam between codegen and app-level wiring (session/auth, base-URL overrides, retry).
 *
 * Configured via `react33.config.json → react33Networking.runtimeModule`. The generated
 * `apis.generated.ts` imports `apiRuntime` from here to compose `createApiRegistry`.
 *
 * `'use client'` boundary because this module re-exports `SessionProvider` / `useSession` /
 * `useSessionState` from `@react33/react-session/runtime`. Server route loaders that need only
 * `apis` / `definitions` should import from `./apis.generated` instead — that file stays
 * server-safe (no React).
 *
 * Pattern: one module owns session creation + the `ApiRuntime` export + the React runtime.
 * Nothing else changes across the generated layer when you swap session strategies, add a
 * 401 reaction, or override base URLs per environment.
 */
import type { ApiRuntime } from '@react33/react-networking';
import {
  createBearerSessionLoad,
  createBearerSessionManager,
} from '@react33/react-session';
import { createSessionRuntime } from '@react33/react-session/runtime';

/** Forma esperada de la response del endpoint de login/refresh. */
type Tokens = {
  access_token: string;
  refresh_token: string;
};

/**
 * Long-lived session manager. Real app: wire `refresh` to your SDK / fetch endpoint.
 * Exported so other modules (auth screens, logout button) can call `setSession` / `clearSession`.
 */
export const session = createBearerSessionManager<Tokens>({
  storageKey: 'demo.app.session',
  storage: 'localStorage', // habilita cross-tab sync
  selectors: {
    selectAccessToken: (t) => t.access_token,
    selectRefreshToken: (t) => t.refresh_token,
  },
  refresh: async (refreshToken) => {
    // Stub: reemplazá por la llamada real al endpoint de refresh.
    void refreshToken;
    return null;
  },
});

/**
 * `ApiRuntime` contract — exactly the three things codegen needs to wire the registry:
 *   - `defineDefinitions`: identity (or runtime base-URL override per env).
 *   - `load`: session bridge — proactive refresh + Bearer header injection.
 *   - `defaults`: registry-wide retry + reactive refresh on 401.
 */
export const apiRuntime: ApiRuntime = {
  defineDefinitions: (base) => base,
  load: createBearerSessionLoad(session),
  defaults: {
    retries: { 401: 1 },
    onRetry: async ({ status, response }) => {
      if (status !== 401) return;
      // Ejemplo de body-based branching: backend distingue refresh-eligible vs revocado.
      const code =
        response?.data && typeof response.data === 'object'
          ? (response.data as { code?: string }).code
          : undefined;
      if (code === 'TOKEN_EXPIRED' || code === undefined) {
        await session.ensureFreshSession();
      }
    },
  },
};

/**
 * UI-reactive layer over the same `session` instance — Provider + hooks parallel to
 * `useTheme`/`useI18n`. Apps that don't need React reactivity can ignore this export and
 * keep the subpath out of their bundle.
 *
 * Typed JWT claims at the call site:
 *   const [{ accessPayload }] = useSession<{ sub: string; roles: string[] }>();
 */
export const { SessionProvider, useSession, useSessionState } = createSessionRuntime({
  session,
});
