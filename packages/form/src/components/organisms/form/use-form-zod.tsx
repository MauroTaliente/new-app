'use client';

import { useMemo } from 'react';

import {
  makeZodValidators,
  zodEncodeIdentity,
  type ZodEncode,
  type ZodRules,
  type ZodSchema,
} from './form-zod';

export function useMakeZodValidators<T extends ZodSchema>(
  {
    schema,
    messages,
    encode,
  }: {
    schema: T;
    messages: ZodRules;
    encode?: ZodEncode;
  },
  deps: unknown[] = [],
) {
  const resolvedEncode = encode ?? zodEncodeIdentity;
  return useMemo(
    () => makeZodValidators<T>(schema, messages, resolvedEncode),
    [schema, messages, resolvedEncode, ...deps],
  );
}
