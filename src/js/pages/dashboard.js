import { api } from "../api.js";
import { auth } from "../auth.js";
import { qs, qsa, toast, setBusy, formatDatePretty, escapeHtml } from "../ui.js";
import { wireShell } from "../shell.js";

if (!auth.requireAuth()) {
  throw new Error("Not authenticated");
}
wireShell({ active: "dashboard" });

const state = {
  entry: null,
  habits: [],
  profile: null,
};

function calcCompletion(habits) {
  const total = habits.length;
  const completed = habits.filter((h) => h.completed).length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  return { total, completed, pct };
}

function renderRing() {
  const ring = qs("#hxRing");
  const pctEl = qs("#hxRingPct");
  if (!ring || !pctEl) return;
  const { pct } = calcCompletion(state.entry?.habits || []);
  ring.style.setProperty("--p", String(pct));
  pctEl.textContent = `${pct}%`;
}

function renderToday() {
  const host = qs("#todayHost");
  if (!host) return;

  const entry = state.entry;
  if (!entry) {
    host.innerHTML = `<div class="hx-skeleton" style="height:280px"></div>`;
    return;
  }

  const locked = Boolean(entry.locked);
  qs("#hxTodayDate")?.replaceChildren(document.createTextNode(formatDatePretty(entry.date)));
  qs("#hxLocked")?.classList.toggle("d-none", !locked);

  const tbody = qs("#todayTableBody");
  if (tbody) {
    tbody.innerHTML = entry.habits
      .map((h) => {
        const unit = h.unit ? ` (${escapeHtml(h.unit)})` : "";
        const target = h.targetValue ? `Target: <span class="hx-badge-soft">${h.targetValue}${unit}</span>` : "";
        return `
          <tr data-habit-row="${h.habitId}">
            <td style="width:44px">
              <div class="form-check form-switch m-0">
                <input class="form-check-input" type="checkbox" ${h.completed ? "checked" : ""} ${
                  locked ? "disabled" : ""
                } data-hx-done="${h.habitId}">
              </div>
            </td>
            <td>
              <div class="fw-semibold">${escapeHtml(h.habitTitle)}</div>
              <div class="small text-secondary">${escapeHtml(String(h.category || ""))} ${target}</div>
            </td>
            <td style="width:160px">
              <input class="form-control form-control-sm" type="number" step="1" placeholder="Actual" value="${
                h.actualValue ?? ""
              }" ${locked ? "disabled" : ""} data-hx-actual="${h.habitId}">
            </td>
            <td style="width:260px">
              <input class="form-control form-control-sm" type="text" placeholder="Note" value="${
                h.note ? escapeHtml(h.note) : ""
              }" ${locked ? "disabled" : ""} data-hx-note="${h.habitId}">
            </td>
          </tr>
        `;
      })
      .join("");
  }

  renderRing();
}

function bindTodayTable() {
  qsa("[data-hx-done]").forEach((el) =>
    el.addEventListener("change", () => {
      const id = Number(el.getAttribute("data-hx-done"));
      const row = state.entry?.habits?.find((x) => x.habitId === id);
      if (!row) return;
      row.completed = Boolean(el.checked);
      renderRing();
    }),
  );

  qsa("[data-hx-actual]").forEach((el) =>
    el.addEventListener("input", () => {
      const id = Number(el.getAttribute("data-hx-actual"));
      const row = state.entry?.habits?.find((x) => x.habitId === id);
      if (!row) return;
      const v = el.value === "" ? null : Number(el.value);
      row.actualValue = Number.isFinite(v) ? v : null;
    }),
  );

  qsa("[data-hx-note]").forEach((el) =>
    el.addEventListener("input", () => {
      const id = Number(el.getAttribute("data-hx-note"));
      const row = state.entry?.habits?.find((x) => x.habitId === id);
      if (!row) return;
      row.note = el.value;
    }),
  );
}

async function load() {
  try {
    const [profile, habits, entry] = await Promise.all([api.user.me(), api.habits.list(), api.day.today()]);
    state.profile = profile;
    state.habits = habits;
    state.entry = entry;

    qs("#hxWelcome")?.replaceChildren(document.createTextNode(profile.fullName || "Driver"));
    qs("#hxRole")?.replaceChildren(document.createTextNode(profile.role || "FREE"));
    qs("#hxAutoSave")?.replaceChildren(document.createTextNode(profile.autoSaveTime || "—"));
    qs("#hxTZ")?.replaceChildren(document.createTextNode(profile.timeZoneId || "—"));
    qs("#hxHabitCount")?.replaceChildren(document.createTextNode(String(habits.length)));

    renderToday();
    bindTodayTable();
  } catch (err) {
    if (err.status === 401) {
      auth.logout();
      window.location.href = "../auth/login.html";
      return;
    }
    toast({ title: "Load failed", message: err.message || "Backend not reachable." });
  }
}

const saveBtn = qs("#saveBtn");
saveBtn?.addEventListener("click", async () => {
  if (!state.entry) return;
  setBusy(saveBtn, true, "Saving & locking…");
  try {
    const moodScore = qs("#moodScore")?.value ? Number(qs("#moodScore").value) : null;
    const energyScore = qs("#energyScore")?.value ? Number(qs("#energyScore").value) : null;
    const moodTags = qs("#moodTags")?.value?.trim() || null;
    const journalText = qs("#journalText")?.value?.trim() || null;

    const habits = state.entry.habits.map((h) => ({
      habitId: h.habitId,
      completed: Boolean(h.completed),
      actualValue: h.actualValue === "" ? null : h.actualValue,
      note: h.note || null,
    }));

    const saved = await api.day.saveToday({ habits, moodScore, energyScore, moodTags, journalText });
    state.entry = saved;
    renderToday();
    bindTodayTable();
    toast({ title: "Locked", message: "Today is saved. No edits after this." });
  } catch (err) {
    toast({ title: "Save failed", message: err.message || "Please try again." });
  } finally {
    setBusy(saveBtn, false);
  }
});

const quickPackBtn = qs("#applyPackBtn");
quickPackBtn?.addEventListener("click", async () => {
  const packCode = qs("#packCode")?.value?.trim();
  if (!packCode) return toast({ title: "Pack code required", message: "Pick a lifestyle pack first." });
  setBusy(quickPackBtn, true, "Applying…");
  try {
    await api.onboarding.applyPack(packCode);
    toast({ title: "Applied", message: "Pack habits added to your garage." });
    await load();
  } catch (err) {
    toast({ title: "Apply failed", message: err.message || "Try again." });
  } finally {
    setBusy(quickPackBtn, false);
  }
});

async function loadPacks() {
  try {
    const packs = await api.onboarding.packs();
    const sel = qs("#packCode");
    if (!sel) return;
    sel.innerHTML =
      `<option value="">Choose pack…</option>` +
      packs.map((p) => `<option value="${p.code}">${escapeHtml(p.name)} (${escapeHtml(p.code)})</option>`).join("");
  } catch {
    // ignore
  }
}

loadPacks();
load();

