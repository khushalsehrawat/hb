import { api } from "../api.js";
import { auth } from "../auth.js";
import { config } from "../config.js";
import { qs, toast, setBusy } from "../ui.js";

auth.requireGuest();

const form = qs("#loginForm");
const btn = qs("#loginBtn");

const baseUrlInput = qs("#baseUrl");
if (baseUrlInput) baseUrlInput.value = config.getBaseUrl();

qs("#saveBaseUrlBtn")?.addEventListener("click", () => {
  const v = baseUrlInput?.value?.trim();
  config.setBaseUrl(v);
  toast({ title: "Saved", message: `Backend set to ${config.getBaseUrl()}` });
});

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setBusy(btn, true, "Signing in…");
  try {
    const email = qs("#email")?.value?.trim();
    const password = qs("#password")?.value ?? "";
    const res = await api.auth.login({ email, password });
    auth.setSession(res);
    window.location.href = "../app/dashboard.html";
  } catch (err) {
    toast({ title: "Login failed", message: err.message || "Please try again." });
  } finally {
    setBusy(btn, false);
  }
});
