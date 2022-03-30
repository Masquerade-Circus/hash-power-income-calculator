import SystemError from "./errors/system-error";

SystemError;

/* eslint-disable @typescript-eslint/ban-types */
export function isString(value?: unknown): value is string {
  return typeof value === "string";
}

export function isNumber(value?: unknown): value is number {
  return typeof value === "number";
}

// The value is a positive integer or zero
export function isPositiveNumber(value?: unknown): value is number {
  return isNumber(value) && value >= 0;
}

export function isNegativeNumber(value?: unknown): value is number {
  return isNumber(value) && value < 0;
}

export function isNumberLessThan(value: number, max: number): boolean {
  // Validate that value is a number
  if (!isNumber(value)) {
    throw new SystemError(`'value' should be a number`);
  }

  // Validate that max is a number
  if (!isNumber(max)) {
    throw new SystemError(`'max' should be a number`);
  }

  return value < max;
}

export function isNumberMoreThan(value: number, min: number): boolean {
  // Validate that value is a number
  if (!isNumber(value)) {
    throw new SystemError(`'value' should be a number`);
  }

  // Validate that min is a number
  if (!isNumber(min)) {
    throw new SystemError(`'min' should be a number`);
  }

  return value > min;
}

export function isNumberEqualTo(value: number, value2: number): boolean {
  // Validate that value is a number
  if (!isNumber(value)) {
    throw new SystemError(`'value' should be a number`);
  }

  // Validate that value2 is a number
  if (!isNumber(value2)) {
    throw new SystemError(`'value2' should be a number`);
  }

  return value === value2;
}

export function isNumberLessThanOrEqualTo(value: number, max: number): boolean {
  return isNumberEqualTo(value, max) || isNumberLessThan(value, max);
}

export function isNumberMoreThanOrEqualTo(value: number, min: number): boolean {
  return isNumberEqualTo(value, min) || isNumberMoreThan(value, min);
}

export function isBoolean(value?: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isObject(value?: unknown): value is Record<string | number | symbol, unknown> {
  // Check primitive type
  return (
    typeof value === "object" &&
    // Check if value is not null
    value !== null &&
    // Check if value is not an array
    !Array.isArray(value) &&
    // Check if value is not an instance of a class by using the constructor property
    value.constructor === Object
  );
}

export function isArray<T>(value?: unknown): value is T[] {
  return Array.isArray(value);
}

export function isFunction(value?: unknown): value is Function {
  return typeof value === "function";
}

export function hasLength(value: string | unknown[], length: number): value is string | unknown[] {
  // Validate length param is a number
  if (!isNumber(length)) {
    throw new SystemError('"length" should be a number');
  }

  // Validate length param is a positive number
  if (isNegativeNumber(length)) {
    throw new SystemError('"length" should be a positive number');
  }

  // Validate value param is a string or array
  if (!isString(value) && !isArray(value)) {
    throw new SystemError('"value" should be a string or array');
  }

  // Validate value param is not an empty string or array
  return value.length === length;
}

export function hasMinLength(value: string | unknown[], minLength: number): value is string | unknown[] {
  // Validate minLength param is a number
  if (!isNumber(minLength)) {
    throw new SystemError('"minLength" should be a number');
  }

  // Validate minLength param is a positive number
  if (isNegativeNumber(minLength)) {
    throw new SystemError('"minLength" should be a positive number');
  }

  // Validate value param is a string or array
  if (!isString(value) && !isArray(value)) {
    throw new SystemError('"value" should be a string or array');
  }

  // Validate value param is not an empty string or array
  return value.length >= minLength;
}

export function hasMaxLength(value: string | unknown[], maxLength: number): value is string | unknown[] {
  // Validate maxLength param is a number
  if (!isNumber(maxLength)) {
    throw new SystemError('"maxLength" should be a number');
  }

  // Validate maxLength param is a positive number
  if (isNegativeNumber(maxLength)) {
    throw new SystemError('"maxLength" should be a positive number');
  }

  // Validate value param is a string or array
  if (!isString(value) && !isArray(value)) {
    throw new SystemError('"value" should be a string or array');
  }

  // Validate value param is not an empty string or array
  return value.length <= maxLength;
}

export function isEmpty(value?: unknown): value is string | unknown[] | object {
  if (isString(value)) {
    return value.length === 0;
  } else if (isArray(value)) {
    return value.length === 0;
  } else if (isObject(value)) {
    return Object.keys(value).length === 0;
  } else if (value === undefined || value === null) {
    return true;
  }

  return false;
}

export function matchesPattern(value: string, pattern: RegExp): value is string {
  // Validate value param is a string
  if (!isString(value)) {
    throw new SystemError('"value" should be a string');
  }

  // Validate pattern param is a RegExp
  if (!(pattern instanceof RegExp)) {
    throw new SystemError('"pattern" should be a RegExp');
  }

  return pattern.test(value);
}

export function isBetween(value: number, min: number, max: number): value is number {
  // Validate min param is a number
  if (!isNumber(min)) {
    throw new SystemError('"min" should be a number');
  }

  // Validate max param is a number
  if (!isNumber(max)) {
    throw new SystemError('"max" should be a number');
  }

  // Validate min param is less than max param
  if (min > max) {
    throw new SystemError('"min" should be less than "max"');
  }

  // Validate value param is a number
  if (!isNumber(value)) {
    throw new SystemError('"value" should be a number');
  }

  return value >= min && value <= max;
}

export function isOneOf<T>(value: unknown, values: unknown): value is T {
  // Validate values is an enum of values
  if (!isObject(values)) {
    throw new SystemError('"values" should be an enum');
  }

  // Validate value is one of the values
  return Object.values(values).includes(value);
}

export function hasProperty<T>(value: unknown, property: string): value is Object & Record<T extends string ? T : never, unknown> {
  // Validate value is an object
  if (!isObject(value)) {
    throw new SystemError('"value" should be an object');
  }

  // Validate property is a string
  if (!isString(property)) {
    throw new SystemError('"property" should be a string');
  }

  return property in value && typeof value[property] !== "undefined";
}

export function is<T>(value: unknown, type: new (...args: unknown[]) => T): value is T {
  // Validate value is an instance of the type
  return value instanceof type;
}

export function isEqual(value: unknown, value2: unknown): boolean {
  return value === value2;
}

export function removeEmpty<T>(value: unknown): T {
  if (!isObject(value)) {
    throw new SystemError('"value" should be an object');
  }

  let newValue = {} as T;

  for (const key in value) {
    if (isArray(value[key]) || isObject(value[key])) {
      newValue[key] = removeEmpty(value[key]);
    } else if (!isEmpty(value[key])) {
      newValue[key] = value[key];
    }
  }

  return newValue;
}

export function replaceEmpty<T>(value: unknown, replacement: unknown): T {
  if (!isObject(value)) {
    throw new SystemError('"value" should be an object');
  }

  let newValue = {} as T;

  for (const key in value) {
    if (isArray(value[key]) || isObject(value[key])) {
      newValue[key] = replaceEmpty(value[key], replacement);
    } else if (isEmpty(value[key])) {
      newValue[key] = replacement;
    } else {
      newValue[key] = value[key];
    }
  }

  return newValue;
}

export function isNull(value: unknown): value is null {
  return value === null;
}
