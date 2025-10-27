# env-types-validator 🔐

Type-safe environment variable validation for Node.js. Define your environment schema **once**, get both **runtime validation** and **TypeScript types** automatically.

## Why?

- 🛡️ **Fail Fast** - Validate at startup, catch missing variables immediately
- 📝 **Type-Safe** - Full TypeScript support without duplication
- ⚡ **Zero Dependencies** - Just ~3KB minified, nothing else needed
- 🎯 **Simple API** - One function, clear schema syntax
- ✅ **Multiple Types** - Support for string, number, boolean, and JSON

## Installation
```bash
npm install env-types-validator
```

## Quick Start

### Basic Usage
```typescript
import { defineEnv } from 'env-types-validator';

const env = defineEnv({
  DATABASE_URL: 'string',
  PORT: 'number',
  DEBUG: 'boolean?',  // Optional
});

console.log(env.PORT);    // ✅ TypeScript: number
console.log(env.DEBUG);   // ✅ TypeScript: boolean | undefined
```

### Validation Without Throwing
```typescript
import { validateEnv } from 'env-types-validator';

const result = validateEnv({
  DATABASE_URL: 'string',
  PORT: 'number',
});

if (result.valid) {
  console.log('✅ Valid!', result.values);
} else {
  console.error('❌ Invalid:', result.errors);
}
```

### Custom Error Handler
```typescript
import { createEnvValidator } from 'env-types-validator';

const env = createEnvValidator(
  {
    API_KEY: 'string',
    PORT: 'number',
  },
  {
    onError: (errors) => {
      errors.forEach((e) => {
        console.error(`❌ ${e.key}: ${e.reason}`);
      });
    },
  }
);
```

## API

### `defineEnv(schema, options?)`

Simple function for basic use cases.
```typescript
const env = defineEnv({
  DATABASE_URL: 'string',
  PORT: 'number',
  DEBUG: 'boolean?',
});
```

### `createEnvValidator(schema, options?)`

Advanced function with full control.
```typescript
const env = createEnvValidator(schema, {
  throwOnError: true,
  env: process.env,
  onError: (errors) => {},
});
```

### `validateEnv(schema, env?)`

Non-throwing validation.
```typescript
const result = validateEnv(schema);
result.valid;    // boolean
result.errors;   // ValidationError[]
result.values;   // Parsed values
```

## Supported Types

- **`'string'`** - Text values
- **`'number'`** - Numeric values (converts '3000' → 3000)
- **`'boolean'`** - Booleans (accepts 'true', 'false', '1', '0')
- **`'json'`** - JSON strings (parses to objects)

Add `?` after any type to make it optional:
```typescript
const env = defineEnv({
  REQUIRED: 'string',
  OPTIONAL: 'string?',
});
```

## Real-World Example
```typescript
// env.ts
import { defineEnv } from 'env-types-validator';

export const env = defineEnv({
  DATABASE_URL: 'string',
  DATABASE_POOL_SIZE: 'number?',
  NODE_ENV: 'string',
  PORT: 'number',
  JWT_SECRET: 'string',
  DEBUG: 'boolean?',
  CONFIG: 'json?',
});
```
```typescript
// app.ts
import { env } from './env';

app.listen(env.PORT, () => {
  console.log(`Server on port ${env.PORT}`);
});

const db = connect(env.DATABASE_URL, {
  poolSize: env.DATABASE_POOL_SIZE ?? 10,
});
```
```env
DATABASE_URL=postgres://localhost/db
DATABASE_POOL_SIZE=20
NODE_ENV=production
PORT=3000
JWT_SECRET=secret-key
DEBUG=false
CONFIG={"version":"1"}
```

## License

MIT
