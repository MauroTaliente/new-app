import { describe, it, expect, vi } from 'vitest';
import type { RetryContext } from '@react33/react-networking';
import { createBearerSessionRetry } from '../src/createBearerSessionRetry.js';
import type { BearerSessionManager } from '../src/bearer-session.js';

function fakeSession() {
  const ensureFreshSession = vi.fn(async () => true);
  return {
    session: { ensureFreshSession } as unknown as BearerSessionManager<unknown>,
    ensureFreshSession,
  };
}

const ctx = (over: Partial<RetryContext>): RetryContext =>
  ({ status: 401, attempt: 0, ...over }) as unknown as RetryContext;

describe('createBearerSessionRetry', () => {
  it('defaults the retry budget to { 401: 1 }', () => {
    expect(createBearerSessionRetry(fakeSession().session).retries).toEqual({ 401: 1 });
  });

  it('honors a custom statuses budget', () => {
    const d = createBearerSessionRetry(fakeSession().session, { statuses: { 401: 2, 429: 1 } });
    expect(d.retries).toEqual({ 401: 2, 429: 1 });
  });

  it('refreshes the session on a 401', async () => {
    const { session, ensureFreshSession } = fakeSession();
    await createBearerSessionRetry(session).onRetry!(ctx({ status: 401 }));
    expect(ensureFreshSession).toHaveBeenCalledOnce();
  });

  it('ignores non-401 statuses', async () => {
    const { session, ensureFreshSession } = fakeSession();
    await createBearerSessionRetry(session).onRetry!(ctx({ status: 503 }));
    expect(ensureFreshSession).not.toHaveBeenCalled();
  });

  it('with tokenExpiredCode: refreshes when the body code matches', async () => {
    const { session, ensureFreshSession } = fakeSession();
    const d = createBearerSessionRetry(session, { tokenExpiredCode: 'TOKEN_EXPIRED' });
    await d.onRetry!(ctx({ response: { status: 401, data: { code: 'TOKEN_EXPIRED' } } }));
    expect(ensureFreshSession).toHaveBeenCalledOnce();
  });

  it('with tokenExpiredCode: a 401 with a different code is terminal — no refresh', async () => {
    const { session, ensureFreshSession } = fakeSession();
    const d = createBearerSessionRetry(session, { tokenExpiredCode: 'TOKEN_EXPIRED' });
    await d.onRetry!(ctx({ response: { status: 401, data: { code: 'SESSION_REVOKED' } } }));
    expect(ensureFreshSession).not.toHaveBeenCalled();
  });

  it('with tokenExpiredCode: a 401 with no body code is terminal — no refresh', async () => {
    const { session, ensureFreshSession } = fakeSession();
    const d = createBearerSessionRetry(session, { tokenExpiredCode: 'TOKEN_EXPIRED' });
    await d.onRetry!(ctx({ response: { status: 401, data: {} } }));
    expect(ensureFreshSession).not.toHaveBeenCalled();
  });

  it('without tokenExpiredCode: any 401 refreshes regardless of body', async () => {
    const { session, ensureFreshSession } = fakeSession();
    await createBearerSessionRetry(session).onRetry!(
      ctx({ response: { status: 401, data: { code: 'WHATEVER' } } }),
    );
    expect(ensureFreshSession).toHaveBeenCalledOnce();
  });

  it('a 401 on a skipLoad request is terminal — no refresh (avoids re-entrant refresh)', async () => {
    const { session, ensureFreshSession } = fakeSession();
    await createBearerSessionRetry(session).onRetry!(ctx({ status: 401, skipLoad: true }));
    expect(ensureFreshSession).not.toHaveBeenCalled();
  });
});
