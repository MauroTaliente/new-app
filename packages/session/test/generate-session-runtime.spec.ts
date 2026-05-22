import { describe, it, expect } from 'vitest';
import { readReact33SessionConfig } from '../src/read-react33-session-config.js';
import {
  emitSessionRuntimeAgnosticSource,
  emitSessionRuntimeClientSource,
  deriveSessionClientOutputPath,
} from '../src/generate-session-runtime.js';

/** A bearer `main` session bound to one API, plus optional extra sessions/apis. */
function configJson(opts?: { extraSessions?: object; extraApis?: object; primary?: string | null }) {
  const react33Session: Record<string, unknown> = {
    runtimeOutput: './src/api/session.runtime.generated.ts',
    sessions: {
      main: {
        strategy: 'bearer',
        runtimeModule: './main.session.runtime',
        bearer: {
          storageKey: 'app.session',
          storage: 'localStorage',
          headers: { Authorization: 'Bearer {token}' },
          proactiveRefresh: true,
        },
        retry: { statuses: { '401': 1 }, tokenExpiredCode: 'TOKEN_EXPIRED' },
      },
      ...opts?.extraSessions,
    },
  };
  if (opts?.primary !== null) react33Session.primarySession = opts?.primary ?? 'main';
  return {
    react33Session,
    react33Networking: {
      apis: { pokemon: { url: 'https://x.test', session: 'main' }, ...opts?.extraApis },
    },
  };
}

describe('readReact33SessionConfig', () => {
  it('returns null when react33Session is absent', () => {
    expect(readReact33SessionConfig({ react33Networking: {} })).toBeNull();
  });

  it('lifts the session name onto each definition and resolves bindings', () => {
    const cfg = readReact33SessionConfig(configJson())!;
    expect(cfg.sessions.map((s) => s.name)).toEqual(['main']);
    expect(cfg.bindings).toEqual({ pokemon: 'main' });
  });

  it('throws when primarySession names an undefined session', () => {
    expect(() => readReact33SessionConfig(configJson({ primary: 'ghost' }))).toThrow(/primarySession/);
  });

  it('throws when an API binds to an undefined session', () => {
    expect(() =>
      readReact33SessionConfig(configJson({ extraApis: { billing: { url: 'y', session: 'ghost' } } })),
    ).toThrow(/billing\.session "ghost"/);
  });

  it('throws when a bearer session lacks bearer.storageKey', () => {
    const raw = configJson();
    delete (raw.react33Session.sessions as Record<string, { bearer: { storageKey?: string } }>).main.bearer.storageKey;
    expect(() => readReact33SessionConfig(raw)).toThrow(/storageKey is required/);
  });

  it('rejects the not-yet-implemented cookie strategy', () => {
    const raw = configJson();
    (raw.react33Session.sessions as Record<string, { strategy: string }>).main.strategy = 'cookie';
    expect(() => readReact33SessionConfig(raw)).toThrow(/not implemented/);
  });
});

describe('emitSessionRuntimeAgnosticSource', () => {
  it('emits a server-safe module (no use client) with the bearer manager + apiRuntime', () => {
    const src = emitSessionRuntimeAgnosticSource(readReact33SessionConfig(configJson())!);
    expect(src).not.toContain("'use client'");
    expect(src).toContain('import * as mainSeam from "./main.session.runtime"');
    expect(src).toContain('export const mainSession = createBearerSessionManager({');
    expect(src).toContain('storageKey: "app.session"');
    expect(src).toContain('selectors: mainSeam.selectors');
    expect(src).toContain('const mainLoad = createBearerSessionLoad(mainSession');
    expect(src).toContain('export const apiRuntime: ApiRuntime = {');
    expect(src).toContain('loads: {');
    expect(src).toContain('pokemon: mainLoad,');
  });

  it('emits defaultsByApi via createBearerSessionRetry only for sessions with a retry block', () => {
    const src = emitSessionRuntimeAgnosticSource(readReact33SessionConfig(configJson())!);
    expect(src).toContain('defaultsByApi: {');
    expect(src).toContain(
      'pokemon: createBearerSessionRetry(mainSession, { statuses: {"401":1}, tokenExpiredCode: "TOKEN_EXPIRED" }),',
    );
  });

  it('wires an external session straight from its seam — no manager constructed', () => {
    const cfg = readReact33SessionConfig(
      configJson({
        extraSessions: { partner: { strategy: 'external', runtimeModule: './partner.session.runtime' } },
        extraApis: { billing: { url: 'https://b.test', session: 'partner' } },
      }),
    )!;
    const src = emitSessionRuntimeAgnosticSource(cfg);
    expect(src).toContain('const partnerLoad = partnerSeam.load;');
    expect(src).toContain('billing: partnerLoad,');
    // external session has no createBearerSessionManager call of its own
    expect(src).not.toContain('partnerSession = createBearerSessionManager');
  });
});

describe('emitSessionRuntimeClientSource', () => {
  it('emits the use-client React runtime for a bearer primary session', () => {
    const src = emitSessionRuntimeClientSource(readReact33SessionConfig(configJson())!)!;
    expect(src).toContain("'use client'");
    expect(src).toContain('import { mainSession } from "./session.runtime.generated"');
    expect(src).toContain('createSessionRuntime({');
    expect(src).toContain('session: mainSession,');
    expect(src).toContain('export const { SessionProvider, useSession, useSessionState }');
  });

  it('returns null when no primarySession is declared', () => {
    expect(emitSessionRuntimeClientSource(readReact33SessionConfig(configJson({ primary: null }))!)).toBeNull();
  });

  it('reads the React store off the seam when the primary session is external', () => {
    const cfg = readReact33SessionConfig(
      configJson({
        extraSessions: { ext: { strategy: 'external', runtimeModule: './ext.session.runtime' } },
        primary: 'ext',
      }),
    )!;
    const src = emitSessionRuntimeClientSource(cfg)!;
    expect(src).toContain('import * as extSeam from "./ext.session.runtime"');
    expect(src).toContain('session: extSeam.sessionStore,');
  });
});

describe('deriveSessionClientOutputPath', () => {
  it('inserts .client before .generated', () => {
    expect(deriveSessionClientOutputPath('./src/api/session.runtime.generated.ts')).toBe(
      './src/api/session.runtime.client.generated.ts',
    );
  });

  it('falls back to inserting .client before a bare extension', () => {
    expect(deriveSessionClientOutputPath('./src/api/session.runtime.ts')).toBe(
      './src/api/session.runtime.client.ts',
    );
  });
});
