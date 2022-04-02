import { Result, err } from "./result";

/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import LogicError from "./errors/logic-error";
import sanitizeObjectUtil from "./sanitize-object-util";

class BaseClass<T> {
  readonly value: T;

  constructor(value: unknown) {
    this.value = this.validate(value);
  }

  validate(value: unknown): T {
    return value as T;
  }

  toString(): string {
    return String(this.value);
  }

  toJSON(sanitize = false, keep: string[] = []): T {
    return sanitizeObjectUtil(JSON.parse(JSON.stringify(this.value)), sanitize, keep) as T;
  }

  static create(
    value: unknown,
    ...args: unknown[]
  ): Result<unknown, LogicError> | Promise<Result<unknown, LogicError>> {
    return err(new LogicError("Method not implemented"));
  }
}

export default BaseClass;
