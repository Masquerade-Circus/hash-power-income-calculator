export default class BaseError extends Error {
  readonly cause?: Error;
  readonly code?: string;
  readonly reference?: string;
  readonly value?: unknown;

  get statusCode(): number {
    return 500;
  }

  constructor(message: string, options: { cause?: Error; code?: string; reference?: string; value?: unknown } = {}) {
    super(message);
    if (typeof options === "object" && options !== null) {
      if ("cause" in options) {
        const cause = options.cause;
        this.cause = cause;
        if ("stack" in cause) {
          this.stack = this.stack + "\nCAUSE: " + cause.stack;
        }
      }
      this.code = options.code;
      this.reference = options.reference;
      this.value = options.value;
    }
  }

  toErrorCode(): string {
    // Converts PascalCase to snake_case
    return this.constructor.name
      .replace(/\.?([A-Z]+)/g, (match: string) => {
        return `_${match.toLowerCase()}`;
      })
      .replace(/^_/, "");
  }

  get name(): string {
    return this.getName();
  }

  getName(): string {
    return this.constructor.name;
  }
}
