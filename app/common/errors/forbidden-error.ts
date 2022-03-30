import BaseError from "./base-error";

export default class ForbiddenError extends BaseError {
  get statusCode(): number {
    return 403;
  }
}
