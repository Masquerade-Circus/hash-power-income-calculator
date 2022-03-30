import BaseError from "./errors/base-error";
import sanitizeObjectUtil from "./sanitize-object-util";

export type Result<T, E> = Ok<T, never> | Err<never, E>;

export type Results = Result<unknown, BaseError>[];

export class Ok<T, E> {
  constructor(private value: T) {}
  isOk(): this is Ok<T, never> {
    return true;
  }

  isErr(): this is Err<never, E> {
    return false;
  }

  unwrap(): T {
    return this.value;
  }

  unwrapErr(): never {
    throw new Error("Called `unwrapErr()` on an `Ok` value.");
  }

  toJSON(sanitize?: boolean, keepDangerousProperties?: string[]): Record<string, unknown> {
    return sanitizeObjectUtil(JSON.parse(JSON.stringify(this.value)), sanitize, keepDangerousProperties) as Record<string, unknown>;
  }
}

export class Err<T, E> {
  constructor(private readonly error: E) {}

  isOk(): this is Ok<T, never> {
    return false;
  }

  isErr(): this is Err<never, E> {
    return true;
  }

  unwrap(): never {
    throw new Error("Called `unwrap()` on an `Err` value.");
  }

  unwrapErr(): E {
    return this.error;
  }

  toJSON(): Record<string, unknown> {
    return sanitizeObjectUtil(JSON.parse(JSON.stringify(this.error)), true) as Record<string, unknown>;
  }
}

// Utility functions
export function ok<T>(value: T): Ok<T, never> {
  return new Ok(value);
}

export function err<E>(err: E): Err<never, E> {
  return new Err(err);
}

export function combine(results: Results): Result<unknown | Results, BaseError> {
  for (let result of results) {
    if (result.isErr()) {
      return result;
    }
  }
  return ok(results);
}
