import { isObject } from "./primitives-util";

const DEEPEST_LEVEL = 20;

const dangerousProperties = new Set([
  // User fields
  "password",
  "pin",
  "token",
  "sessionToken",
  "ipAddress",
  "location",
  "device",
  "twoFactorAuth"
]);

const reservedProperties = new Set(["stack"]);

function sanitizeObjectUtil(
  dirtyObject: Record<string, unknown>,
  sanitize = false,
  keepDangerousProperties: string[] = [],
  deepLevel = 0
): Record<string, unknown> {
  // To prevent long recursive operations if the current level is after this, just return an empty object
  deepLevel++;
  if (deepLevel > DEEPEST_LEVEL) {
    return {};
  }

  let cleanObject: { [p: string]: unknown | string | number | unknown[] } = {};

  if (!isObject(dirtyObject)) {
    return dirtyObject;
  }

  // Loop only through own keys
  let keys = Reflect.ownKeys(dirtyObject) as string[];
  for (let key of keys) {
    // Only set the value if the key is not a reserved one
    if (reservedProperties.has(key) || (sanitize && dangerousProperties.has(key) && keepDangerousProperties.indexOf(key) === -1)) {
      continue;
    }

    let value = dirtyObject[key];

    // If the value is an array
    if (Array.isArray(value)) {
      // Init the cleaned object key with an array
      cleanObject[key] = [];

      // Cycle through array items
      for (let i in value) {
        let item = value[i];
        // If item is an array push the result of the sanitized array item value
        if (Array.isArray(item)) {
          (cleanObject[key] as unknown[]).push(sanitizeObjectUtil({ arrayValue: item }, sanitize, keepDangerousProperties, deepLevel).arrayValue);

          // If item is an object push the sanitized item
        } else if (isObject(item)) {
          (cleanObject[key] as unknown[]).push(sanitizeObjectUtil(item, sanitize, keepDangerousProperties, deepLevel));
        } else {
          (cleanObject[key] as unknown[])[i] = item;
        }
      }

      // If the value is an object
    } else if (isObject(value)) {
      // Sanitize the value
      cleanObject[key] = sanitizeObjectUtil(value, sanitize, keepDangerousProperties, deepLevel);

      // Else set the value directly
    } else {
      cleanObject[key] = value;
    }
  }

  // Return the cleaned object
  return cleanObject;
}

export default sanitizeObjectUtil;
