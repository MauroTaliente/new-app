import { act, cleanup, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it } from 'vitest';
import {
  createBearerSessionManager,
  type BearerSessionManager,
  type BearerSessionSnapshot,
} from '../src/bearer-session';
import { createSessionRuntime } from '../src/createSessionRuntime.client';

type Tokens = { access_token: string; refresh_token: string };

const farFuture =
  'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSIsImV4cCI6MjAwMDAwMDAwMH0.x';

function makeRuntime(storageKey = 'rt.session') {
  const session = createBearerSessionManager<Tokens>({
    storageKey,
    selectors: {
      selectAccessToken: (t) => t.access_token,
      selectRefreshToken: (t) => t.refresh_token,
    },
    refresh: async () => null,
  });
  // `createSessionRuntime` re-exports the same `session` reference; spread is enough.
  return createSessionRuntime({ session });
}

describe('createSessionRuntime', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('useSession throws when used outside SessionProvider', () => {
    const { useSession } = makeRuntime();
    expect(() => renderHook(() => useSession())).toThrow(
      /must be used within a <SessionProvider>/,
    );
  });

  it('useSessionState throws when used outside SessionProvider', () => {
    const { useSessionState } = makeRuntime();
    expect(() => renderHook(() => useSessionState())).toThrow(
      /must be used within a <SessionProvider>/,
    );
  });

  it('useSession returns snapshot + manager and re-renders on setSession', () => {
    const { session, SessionProvider, useSession } = makeRuntime();

    function Probe() {
      const [snap] = useSession();
      return (
        <>
          <span data-testid="has-access">{String(snap.hasAccess)}</span>
          <span data-testid="sub">{snap.accessPayload?.sub ?? '-'}</span>
        </>
      );
    }

    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );

    expect(screen.getByTestId('has-access').textContent).toBe('false');
    expect(screen.getByTestId('sub').textContent).toBe('-');

    act(() => {
      session.setSession({ access_token: farFuture, refresh_token: 'rt1' });
    });

    expect(screen.getByTestId('has-access').textContent).toBe('true');
    expect(screen.getByTestId('sub').textContent).toBe('u1');

    session.dispose();
  });

  it('useSession re-renders on clearSession', () => {
    const { session, SessionProvider, useSession } = makeRuntime();
    session.setSession({ access_token: farFuture, refresh_token: 'rt1' });

    function Probe() {
      const [snap] = useSession();
      return <span data-testid="has-access">{String(snap.hasAccess)}</span>;
    }

    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );
    expect(screen.getByTestId('has-access').textContent).toBe('true');

    act(() => {
      session.clearSession();
    });
    expect(screen.getByTestId('has-access').textContent).toBe('false');

    session.dispose();
  });

  it('useSession exposes the manager for imperative actions', () => {
    const { session, SessionProvider, useSession } = makeRuntime();

    function Probe() {
      const [snap, mgr] = useSession();
      return (
        <>
          <span data-testid="has-access">{String(snap.hasAccess)}</span>
          <button
            type="button"
            onClick={() =>
              mgr.setSession({ access_token: farFuture, refresh_token: 'rt1' })
            }
          >
            login
          </button>
        </>
      );
    }

    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );

    expect(screen.getByTestId('has-access').textContent).toBe('false');
    act(() => {
      screen.getByRole('button', { name: 'login' }).click();
    });
    expect(screen.getByTestId('has-access').textContent).toBe('true');

    session.dispose();
  });

  it('useSessionState returns the snapshot only (no manager)', () => {
    const { session, SessionProvider, useSessionState } = makeRuntime();

    function Probe() {
      const snap = useSessionState();
      return <span data-testid="has-refresh">{String(snap.hasRefresh)}</span>;
    }

    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );

    expect(screen.getByTestId('has-refresh').textContent).toBe('false');

    act(() => {
      session.setSession({ access_token: farFuture, refresh_token: 'rt1' });
    });
    expect(screen.getByTestId('has-refresh').textContent).toBe('true');

    session.dispose();
  });

  it('Bearer call site infers [BearerSessionSnapshot, BearerSessionManager<TTokens>] from useSession (no breaking change guard)', () => {
    // This is a pure type-level guard: if `createSessionRuntime` ever loses the ability to
    // narrow back to the Bearer-specific shapes, this assertion will fail to compile.
    const { useSession, useSessionState } = makeRuntime();
    expectTypeOf(useSession).returns.toEqualTypeOf<
      readonly [BearerSessionSnapshot, BearerSessionManager<Tokens>]
    >();
    expectTypeOf(useSessionState).returns.toEqualTypeOf<BearerSessionSnapshot>();
  });

  it('the same `session` reference flows through the Provider context', () => {
    const { session, SessionProvider, useSession } = makeRuntime();

    let captured: unknown;
    function Probe() {
      const [, mgr] = useSession();
      captured = mgr;
      return null;
    }
    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );
    expect(captured).toBe(session);
    session.dispose();
  });
});
