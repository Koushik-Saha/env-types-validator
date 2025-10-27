import { EnvSchema, ValidatorOptions, ValidationResult, ValidationError } from './types';

/**
 * Parse type string and check if optional
 * Examples:
 *   'string' => { type: 'string', optional: false }
 *   'string?' => { type: 'string', optional: true }
 *   'number?' => { type: 'number', optional: true }
 */
function parseTypeString(typeStr: string): { type: string; optional: boolean } {
    const isOptional = typeStr.endsWith('?');
    const baseType = isOptional ? typeStr.slice(0, -1) : typeStr;
    return { type: baseType, optional: isOptional };
}

/**
 * Validate a single value against expected type
 * Returns validation result with parsed value or error reason
 */
function validateValue(
    value: string | undefined,
    expectedType: string
): { valid: boolean; parsed: any; reason?: string } {
    if (value === undefined || value === '') {
        return { valid: false, parsed: undefined, reason: 'Value is empty or undefined' };
    }

    switch (expectedType) {
        case 'string':
            return { valid: true, parsed: value };

        case 'number':
            const num = Number(value);
            if (isNaN(num)) {
                return { valid: false, parsed: undefined, reason: `"${value}" is not a valid number` };
            }
            return { valid: true, parsed: num };

        case 'boolean':
            if (value.toLowerCase() === 'true' || value === '1') {
                return { valid: true, parsed: true };
            }
            if (value.toLowerCase() === 'false' || value === '0') {
                return { valid: true, parsed: false };
            }
            return {
                valid: false,
                parsed: undefined,
                reason: `"${value}" is not a valid boolean (use 'true', 'false', '1', or '0')`,
            };

        case 'json':
            try {
                const parsed = JSON.parse(value);
                return { valid: true, parsed };
            } catch (e) {
                return { valid: false, parsed: undefined, reason: `"${value}" is not valid JSON` };
            }

        default:
            return { valid: false, parsed: undefined, reason: `Unknown type: ${expectedType}` };
    }
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
export function createEnvValidator(
    schema: EnvSchema,
    options: ValidatorOptions = {}
): Record<string, any> {
    const { throwOnError = true, env = process.env, onError } = options;

    const errors: ValidationError[] = [];
    const values: Record<string, any> = {};

    // Validate each key in schema
    for (const [key, typeStr] of Object.entries(schema)) {
        const { type, optional } = parseTypeString(typeStr);
        const value = env[key];

        // Check if required value is missing
        if (!value && !optional) {
            errors.push({
                key,
                expected: typeStr,
                received: value,
                reason: `Required environment variable "${key}" is missing`,
            });
            continue;
        }

        // If optional and missing, set to undefined
        if (!value && optional) {
            values[key] = undefined;
            continue;
        }

        // Validate the value type
        const validation = validateValue(value, type);
        if (!validation.valid) {
            errors.push({
                key,
                expected: typeStr,
                received: value,
                reason: validation.reason || 'Validation failed',
            });
        } else {
            values[key] = validation.parsed;
        }
    }

    // Handle validation errors
    if (errors.length > 0) {
        const errorMessage = errors.map((e) => `  • ${e.key}: ${e.reason}`).join('\n');
        const fullMessage = `Environment validation failed:\n${errorMessage}`;

        if (onError) {
            onError(errors);
        }

        if (throwOnError) {
            throw new Error(fullMessage);
        }
    }

    return values;
}

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
export function defineEnv<T extends EnvSchema>(
    schema: T,
    options?: ValidatorOptions
): Record<keyof T, any> {
    return createEnvValidator(schema, options) as Record<keyof T, any>;
}

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
export function validateEnv(
    schema: EnvSchema,
    env: NodeJS.ProcessEnv = process.env
): ValidationResult {
    const errors: ValidationError[] = [];
    const values: Record<string, any> = {};

    for (const [key, typeStr] of Object.entries(schema)) {
        const { type, optional } = parseTypeString(typeStr);
        const value = env[key];

        if (!value && !optional) {
            errors.push({
                key,
                expected: typeStr,
                received: value,
                reason: `Required: "${key}" is missing`,
            });
            continue;
        }

        if (!value && optional) {
            values[key] = undefined;
            continue;
        }

        const validation = validateValue(value, type);
        if (!validation.valid) {
            errors.push({
                key,
                expected: typeStr,
                received: value,
                reason: validation.reason || 'Validation failed',
            });
        } else {
            values[key] = validation.parsed;
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        values,
    };
}

// Export types for external use
export type { EnvSchema, ValidatorOptions, ValidationResult, ValidationError };
