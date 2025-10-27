/**
 * Allowed environment variable types
 */
export type EnvType = 'string' | 'number' | 'boolean' | 'json';

/**
 * Environment variable schema definition
 * Example: { DATABASE_URL: 'string', PORT: 'number', DEBUG: 'boolean?' }
 * Add ? after type to make it optional
 */
export interface EnvSchema {
    [key: string]: string;
}

/**
 * Options for environment variable validator
 */
export interface ValidatorOptions {
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
export interface ValidationError {
    key: string;
    expected: string;
    received: string | undefined;
    reason: string;
}

/**
 * Result of validation without throwing
 */
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    values: Record<string, any>;
}
