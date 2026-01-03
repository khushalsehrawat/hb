import { api } from "../api.js";
import { auth } from "../auth.js";
import { config } from "../config.js";
import { runDiagnostics } from "../diagnostics.js";
import { qs, toast, setBusy, escapeHtml } from "../ui.js";
import { wireShell } from "../shell.js";

if (!auth.requireAuth()) throw new Error("Not authenticated");
wireShell({ active: "settings" });

const baseUrlInput = qs("#baseUrl");
if (baseUrlInput) baseUrlInput.value = config.getBaseUrl();
qs("#diagBaseUrl")?.replaceChildren(document.createTextNode(config.getBaseUrl()));

qs("#baseUrlSaveBtn")?.addEventListener("click", () => {
  const v = baseUrlInput?.value?.trim();
  config.setBaseUrl(v);
  const b = config.getBaseUrl();
  qs("#diagBaseUrl")?.replaceChildren(document.createTextNode(b));
  toast({ title: "Saved", message: `Backend set to ${b}` });
});

function renderDiag(results) {
  const host = qs("#diagHost");
  if (!host) return;
  if (!results?.length) {
    host.innerHTML = `<div class="text-secondary">No results yet.</div>`;
    return;
  }
  host.innerHTML = `
    <div class="table-responsive">
      <table class="table hx-table align-middle">
        <thead>
          <tr class="text-secondary small">
            <th style="width:120px">Status</th>
            <th>Check</th>
            <th style="width:100px">Time</th>
          </tr>
        </thead>
        <tbody>
          ${results
            .map((r) => {
              const badge = r.ok
                ? `<span class="hx-badge-soft" style="background:rgba(124,247,213,.35)">OK</span>`
                : `<span class="hx-badge-soft" style="background:rgba(255,61,110,.18)">FAIL</span>`;
              const detail = r.ok ? "" : `<div class="text-secondary small mt-1">${escapeHtml(r.message || "")}</div>`;
              return `
                <tr>
                  <td>${badge}</td>
                  <td class="fw-semibold">${escapeHtml(r.name)}${detail}</td>
                  <td class="text-secondary">${escapeHtml(String(r.ms ?? "—"))}ms</td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

const runBtn = qs("#runDiagBtn");
runBtn?.addEventListener("click", async () => {
  setBusy(runBtn, true, "Running…");
  try {
    qs("#diagBaseUrl")?.replaceChildren(document.createTextNode(config.getBaseUrl()));
    const results = await runDiagnostics();
    renderDiag(results);
    const failed = results.filter((r) => !r.ok).length;
    toast({
      title: failed ? "Diagnostics finished (with failures)" : "Diagnostics finished",
      message: failed ? `${failed} check(s) failed. Open details in the table.` : "All checks passed.",
    });
  } catch (err) {
    toast({ title: "Diagnostics failed", message: err.message || "Try again." });
  } finally {
    setBusy(runBtn, false);
  }
});

async function load() {
  try {
    const [profile, reminder, plans, mySub, badges] = await Promise.all([
      api.user.me(),
      api.reminders.getSettings(),
      api.subscriptions.plans().catch(() => []),
      api.subscriptions.my().catch(() => null),
      api.badges.my().catch(() => []),
    ]);

    qs("#fullName").value = profile.fullName || "";
    qs("#timeZoneId").value = profile.timeZoneId || "";
    qs("#autoSaveTime").value = profile.autoSaveTime || "23:00";

    qs("#rem_enabled").checked = Boolean(reminder.enabled);
    qs("#rem_time").value = reminder.autoSaveTime || profile.autoSaveTime || "23:00";
    qs("#rem_before").value = reminder.reminderBeforeMinutes ?? 30;
    qs("#rem_channels").value = reminder.channels || "IN_APP";

    qs("#subNow")?.replaceChildren(document.createTextNode(mySub?.planName ? `${mySub.planName} (${mySub.status})` : "FREE"));
    renderPlans(plans);
    renderBadges(badges);
  } catch (err) {
    if (err.status === 401) {
      auth.logout();
      window.location.href = "../auth/login.html";
      return;
    }
    toast({ title: "Settings failed", message: err.message || "Backend not reachable." });
  }
}

function renderPlans(plans) {
  const host = qs("#plansHost");
  if (!host) return;
  if (!plans.length) {
    host.innerHTML = `<div class="text-secondary">No plans available.</div>`;
    return;
  }
  host.innerHTML = plans
    .map(
      (p) => `
    <div class="col-12">
      <div class="hx-card p-4 hx-border-grad">
        <div class="d-flex justify-content-between align-items-start gap-3">
          <div>
            <div class="fw-semibold">${escapeHtml(p.name)}</div>
            <div class="text-secondary small">${escapeHtml(p.description || "")}</div>
            <div class="mt-2">
              <span class="hx-badge-soft">${escapeHtml(String(p.price))} ${escapeHtml(p.currency)}</span>
              <span class="hx-badge-soft ms-2">${escapeHtml(String(p.durationDays))} days</span>
            </div>
          </div>
          <button class="btn hx-btn hx-btn-primary btn-sm" data-hx-activate="${escapeHtml(p.code)}">Activate</button>
        </div>
      </div>
    </div>
  `,
    )
    .join("");

  host.querySelectorAll("[data-hx-activate]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const planCode = btn.getAttribute("data-hx-activate");
      if (!planCode) return;
      setBusy(btn, true, "Activating…");
      try {
        await api.subscriptions.activate({ planCode, durationDays: 30 });
        toast({ title: "Activated", message: "Subscription activated." });
        await load();
      } catch (err) {
        toast({ title: "Activate failed", message: err.message || "Try again." });
      } finally {
        setBusy(btn, false);
      }
    });
  });
}

function renderBadges(items) {
  const host = qs("#badgesHost");
  if (!host) return;
  if (!items.length) {
    host.innerHTML = `<div class="text-secondary">No badges yet. Keep winning days.</div>`;
    return;
  }
  host.innerHTML = items
    .map(
      (b) => `
    <div class="col-12">
      <div class="hx-card p-3">
        <div class="d-flex justify-content-between align-items-start gap-3">
          <div>
            <div class="fw-semibold">${escapeHtml(b.name)}</div>
            <div class="text-secondary small">${escapeHtml(b.description || "")}</div>
            <div class="mt-2">
              <span class="hx-badge-soft">${escapeHtml(b.type)}</span>
              <span class="hx-badge-soft ms-2">${escapeHtml(String(b.currentProgress ?? 0))} / ${escapeHtml(String(b.thresholdValue ?? "—"))}</span>
            </div>
          </div>
          <div class="hx-chip">${b.completed ? "Achieved" : "In progress"}</div>
        </div>
      </div>
    </div>
  `,
    )
    .join("");
}

qs("#profileForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = qs("#profileSaveBtn");
  setBusy(btn, true, "Saving…");
  try {
    await api.user.updateName(qs("#fullName")?.value?.trim());
    await api.user.updateAutoSaveTime(qs("#autoSaveTime")?.value);
    await api.user.updateTimezone(qs("#timeZoneId")?.value);
    toast({ title: "Saved", message: "Profile updated." });
    await load();
  } catch (err) {
    toast({ title: "Save failed", message: err.message || "Try again." });
  } finally {
    setBusy(btn, false);
  }
});

qs("#reminderForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = qs("#remSaveBtn");
  setBusy(btn, true, "Updating…");
  try {
    await api.reminders.updateSettings({
      autoSaveTime: qs("#rem_time")?.value,
      reminderBeforeMinutes: Number(qs("#rem_before")?.value || 0),
      channels: qs("#rem_channels")?.value?.trim() || null,
      enabled: Boolean(qs("#rem_enabled")?.checked),
    });
    toast({ title: "Updated", message: "Reminder settings saved." });
  } catch (err) {
    toast({ title: "Update failed", message: err.message || "Try again." });
  } finally {
    setBusy(btn, false);
  }
});

load();
