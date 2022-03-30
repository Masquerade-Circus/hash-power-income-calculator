import BaseError from "./base-error";

export default class BadRequestError extends BaseError {
  get statusCode(): number {
    return 400;
  }
}
