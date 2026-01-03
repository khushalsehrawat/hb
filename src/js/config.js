const STORAGE_PREFIX = "hx:";
const BASE_URL_KEY = `${STORAGE_PREFIX}baseUrl`;

function normalizeBaseUrl(value) {
  const v = String(value || "").trim();
  if (!v) return "";
  return v.replace(/\/+$/, "");
}

export function getBaseUrl() {
  const stored = normalizeBaseUrl(localStorage.getItem(BASE_URL_KEY));
  return stored || "http://localhost:8080";
}

export function setBaseUrl(value) {
  const v = normalizeBaseUrl(value);
  if (!v) {
    localStorage.removeItem(BASE_URL_KEY);
    return;
  }
  localStorage.setItem(BASE_URL_KEY, v);
}

export const config = {
  storagePrefix: STORAGE_PREFIX,
  normalizeBaseUrl,
  getBaseUrl,
  setBaseUrl,
};

