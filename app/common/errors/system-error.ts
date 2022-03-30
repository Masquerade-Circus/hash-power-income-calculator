import BaseError from "./base-error";

export default class SystemError extends BaseError {
  get statusCode(): number {
    return 500;
  }
}
