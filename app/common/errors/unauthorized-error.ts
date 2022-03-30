import BaseError from "./base-error";

export default class UnauthorizedError extends BaseError {
  get statusCode(): number {
    return 401;
  }
}
