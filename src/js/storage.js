import { config } from "./config.js";

const k = (key) => `${config.storagePrefix}${key}`;

export const storage = {
  get(key, fallback = null) {
    const raw = localStorage.getItem(k(key));
    if (raw == null) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(k(key), JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(k(key));
  },
  clearAll() {
    Object.keys(localStorage)
      .filter((x) => x.startsWith(config.storagePrefix))
      .forEach((x) => localStorage.removeItem(x));
  },
};

