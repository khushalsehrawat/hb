export const endpoints = {
  health: {
    root: () => "/",
  },

  auth: {
    register: () => "/auth/register",
    login: () => "/auth/login",
  },

  user: {
    me: () => "/api/user/me",
    updateName: () => "/api/user/name",
    updateAutoSaveTime: () => "/api/user/auto-save-time",
    updateTimezone: () => "/api/user/timezone",
  },

  habits: {
    list: () => "/api/habits",
    byCategory: () => "/api/habits/by-category",
    create: () => "/api/habits",
    update: (id) => `/api/habits/${id}`,
    deactivate: (id) => `/api/habits/${id}`,
  },

  day: {
    today: () => "/api/day/today",
    saveToday: () => "/api/day/today/save",
    month: (year, month) => `/api/day/month/${year}/${month}`,
    byDate: () => "/api/day/by-date",
  },

  stats: {
    dailyRange: () => "/api/stats/daily",
    monthly: (year, month) => `/api/stats/monthly/${year}/${month}`,
    categories: (year, month) => `/api/stats/categories/${year}/${month}`,
    streaks: () => "/api/stats/streaks",
  },

  reminders: {
    settings: () => "/api/reminders/settings",
  },

  exportAi: {
    exportMonth: (year, month) => `/api/export/month/${year}/${month}`,
    monthlyPrompt: (year, month) => `/api/ai/monthly-prompt/${year}/${month}`,
  },

  focus: {
    start: () => "/api/focus/start",
    end: (sessionId) => `/api/focus/${sessionId}/end`,
    addDistraction: (sessionId) => `/api/focus/${sessionId}/distractions`,
    byDate: () => "/api/focus/by-date",
    range: () => "/api/focus/range",
  },

  badges: {
    my: () => "/api/badges/my",
  },

  subscriptions: {
    plans: () => "/api/subscriptions/plans",
    my: () => "/api/subscriptions/my",
    activate: () => "/api/subscriptions/activate",
  },

  payments: {
    create: () => "/api/payments/create",
    success: () => "/api/payments/success",
    failure: () => "/api/payments/failure",
  },

  onboarding: {
    packs: () => "/api/onboarding/packs",
    applyPack: () => "/api/onboarding/apply-pack",
  },
};

