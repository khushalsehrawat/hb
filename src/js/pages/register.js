import { api } from "../api.js";
import { auth } from "../auth.js";
import { config } from "../config.js";
import { qs, toast, setBusy } from "../ui.js";

auth.requireGuest();

const form = qs("#registerForm");
const btn = qs("#registerBtn");

function guessTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
  } catch {
    return "Asia/Kolkata";
  }
}

const tz = qs("#timeZoneId");
if (tz) tz.value = guessTimeZone();

const baseUrlInput = qs("#baseUrl");
if (baseUrlInput) baseUrlInput.value = config.getBaseUrl();

qs("#saveBaseUrlBtn")?.addEventListener("click", () => {
  const v = baseUrlInput?.value?.trim();
  config.setBaseUrl(v);
  toast({ title: "Saved", message: `Backend set to ${config.getBaseUrl()}` });
});

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setBusy(btn, true, "Creating account…");
  try {
    const payload = {
      fullName: qs("#fullName")?.value?.trim(),
      email: qs("#email")?.value?.trim(),
      password: qs("#password")?.value ?? "",
      autoSaveTime: qs("#autoSaveTime")?.value || "23:00",
      timeZoneId: qs("#timeZoneId")?.value || guessTimeZone(),
    };
    const res = await api.auth.register(payload);
    auth.setSession(res);
    window.location.href = "../app/dashboard.html";
  } catch (err) {
    toast({ title: "Registration failed", message: err.message || "Please try again." });
  } finally {
    setBusy(btn, false);
  }
});
