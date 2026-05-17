import Ajv2020, { type ErrorObject, type ValidateFunction } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import rootSchema from '../react33.config.schema.json' with { type: 'json' };

export type React33ConfigValidation = {
  valid: boolean;
  errors: ErrorObject[] | null | undefined;
};

/** Compiles the published root schema (with $defs for partial refs). */
export function createReact33ConfigValidator(): ValidateFunction {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(rootSchema);
}

export function validateReact33Config(
  data: unknown,
  validate: ValidateFunction = createReact33ConfigValidator(),
): React33ConfigValidation {
  const valid = validate(data) === true;
  return { valid, errors: valid ? null : validate.errors };
}
