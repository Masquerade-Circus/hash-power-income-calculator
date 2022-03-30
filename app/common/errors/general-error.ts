import BaseError from "./base-error";

export default class GeneralError extends BaseError {
  get statusCode(): number {
    return 400;
  }
}
