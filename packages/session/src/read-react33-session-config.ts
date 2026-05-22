/**
 * Parser for the `react33Session` collection block of `react33.config.json`, plus the
 * `react33Networking.apis.<name>.session` foreign keys that bind each API to a session.
 *
 * Pure: takes already-parsed JSON, returns a normalized, validated model — no filesystem.
 * Cross-reference checks AJV cannot express (a binding pointing at an undefined session,
 * `primarySession` pointing nowhere) are enforced here with explicit errors.
 */

export type SessionStrategy = 'bearer' | 'cookie' | 'opaque' | 'external';

export type SessionBearerConfig = {
  storageKey?: string;
  storage?: 'sessionStorage' | 'localStorage';
  accessTokenSkewSec?: number;
  headers?: Record<string, string>;
  proactiveRefresh?: boolean;
};

export type SessionRetryConfig = {
  statuses?: Record<string, number>;
  tokenExpiredCode?: string;
};

/** One normalized session entry (the `name` is the map key, lifted onto the object). */
export type SessionDef = {
  name: string;
  strategy: SessionStrategy;
  runtimeModule: string;
  bearer?: SessionBearerConfig;
  retry?: SessionRetryConfig;
};

export type React33SessionConfig = {
  /** Write path for the generated framework-agnostic module (relative to react33.config.json). */
  runtimeOutput: string;
  /** Name of the session that receives the React runtime, if any. Guaranteed to exist in `sessions`. */
  primarySession?: string;
  /** Sessions in declaration order. Always non-empty. */
  sessions: SessionDef[];
  /** apiName -> sessionName, from `react33Networking.apis.<name>.session`. Every value exists in `sessions`. */
  bindings: Record<string, string>;
};

const STRATEGIES: readonly SessionStrategy[] = ['bearer', 'cookie', 'opaque', 'external'];

function asObject(v: unknown): Record<string, unknown> | undefined {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined;
}

/** Read `apiName -> sessionName` from `react33Networking.apis`. APIs with no `session` are omitted. */
function readBindings(configJson: unknown): Record<string, string> {
  const apis = asObject(asObject(configJson)?.react33Networking)?.apis;
  const apisObj = asObject(apis);
  if (!apisObj) return {};
  const out: Record<string, string> = {};
  for (const [apiName, meta] of Object.entries(apisObj)) {
    const session = asObject(meta)?.session;
    if (typeof session === 'string' && session.length > 0) out[apiName] = session;
  }
  return out;
}

function readSessionDef(name: string, raw: unknown): SessionDef {
  const obj = asObject(raw);
  if (!obj) throw new Error(`react33Session.sessions.${name}: expected an object.`);

  const strategy = (obj.strategy ?? 'bearer') as SessionStrategy;
  if (!STRATEGIES.includes(strategy)) {
    throw new Error(
      `react33Session.sessions.${name}.strategy: "${String(obj.strategy)}" is not one of ${STRATEGIES.join(', ')}.`,
    );
  }
  if (strategy === 'cookie' || strategy === 'opaque') {
    throw new Error(
      `react33Session.sessions.${name}.strategy "${strategy}" is reserved but not implemented yet — use "bearer" or "external".`,
    );
  }
  if (typeof obj.runtimeModule !== 'string' || obj.runtimeModule.length === 0) {
    throw new Error(`react33Session.sessions.${name}.runtimeModule is required (a module specifier string).`);
  }

  const bearer = asObject(obj.bearer) as SessionBearerConfig | undefined;
  if (strategy === 'bearer' && (!bearer || typeof bearer.storageKey !== 'string' || bearer.storageKey.length === 0)) {
    throw new Error(
      `react33Session.sessions.${name}.bearer.storageKey is required for the "bearer" strategy.`,
    );
  }

  return {
    name,
    strategy,
    runtimeModule: obj.runtimeModule,
    bearer,
    retry: asObject(obj.retry) as SessionRetryConfig | undefined,
  };
}

/**
 * Parse + validate the `react33Session` block. Returns `null` when the block is absent
 * (the codegen then skips, like the theme/i18n generators). Throws on a malformed or
 * internally inconsistent block so a bad config fails loudly at generate time.
 */
export function readReact33SessionConfig(configJson: unknown): React33SessionConfig | null {
  const block = asObject(asObject(configJson)?.react33Session);
  if (!block) return null;

  if (typeof block.runtimeOutput !== 'string' || block.runtimeOutput.length === 0) {
    throw new Error('react33Session.runtimeOutput is required (the generated module write path).');
  }
  const sessionsObj = asObject(block.sessions);
  if (!sessionsObj || Object.keys(sessionsObj).length === 0) {
    throw new Error('react33Session.sessions must be a non-empty object (name -> session definition).');
  }

  const sessions = Object.entries(sessionsObj).map(([name, raw]) => readSessionDef(name, raw));
  const sessionNames = new Set(sessions.map((s) => s.name));

  let primarySession: string | undefined;
  if (block.primarySession !== undefined) {
    if (typeof block.primarySession !== 'string' || !sessionNames.has(block.primarySession)) {
      throw new Error(
        `react33Session.primarySession "${String(block.primarySession)}" does not match any key in react33Session.sessions.`,
      );
    }
    primarySession = block.primarySession;
  }

  const bindings = readBindings(configJson);
  for (const [apiName, sessionName] of Object.entries(bindings)) {
    if (!sessionNames.has(sessionName)) {
      throw new Error(
        `react33Networking.apis.${apiName}.session "${sessionName}" does not match any key in react33Session.sessions.`,
      );
    }
  }

  return { runtimeOutput: block.runtimeOutput, primarySession, sessions, bindings };
}
