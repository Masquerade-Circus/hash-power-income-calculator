/* eslint-disable @typescript-eslint/no-explicit-any */
const Key = "hash-power-income-calculator";
export class StorageService {
  db: Storage;
  constructor() {
    this.db = window.localStorage || window.sessionStorage;
  }

  private getDb(): Record<string | number | symbol, any> {
    let obj;

    try {
      obj = JSON.parse(this.db.getItem(Key) || "{}");
    } catch (e) {
      obj = {};
    }
    return obj;
  }

  get(key: string, fallback = null): any | null {
    let result = this.getDb();

    let parsed = key.split(".");
    let next;

    while (parsed.length) {
      next = parsed.shift();
      if (next in result === false || (parsed.length > 0 && typeof result[next] !== "object")) {
        return fallback;
      }

      result = result[next];
    }

    return result === null || typeof result === "undefined" ? fallback : result;
  }

  set(key: string, value: any) {
    let result = this.getDb();
    let finalResult = result;

    let parsed = key.split(".");
    let next: string | number;

    while (parsed.length) {
      next = parsed.shift();
      if (next in result === false || (parsed.length > 0 && typeof result[next] !== "object")) {
        result[next] = {};
      }

      if (parsed.length === 0) {
        if (value === null) {
          delete result[next];
        } else {
          result[next] = value;
        }
      }

      result = result[next];
    }

    this.db.setItem(Key, JSON.stringify(finalResult));
  }
}

export const storageService = new StorageService();
