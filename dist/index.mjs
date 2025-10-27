// src/index.ts
function parseTypeString(typeStr) {
  const isOptional = typeStr.endsWith("?");
  const baseType = isOptional ? typeStr.slice(0, -1) : typeStr;
  return { type: baseType, optional: isOptional };
}
function validateValue(value, expectedType) {
  if (value === void 0 || value === "") {
    return { valid: false, parsed: void 0, reason: "Value is empty or undefined" };
  }
  switch (expectedType) {
    case "string":
      return { valid: true, parsed: value };
    case "number":
      const num = Number(value);
      if (isNaN(num)) {
        return { valid: false, parsed: void 0, reason: `"${value}" is not a valid number` };
      }
      return { valid: true, parsed: num };
    case "boolean":
      if (value.toLowerCase() === "true" || value === "1") {
        return { valid: true, parsed: true };
      }
      if (value.toLowerCase() === "false" || value === "0") {
        return { valid: true, parsed: false };
      }
      return {
        valid: false,
        parsed: void 0,
        reason: `"${value}" is not a valid boolean (use 'true', 'false', '1', or '0')`
      };
    case "json":
      try {
        const parsed = JSON.parse(value);
        return { valid: true, parsed };
      } catch (e) {
        return { valid: false, parsed: void 0, reason: `"${value}" is not valid JSON` };
      }
    default:
      return { valid: false, parsed: void 0, reason: `Unknown type: ${expectedType}` };
  }
}
function createEnvValidator(schema, options = {}) {
  const { throwOnError = true, env = process.env, onError } = options;
  const errors = [];
  const values = {};
  for (const [key, typeStr] of Object.entries(schema)) {
    const { type, optional } = parseTypeString(typeStr);
    const value = env[key];
    if (!value && !optional) {
      errors.push({
        key,
        expected: typeStr,
        received: value,
        reason: `Required environment variable "${key}" is missing`
      });
      continue;
    }
    if (!value && optional) {
      values[key] = void 0;
      continue;
    }
    const validation = validateValue(value, type);
    if (!validation.valid) {
      errors.push({
        key,
        expected: typeStr,
        received: value,
        reason: validation.reason || "Validation failed"
      });
    } else {
      values[key] = validation.parsed;
    }
  }
  if (errors.length > 0) {
    const errorMessage = errors.map((e) => `  \u2022 ${e.key}: ${e.reason}`).join("\n");
    const fullMessage = `Environment validation failed:
${errorMessage}`;
    if (onError) {
      onError(errors);
    }
    if (throwOnError) {
      throw new Error(fullMessage);
    }
  }
  return values;
}
function defineEnv(schema, options) {
  return createEnvValidator(schema, options);
}
function validateEnv(schema, env = process.env) {
  const errors = [];
  const values = {};
  for (const [key, typeStr] of Object.entries(schema)) {
    const { type, optional } = parseTypeString(typeStr);
    const value = env[key];
    if (!value && !optional) {
      errors.push({
        key,
        expected: typeStr,
        received: value,
        reason: `Required: "${key}" is missing`
      });
      continue;
    }
    if (!value && optional) {
      values[key] = void 0;
      continue;
    }
    const validation = validateValue(value, type);
    if (!validation.valid) {
      errors.push({
        key,
        expected: typeStr,
        received: value,
        reason: validation.reason || "Validation failed"
      });
    } else {
      values[key] = validation.parsed;
    }
  }
  return {
    valid: errors.length === 0,
    errors,
    values
  };
}
export {
  createEnvValidator,
  defineEnv,
  validateEnv
};
