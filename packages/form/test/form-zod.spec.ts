import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { makeZodValidators, zodEncodeIdentity, zodValid } from '../src/components/organisms/form/form-zod';

describe('zodValid', () => {
  const schema = z.object({
    email: z.string().email(),
    name: z.string().min(1),
  });

  it('returns undefined when the segment path is valid', () => {
    const v = zodValid(schema, 'email', 'bad email');
    expect(v('ok@example.com')).toBeUndefined();
  });

  it('returns encoded message for invalid value at path', () => {
    const encode = vi.fn(zodEncodeIdentity);
    const v = zodValid(schema, 'email', 'invalid email', encode);
    expect(v('not-an-email')).toBe('invalid email');
    expect(encode).toHaveBeenCalledWith('invalid email', expect.any(Object));
  });

  it('maps too_small with min 1 to required key in message map', () => {
    const v = zodValid(schema, 'name', {
      required: 'Name is required',
      too_small: 'Too short',
    });
    expect(v('')).toBe('Name is required');
  });

  it('uses a single string message for every failure code', () => {
    const v = zodValid(schema, 'email', 'Email error');
    expect(v('x')).toBe('Email error');
  });
});

describe('makeZodValidators', () => {
  it('builds one validator per rule key', () => {
    const schema = z.object({
      a: z.string().min(1),
      b: z.number().min(0),
    });
    const rules = {
      a: 'A required',
      b: 'B invalid',
    };
    const validators = makeZodValidators(schema, rules);
    expect(validators.a?.('')).toBe('A required');
    expect(validators.b?.(-1)).toBe('B invalid');
  });

  it('supports nested paths joined with /', () => {
    const schema = z.object({
      user: z.object({
        email: z.string().email(),
      }),
    });
    const validators = makeZodValidators(schema, {
      'user/email': 'Bad',
    });
    expect(validators['user/email']?.('nope')).toBe('Bad');
    expect(validators['user/email']?.('ok@example.com')).toBeUndefined();
  });
});
