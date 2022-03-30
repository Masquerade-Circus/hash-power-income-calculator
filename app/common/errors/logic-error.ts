import BaseError from "./base-error";

export default class LogicError extends BaseError {
  get statusCode(): number {
    return 400;
  }
}
