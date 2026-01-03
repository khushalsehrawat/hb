import { api } from "./api.js";
import { config } from "./config.js";

function nowYm() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function runDiagnostics() {
  const { year, month } = nowYm();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth(year, month)).padStart(2, "0")}`;

  async function probeReachable() {
    const base = config.getBaseUrl().replace(/\/+$/, "");
    const url = `${base}/`;
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 2500);
    try {
      await fetch(url, { method: "GET", signal: ctl.signal });
      return true;
    } finally {
      clearTimeout(t);
    }
  }

  const checks = [
    { name: "Backend reachable (any HTTP)", run: () => probeReachable() },

    { name: "Auth required: Profile", run: () => api.user.me() },
    { name: "Habits: List", run: () => api.habits.list() },
    { name: "Habits: By category", run: () => api.habits.byCategory("HEALTH") },

    { name: "Day: Today", run: () => api.day.today() },
    { name: "Day: Month entries", run: () => api.day.month(year, month) },

    { name: "Stats: Streaks", run: () => api.stats.streaks() },
    { name: "Stats: Monthly summary", run: () => api.stats.monthly(year, month) },
    { name: "Stats: Category breakdown", run: () => api.stats.categories(year, month) },
    { name: "Stats: Daily range", run: () => api.stats.dailyRange(start, end) },

    { name: "Reminders: Settings", run: () => api.reminders.getSettings() },
    { name: "Badges: My badges", run: () => api.badges.my() },

    { name: "Subscriptions: Plans", run: () => api.subscriptions.plans() },
    { name: "Subscriptions: My subscription", run: () => api.subscriptions.my() },

    { name: "Onboarding: Packs", run: () => api.onboarding.packs() },

    { name: "Focus: Sessions by date", run: () => api.focus.byDate(todayIso()) },

    { name: "Export: Month text", run: () => api.exportAi.exportMonth(year, month) },
    { name: "AI: Monthly prompt", run: () => api.exportAi.monthlyPrompt(year, month) },
  ];

  const results = [];
  for (const c of checks) {
    const t0 = performance.now();
    try {
      await c.run();
      results.push({ name: c.name, ok: true, ms: Math.round(performance.now() - t0) });
    } catch (e) {
      results.push({
        name: c.name,
        ok: false,
        ms: Math.round(performance.now() - t0),
        message: e?.message || String(e),
        baseUrl: config.getBaseUrl(),
      });
    }
  }
  return results;
}
