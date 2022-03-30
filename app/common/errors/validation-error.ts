import BaseError from "./base-error";

export default class ValidationError extends BaseError {
  get statusCode(): number {
    return 422;
  }
}
