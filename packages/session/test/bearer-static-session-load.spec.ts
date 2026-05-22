import { describe, expect, it } from 'vitest';
import { createBearerStaticSessionManager } from '../src/bearer-static-session';
import { createBearerStaticSessionLoad } from '../src/bearer-static-session-load';

type Tokens = { access_token: string };

const farFuture = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSIsImV4cCI6MjAwMDAwMDAwMH0.x';
const selectors = { selectAccessToken: (t: Tokens) => t.access_token };

describe('createBearerStaticSessionLoad', () => {
  it('attaches Authorization: Bearer <token> when a token is present', async () => {
    const mgr = createBearerStaticSessionManager<Tokens>({ selectors });
    mgr.setSession({ access_token: farFuture });
    const load = createBearerStaticSessionLoad(mgr);

    const out = await load({ url: 'https://x.test' });
    const headers = new Headers(out.headers as HeadersInit);
    expect(headers.get('Authorization')).toBe(`Bearer ${farFuture}`);
    mgr.dispose();
  });

  it('returns shared unchanged when there is no token', async () => {
    const mgr = createBearerStaticSessionManager<Tokens>({ selectors });
    const load = createBearerStaticSessionLoad(mgr);

    const shared = { url: 'https://x.test' };
    expect(await load(shared)).toBe(shared);
    mgr.dispose();
  });

  it('supports a custom header template', async () => {
    const mgr = createBearerStaticSessionManager<Tokens>({ selectors });
    mgr.setSession({ access_token: 'abc123' });
    const load = createBearerStaticSessionLoad(mgr, { headers: { 'X-Api-Key': '{token}' } });

    const out = await load({ url: 'https://x.test' });
    const headers = new Headers(out.headers as HeadersInit);
    expect(headers.get('X-Api-Key')).toBe('abc123');
    mgr.dispose();
  });
});
