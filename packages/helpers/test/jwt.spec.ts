import { describe, expect, it } from 'vitest';
import { decodeJwtPayload, getJwtExpiry, isJwtExpired } from '../src/jwt';

/** Payload {"sub":"u1","exp":2000000000} */
const token =
  'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSIsImV4cCI6MjAwMDAwMDAwMH0.x';

describe('decodeJwtPayload', () => {
  it('decodes sub and exp', () => {
    const p = decodeJwtPayload(token);
    expect(p?.sub).toBe('u1');
    expect(p?.exp).toBe(2000000000);
  });

  it('returns null for garbage', () => {
    expect(decodeJwtPayload('not-a-jwt')).toBeNull();
  });
});

describe('isJwtExpired', () => {
  it('is false for a far-future exp', () => {
    expect(isJwtExpired(token, 0)).toBe(false);
  });

  it('is true when exp is in the past', () => {
    const past =
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSIsImV4cCI6MX0.x';
    expect(isJwtExpired(past, 0)).toBe(true);
  });

  it('getJwtExpiry reads exp', () => {
    expect(getJwtExpiry(token)).toBe(2000000000);
  });
});
