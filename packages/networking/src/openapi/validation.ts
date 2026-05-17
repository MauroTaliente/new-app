import type { ZodType, ZodError } from 'zod';
import type { RequestReturn } from '../types';

export type OpenApiValidateMode = 'log' | 'strict';

export type OpenApiValidateConfig =
  | boolean
  | {
      params?: boolean;
      response?: boolean;
      mode?: OpenApiValidateMode;
    };

export type OpenApiValidateResolved = {
  params: boolean;
  response: boolean;
  mode: OpenApiValidateMode;
};

export type OpenApiSdkCallOptions = {
  /** Per-call override. `false` disables params + response validation. */
  validate?: OpenApiValidateConfig;
  /** When true, logs Zod validation success to the console. */
  verbose?: boolean;
};

export type OpenApiValidationContext = {
  operationId: string;
  schemaName: string;
  direction: 'params' | 'response';
  mode: OpenApiValidateMode;
  verbose?: boolean;
  scope?: string;
  url?: string;
  method?: string;
};

export class OpenApiValidationError extends Error {
  readonly operationId: string;
  readonly schemaName: string;
  readonly direction: 'params' | 'response';
  readonly zodError: ZodError;

  constructor(ctx: OpenApiValidationContext, zodError: ZodError) {
    super(formatOpenApiValidationMessage(ctx, zodError));
    this.name = 'OpenApiValidationError';
    this.operationId = ctx.operationId;
    this.schemaName = ctx.schemaName;
    this.direction = ctx.direction;
    this.zodError = zodError;
  }
}

const VALIDATE_OFF: OpenApiValidateResolved = {
  params: false,
  response: false,
  mode: 'log',
};

export function normalizeOpenApiValidateConfig(
  config?: OpenApiValidateConfig,
): OpenApiValidateResolved {
  if (config === undefined) return { ...VALIDATE_OFF };
  if (config === false) return { ...VALIDATE_OFF };
  if (config === true) {
    return { params: true, response: true, mode: 'log' };
  }
  return {
    params: config.params ?? false,
    response: config.response ?? false,
    mode: config.mode ?? 'log',
  };
}

function applyValidateLayer(
  current: OpenApiValidateResolved,
  layer?: OpenApiValidateConfig,
): OpenApiValidateResolved {
  if (layer === undefined) return current;
  if (layer === false) return { ...VALIDATE_OFF };
  if (layer === true) {
    return { params: true, response: true, mode: current.mode };
  }
  return {
    params: layer.params ?? current.params,
    response: layer.response ?? current.response,
    mode: layer.mode ?? current.mode,
  };
}

/** Merge `defaults` → file → operation (later wins). Used at codegen and runtime. */
export function resolveOpenApiValidateConfig(
  defaults?: OpenApiValidateConfig,
  fileConfig?: OpenApiValidateConfig,
  operationConfig?: OpenApiValidateConfig,
): OpenApiValidateResolved {
  let out = normalizeOpenApiValidateConfig(defaults);
  out = applyValidateLayer(out, fileConfig);
  out = applyValidateLayer(out, operationConfig);
  return out;
}

export function resolveOpenApiSdkValidate(
  defaults: OpenApiValidateResolved,
  callOverride?: OpenApiValidateConfig,
): OpenApiValidateResolved {
  if (callOverride === undefined) return defaults;
  if (callOverride === false) return { ...VALIDATE_OFF };
  if (callOverride === true) {
    return { params: true, response: true, mode: defaults.mode };
  }
  return {
    params: callOverride.params ?? defaults.params,
    response: callOverride.response ?? defaults.response,
    mode: callOverride.mode ?? defaults.mode,
  };
}

function formatZodIssues(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
      return `  - ${path}: ${issue.message}`;
    })
    .join('\n');
}

export function formatOpenApiValidationMessage(
  ctx: OpenApiValidationContext,
  error: ZodError,
): string {
  const header = [
    `[react33 OpenAPI] ${ctx.direction} validation failed`,
    `  operation: ${ctx.operationId}`,
    `  schema: ${ctx.schemaName}`,
    ctx.scope ? `  scope: ${ctx.scope}` : null,
    ctx.method ? `  method: ${ctx.method}` : null,
    ctx.url ? `  url: ${ctx.url}` : null,
    `  mode: ${ctx.mode}`,
    '  issues:',
    formatZodIssues(error),
  ]
    .filter(Boolean)
    .join('\n');
  return header;
}

function logValidationFailure(ctx: OpenApiValidationContext, error: ZodError): void {
  const message = formatOpenApiValidationMessage(ctx, error);
  if (ctx.mode === 'strict') {
    console.error(message);
  } else {
    console.warn(message);
  }
}

function logValidationSuccess(ctx: OpenApiValidationContext): void {
  if (!ctx.verbose) return;
  if (ctx.direction === 'params') {
    console.log(`✅ ${ctx.operationId}: params validated\n`);
    return;
  }
  console.log(`🛡️ ${ctx.operationId}: response validated\n`);
}

export function validateOpenApiParams<T>(
  schema: ZodType<T>,
  params: T,
  ctx: OpenApiValidationContext,
): T {
  const parsed = schema.safeParse(params);
  if (parsed.success) {
    logValidationSuccess(ctx);
    return parsed.data;
  }
  logValidationFailure(ctx, parsed.error);
  if (ctx.mode === 'strict') {
    throw new OpenApiValidationError(ctx, parsed.error);
  }
  return params;
}

export function validateOpenApiResponse<T>(
  schema: ZodType<T>,
  response: RequestReturn<unknown>,
  ctx: OpenApiValidationContext,
): RequestReturn<T> {
  const parsed = schema.safeParse(response.data);
  if (parsed.success) {
    logValidationSuccess(ctx);
    return { ...response, data: parsed.data };
  }
  logValidationFailure(ctx, parsed.error);
  if (ctx.mode === 'strict') {
    throw new OpenApiValidationError(ctx, parsed.error);
  }
  return { ...response, data: response.data as T };
}

/** @deprecated Use `validateOpenApiResponse` */
export function parseWithSchema<T>(
  schema: ZodType<T>,
  response: RequestReturn<unknown>,
): RequestReturn<T> {
  return validateOpenApiResponse(schema, response, {
    operationId: 'unknown',
    schemaName: 'unknown',
    direction: 'response',
    mode: 'log',
  });
}
