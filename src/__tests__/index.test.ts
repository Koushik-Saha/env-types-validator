import { createEnvValidator, defineEnv, validateEnv } from '../index';

describe('Environment Variable Validator', () => {
    it('should validate required string variables', () => {
        const schema = {
            API_KEY: 'string',
            DATABASE_URL: 'string',
        };

        const mockEnv = {
            API_KEY: 'secret123',
            DATABASE_URL: 'postgres://localhost',
        };

        const result = createEnvValidator(schema, { env: mockEnv });

        expect(result.API_KEY).toBe('secret123');
        expect(result.DATABASE_URL).toBe('postgres://localhost');
    });

    it('should validate number variables', () => {
        const schema = {
            PORT: 'number',
            MAX_CONNECTIONS: 'number',
        };

        const mockEnv = {
            PORT: '3000',
            MAX_CONNECTIONS: '100',
        };

        const result = createEnvValidator(schema, { env: mockEnv });

        expect(result.PORT).toBe(3000);
        expect(result.MAX_CONNECTIONS).toBe(100);
    });

    it('should validate boolean variables', () => {
        const schema = {
            DEBUG: 'boolean',
            CACHE_ENABLED: 'boolean',
        };

        const mockEnv = {
            DEBUG: 'true',
            CACHE_ENABLED: 'false',
        };

        const result = createEnvValidator(schema, { env: mockEnv });

        expect(result.DEBUG).toBe(true);
        expect(result.CACHE_ENABLED).toBe(false);
    });

    it('should support boolean values with 1 and 0', () => {
        const schema = {
            FEATURE_FLAG: 'boolean',
        };

        const mockEnv1 = { FEATURE_FLAG: '1' };
        const mockEnv2 = { FEATURE_FLAG: '0' };

        const result1 = createEnvValidator(schema, { env: mockEnv1 });
        const result2 = createEnvValidator(schema, { env: mockEnv2 });

        expect(result1.FEATURE_FLAG).toBe(true);
        expect(result2.FEATURE_FLAG).toBe(false);
    });

    it('should validate JSON variables', () => {
        const schema = {
            CONFIG: 'json',
        };

        const mockEnv = {
            CONFIG: '{"key":"value","nested":{"prop":123}}',
        };

        const result = createEnvValidator(schema, { env: mockEnv });

        expect(result.CONFIG).toEqual({ key: 'value', nested: { prop: 123 } });
    });

    it('should allow optional variables', () => {
        const schema = {
            REQUIRED: 'string',
            OPTIONAL_KEY: 'string?',
        };

        const mockEnv = {
            REQUIRED: 'value',
        };

        const result = createEnvValidator(schema, { env: mockEnv });

        expect(result.REQUIRED).toBe('value');
        expect(result.OPTIONAL_KEY).toBeUndefined();
    });

    it('should throw on missing required variable', () => {
        const schema = {
            API_KEY: 'string',
        };

        const mockEnv = {};

        expect(() => createEnvValidator(schema, { env: mockEnv })).toThrow(
            'Environment validation failed'
        );
    });

    it('should throw on invalid type (number)', () => {
        const schema = {
            PORT: 'number',
        };

        const mockEnv = {
            PORT: 'not-a-number',
        };

        expect(() => createEnvValidator(schema, { env: mockEnv })).toThrow(
            'not a valid number'
        );
    });

    it('should throw on invalid type (boolean)', () => {
        const schema = {
            DEBUG: 'boolean',
        };

        const mockEnv = {
            DEBUG: 'maybe',
        };

        expect(() => createEnvValidator(schema, { env: mockEnv })).toThrow(
            'not a valid boolean'
        );
    });

    it('should throw on invalid JSON', () => {
        const schema = {
            CONFIG: 'json',
        };

        const mockEnv = {
            CONFIG: '{invalid json}',
        };

        expect(() => createEnvValidator(schema, { env: mockEnv })).toThrow(
            'not valid JSON'
        );
    });

    it('should handle throwOnError: false', () => {
        const schema = {
            PORT: 'number',
        };

        const mockEnv = {
            PORT: 'invalid',
        };

        const result = createEnvValidator(schema, {
            env: mockEnv,
            throwOnError: false,
        });

        expect(result).toBeDefined();
    });

    it('should validate without throwing using validateEnv', () => {
        const schema = {
            API_KEY: 'string',
            PORT: 'number',
        };

        const mockEnv = {
            API_KEY: 'secret',
            PORT: 'invalid',
        };

        const result = validateEnv(schema, mockEnv);

        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].key).toBe('PORT');
    });

    it('should return valid=true and no errors when all vars are valid', () => {
        const schema = {
            DATABASE_URL: 'string',
            PORT: 'number',
        };

        const mockEnv = {
            DATABASE_URL: 'postgres://localhost',
            PORT: '5432',
        };

        const result = validateEnv(schema, mockEnv);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.values.PORT).toBe(5432);
    });

    it('should work with defineEnv convenience function', () => {
        const schema = {
            DATABASE_URL: 'string',
            PORT: 'number',
            DEBUG: 'boolean?',
        };

        const mockEnv = {
            DATABASE_URL: 'postgres://localhost',
            PORT: '5432',
        };

        const env = defineEnv(schema, { env: mockEnv });

        expect(env.DATABASE_URL).toBe('postgres://localhost');
        expect(env.PORT).toBe(5432);
        expect(env.DEBUG).toBeUndefined();
    });

    it('should call custom error handler', () => {
        const schema = {
            API_KEY: 'string',
        };

        const mockEnv = {};
        const errorHandler = jest.fn();

        expect(() =>
            createEnvValidator(schema, {
                env: mockEnv,
                onError: errorHandler,
            })
        ).toThrow();

        expect(errorHandler).toHaveBeenCalled();
        expect(errorHandler.mock.calls[0][0][0].key).toBe('API_KEY');
    });

    it('should handle mixed schema with multiple types', () => {
        const schema = {
            DATABASE_URL: 'string',
            PORT: 'number',
            DEBUG: 'boolean',
            CONFIG: 'json?',
            API_KEY: 'string?',
        };

        const mockEnv = {
            DATABASE_URL: 'postgres://localhost',
            PORT: '3000',
            DEBUG: 'true',
            CONFIG: '{"version":"1"}',
        };

        const result = createEnvValidator(schema, { env: mockEnv });

        expect(result.DATABASE_URL).toBe('postgres://localhost');
        expect(result.PORT).toBe(3000);
        expect(result.DEBUG).toBe(true);
        expect(result.CONFIG).toEqual({ version: '1' });
        expect(result.API_KEY).toBeUndefined();
    });
});
