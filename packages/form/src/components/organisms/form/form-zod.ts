import { isString } from '@react33/react-helpers';
import type { z } from 'zod';

export type ZodSchema = z.ZodTypeAny;
export type ZodRules = Record<string, Record<string, string> | string>;
export type ZodEncode = (
  message: string | undefined,
  params: { min: number; max: number },
) => string | undefined;
export type ZodErrorMap = Partial<Record<z.ZodIssueCode | 'required', string>>;

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
) {
  const result: Record<string, ReturnType<typeof zodValid<T>>> = {};
  for (const path in rules) {
    result[path] = zodValid(schema, path, rules[path], encode);
  }
  return result;
}
