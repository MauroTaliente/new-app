import { isString } from '@react33/react-helpers';
import type { z } from 'zod';

import type { Values } from './use-form-api';

export type ZodSchema = z.ZodTypeAny;

/** Form values inferred from a zod schema (falls back to `Values` when inference is loose). */
export type ZodInferredValues<T extends ZodSchema> = z.infer<T> extends Values
  ? z.infer<T>
  : Values;

export type ZodFieldValidator = (value: unknown) => string | undefined;

/**
 * Per-field zod validators: known keys from `z.infer<schema>` plus slash paths
 * (e.g. `destination/city`) for nested segments.
 */
export type ZodValidatorsRules<T extends ZodSchema> = {
  [K in keyof ZodInferredValues<T>]?: ZodFieldValidator;
} & Record<string, ZodFieldValidator>;
export type ZodRules = Record<string, Record<string, string> | string>;
export type ZodEncode = (
  message: string | undefined,
  params: { min: number; max: number },
) => string | undefined;
export type ZodErrorMap = Partial<Record<z.ZodIssue['code'] | 'required', string>>;

/** Stable default: returns the Zod / map message as the field error string. */
export const zodEncodeIdentity: ZodEncode = (message) => message;

export function zodValid<T extends ZodSchema>(
  schema: T,
  path: string,
  rawMessages: ZodErrorMap | string,
  encode: ZodEncode = zodEncodeIdentity,
) {
  return (value: unknown) => {
    const pathSegments = path.split('/');
    const input = pathSegments.reduceRight((acc, key) => ({ [key]: acc }), value);
    const result = schema.safeParse(input);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.join('/') === pathSegments.join('/'));
      if (issue) {
        const params = {
          min: (issue as { minimum?: number }).minimum ?? 0,
          max: (issue as { maximum?: number }).maximum ?? 0,
        };
        const code =
          issue.code === 'too_small' && params.min === 1 ? 'required' : issue.code;
        const message = isString(rawMessages) ? rawMessages : rawMessages[code as keyof ZodErrorMap];
        return encode(message ?? issue.message, params);
      }
    }
    return undefined;
  };
}

export function makeZodValidators<T extends ZodSchema>(
  schema: T,
  rules: ZodRules,
  encode: ZodEncode = zodEncodeIdentity,
): ZodValidatorsRules<T> {
  const result: Record<string, ReturnType<typeof zodValid<T>>> = {};
  for (const path in rules) {
    result[path] = zodValid(schema, path, rules[path], encode);
  }
  return result as ZodValidatorsRules<T>;
}
