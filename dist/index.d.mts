/**
 * Environment variable schema definition
 * Example: { DATABASE_URL: 'string', PORT: 'number', DEBUG: 'boolean?' }
 * Add ? after type to make it optional
 */
interface EnvSchema {
    [key: string]: string;
}
/**
 * Options for environment variable validator
 */
interface ValidatorOptions {
    /** Throw error if validation fails (default: true) */
    throwOnError?: boolean;
    /** Environment object to validate against (default: process.env) */
    env?: NodeJS.ProcessEnv;
    /** Custom error handler function */
    onError?: (errors: ValidationError[]) => void;
}
/**
 * Individual validation error details
 */
interface ValidationError {
    key: string;
    expected: string;
    received: string | undefined;
    reason: string;
}
/**
 * Result of validation without throwing
 */
interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    values: Record<string, any>;
}

/**
 * Create environment variable validator from schema
 * Validates all variables and returns typed object
 *
 * @param schema - Environment variable schema definition
 * @param options - Validation options (throwOnError, env, onError)
 * @returns Validated environment variables as typed object
 *
 * @example
 * const env = createEnvValidator({
 *   DATABASE_URL: 'string',
 *   PORT: 'number',
 *   DEBUG: 'boolean?',
 * });
 */
declare function createEnvValidator(schema: EnvSchema, options?: ValidatorOptions): Record<string, any>;
/**
 * Convenient function to define and validate environment variables
 * Throws on validation error by default
 *
 * @param schema - Environment variable schema
 * @param options - Validation options
 * @returns Validated environment variables as typed object
 *
 * @example
 * export const env = defineEnv({
 *   DATABASE_URL: 'string',
 *   PORT: 'number',
 *   DEBUG: 'boolean?',
 * });
 */
declare function defineEnv<T extends EnvSchema>(schema: T, options?: ValidatorOptions): Record<keyof T, any>;
/**
 * Validate environment variables without throwing
 * Returns detailed validation result
 *
 * @param schema - Environment variable schema
 * @param env - Environment object to validate (default: process.env)
 * @returns ValidationResult with valid flag, errors array, and parsed values
 *
 * @example
 * const result = validateEnv({
 *   DATABASE_URL: 'string',
 *   PORT: 'number',
 * });
 *
 * if (result.valid) {
 *   console.log('Env vars are valid', result.values);
 * } else {
 *   console.error('Invalid vars:', result.errors);
 * }
 */
declare function validateEnv(schema: EnvSchema, env?: NodeJS.ProcessEnv): ValidationResult;

export { type EnvSchema, type ValidationError, type ValidationResult, type ValidatorOptions, createEnvValidator, defineEnv, validateEnv };
