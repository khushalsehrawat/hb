import { config } from "./config.js";
import { storage } from "./storage.js";
import { endpoints } from "./endpoints.js";

function extractErrorMessage(payload) {
  if (!payload) return null;
  if (typeof payload === "string") return payload;
  if (typeof payload.message === "string" && payload.message.trim()) return payload.message;
  return null;
}

async function request(path, { method = "GET", query, body, auth = true, headers = {} } = {}) {
  const base = config.getBaseUrl();
  const url = new URL(`${base}${path.startsWith("/") ? "" : "/"}${path}`);

  if (query && typeof query === "object") {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  const h = new Headers(headers);
  if (!h.has("Accept")) h.set("Accept", "application/json");

  if (auth) {
    const token = storage.get("accessToken");
    if (token) h.set("Authorization", `Bearer ${token}`);
  }

  let payloadBody = undefined;
  if (body !== undefined) {
    h.set("Content-Type", "application/json");
    payloadBody = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url, { method, headers: h, body: payloadBody });
  } catch (cause) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const msg =
      `Cannot reach backend (${base}). ` +
      `If you opened the site via file:// or a different port (example: http://127.0.0.1:5500), make sure the backend allows your origin in CORS. ` +
      (origin ? `Current origin: ${origin}. ` : "") +
      `Original error: ${cause?.message || String(cause)}`;
    const err = new Error(msg);
    err.status = 0;
    err.cause = cause;
    throw err;
  }
  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

  if (!res.ok) {
    const msg = extractErrorMessage(payload) || `${res.status} ${res.statusText}`.trim();
    const err = new Error(msg);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return payload;
}

function formatLocalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatLocalDateTime(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}`;
}

export const api = {
  request,
  formatLocalDate,
  formatLocalDateTime,
  endpoints,

  auth: {
    register(payload) {
      return request(endpoints.auth.register(), { method: "POST", body: payload, auth: false });
    },
    login(payload) {
      return request(endpoints.auth.login(), { method: "POST", body: payload, auth: false });
    },
  },

  user: {
    me() {
      return request(endpoints.user.me());
    },
    updateName(fullName) {
      return request(endpoints.user.updateName(), { method: "PUT", body: { fullName } });
    },
    updateAutoSaveTime(autoSaveTime) {
      return request(endpoints.user.updateAutoSaveTime(), { method: "PUT", body: { autoSaveTime } });
    },
    updateTimezone(timeZoneId) {
      return request(endpoints.user.updateTimezone(), { method: "PUT", body: { timeZoneId } });
    },
  },

  habits: {
    list() {
      return request(endpoints.habits.list());
    },
    byCategory(category) {
      return request(endpoints.habits.byCategory(), { query: { category } });
    },
    create(habit) {
      return request(endpoints.habits.create(), { method: "POST", body: habit });
    },
    update(id, habit) {
      return request(endpoints.habits.update(id), { method: "PUT", body: habit });
    },
    deactivate(id) {
      return request(endpoints.habits.deactivate(id), { method: "DELETE" });
    },
  },

  day: {
    today() {
      return request(endpoints.day.today());
    },
    saveToday(payload) {
      return request(endpoints.day.saveToday(), { method: "POST", body: payload });
    },
    month(year, month) {
      return request(endpoints.day.month(year, month));
    },
    byDate(dateIso) {
      return request(endpoints.day.byDate(), { query: { date: dateIso } });
    },
  },

  stats: {
    dailyRange(startDateIso, endDateIso) {
      return request(endpoints.stats.dailyRange(), { query: { startDate: startDateIso, endDate: endDateIso } });
    },
    monthly(year, month) {
      return request(endpoints.stats.monthly(year, month));
    },
    categories(year, month) {
      return request(endpoints.stats.categories(year, month));
    },
    streaks() {
      return request(endpoints.stats.streaks());
    },
  },

  reminders: {
    getSettings() {
      return request(endpoints.reminders.settings());
    },
    updateSettings(payload) {
      return request(endpoints.reminders.settings(), { method: "PUT", body: payload });
    },
  },

  exportAi: {
    exportMonth(year, month) {
      return request(endpoints.exportAi.exportMonth(year, month));
    },
    monthlyPrompt(year, month) {
      return request(endpoints.exportAi.monthlyPrompt(year, month));
    },
  },

  focus: {
    start(payload) {
      return request(endpoints.focus.start(), { method: "POST", body: payload });
    },
    end(sessionId, payload) {
      return request(endpoints.focus.end(sessionId), { method: "POST", body: payload });
    },
    addDistraction(sessionId, payload) {
      return request(endpoints.focus.addDistraction(sessionId), { method: "POST", body: payload });
    },
    byDate(dateIso) {
      return request(endpoints.focus.byDate(), { query: { date: dateIso } });
    },
    range(startDateTimeIso, endDateTimeIso) {
      return request(endpoints.focus.range(), { query: { start: startDateTimeIso, end: endDateTimeIso } });
    },
  },

  badges: {
    my() {
      return request(endpoints.badges.my());
    },
  },

  subscriptions: {
    plans() {
      return request(endpoints.subscriptions.plans());
    },
    my() {
      return request(endpoints.subscriptions.my());
    },
    activate(payload) {
      return request(endpoints.subscriptions.activate(), { method: "POST", body: payload });
    },
  },

  payments: {
    create(payload) {
      return request(endpoints.payments.create(), { method: "POST", body: payload });
    },
    success(payload) {
      return request(endpoints.payments.success(), { method: "POST", body: payload });
    },
    failure(payload) {
      return request(endpoints.payments.failure(), { method: "POST", body: payload });
    },
  },

  onboarding: {
    packs() {
      return request(endpoints.onboarding.packs());
    },
    applyPack(packCode) {
      return request(endpoints.onboarding.applyPack(), { method: "POST", body: { packCode } });
    },
  },
};
