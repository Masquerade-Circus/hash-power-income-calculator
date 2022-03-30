import BaseError from "./base-error";

export default class DatabaseError extends BaseError {
  get statusCode(): number {
    return 500;
  }
}
