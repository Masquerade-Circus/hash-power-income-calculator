import BaseError from "./base-error";

export default class NotFoundError extends BaseError {
  get statusCode(): number {
    return 404;
  }
}
