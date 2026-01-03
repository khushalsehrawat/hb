import { api } from "../api.js";
import { auth } from "../auth.js";
import { qs, qsa, toast, setBusy, escapeHtml } from "../ui.js";
import { wireShell } from "../shell.js";

if (!auth.requireAuth()) throw new Error("Not authenticated");
wireShell({ active: "habits" });

const state = { habits: [] };

function render() {
  const host = qs("#habitsHost");
  if (!host) return;
  if (!state.habits.length) {
    host.innerHTML = `
      <div class="hx-card p-4">
        <div class="fw-semibold">No habits yet.</div>
        <div class="text-secondary">Create one, or apply a lifestyle pack from the Dashboard.</div>
      </div>
    `;
    return;
  }

  host.innerHTML = state.habits
    .map((h) => {
      const freq =
        h.frequencyType === "DAILY"
          ? "Daily"
          : h.frequencyType === "X_PER_WEEK"
            ? `${h.frequencyValue ?? "X"} / week`
            : h.frequencyType === "X_PER_MONTH"
              ? `${h.frequencyValue ?? "X"} / month`
              : h.frequencyType === "SPECIFIC_DAYS_OF_WEEK"
                ? `Days: ${escapeHtml(h.daysOfWeek || "")}`
                : escapeHtml(h.frequencyType || "");
      const unit = h.unit ? ` ${escapeHtml(h.unit)}` : "";
      const target = h.targetValue ? `${h.targetValue}${unit}` : "—";
      return `
        <div class="hx-card p-4 hx-border-grad">
          <div class="d-flex justify-content-between align-items-start gap-3">
            <div>
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <div class="fw-semibold">${escapeHtml(h.title)}</div>
                <span class="hx-badge-soft">${escapeHtml(h.category)}</span>
                <span class="hx-badge-soft">${escapeHtml(h.type)}</span>
              </div>
              <div class="text-secondary small mt-1">${escapeHtml(h.description || "—")}</div>
            </div>
            <div class="d-flex gap-2">
              <button class="btn hx-btn hx-btn-ghost btn-sm" data-hx-edit="${h.id}">
                <i class="bi bi-sliders2"></i>
              </button>
              <button class="btn hx-btn btn-outline-danger btn-sm" data-hx-del="${h.id}">
                <i class="bi bi-trash3"></i>
              </button>
            </div>
          </div>
          <div class="hx-mini-divider my-3"></div>
          <div class="row g-3">
            <div class="col-sm-6 col-lg-4"><div class="hx-kpi"><div class="n">${escapeHtml(freq)}</div><div class="l">Frequency</div></div></div>
            <div class="col-sm-6 col-lg-4"><div class="hx-kpi"><div class="n">${escapeHtml(target)}</div><div class="l">Target</div></div></div>
            <div class="col-sm-6 col-lg-4"><div class="hx-kpi"><div class="n">${escapeHtml(h.active ? "Active" : "Off")}</div><div class="l">Status</div></div></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function bind() {
  qsa("[data-hx-del]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const id = Number(btn.getAttribute("data-hx-del"));
      if (!Number.isFinite(id)) return;
      if (!confirm("Deactivate this habit? (history stays)")) return;
      try {
        await api.habits.deactivate(id);
        toast({ title: "Deactivated", message: "Habit removed from active tracking." });
        await load();
      } catch (err) {
        toast({ title: "Failed", message: err.message || "Try again." });
      }
    }),
  );

  qsa("[data-hx-edit]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = Number(btn.getAttribute("data-hx-edit"));
      const habit = state.habits.find((h) => h.id === id);
      if (!habit) return;
      openHabitModal(habit);
    }),
  );
}

function getHabitPayloadFromForm() {
  const frequencyType = qs("#h_frequencyType")?.value;
  const payload = {
    title: qs("#h_title")?.value?.trim(),
    description: qs("#h_description")?.value?.trim() || null,
    category: qs("#h_category")?.value,
    type: qs("#h_type")?.value,
    frequencyType,
    frequencyValue: null,
    daysOfWeek: null,
    targetValue: qs("#h_targetValue")?.value ? Number(qs("#h_targetValue").value) : null,
    unit: qs("#h_unit")?.value?.trim() || null,
  };

  if (frequencyType === "X_PER_WEEK" || frequencyType === "X_PER_MONTH") {
    payload.frequencyValue = qs("#h_frequencyValue")?.value ? Number(qs("#h_frequencyValue").value) : null;
  }
  if (frequencyType === "SPECIFIC_DAYS_OF_WEEK") {
    payload.daysOfWeek = qs("#h_daysOfWeek")?.value?.trim() || null;
  }
  return payload;
}

function syncFrequencyFields() {
  const ft = qs("#h_frequencyType")?.value;
  qs("#h_frequencyValueRow")?.classList.toggle("d-none", !(ft === "X_PER_WEEK" || ft === "X_PER_MONTH"));
  qs("#h_daysOfWeekRow")?.classList.toggle("d-none", ft !== "SPECIFIC_DAYS_OF_WEEK");
}

const habitModalEl = qs("#habitModal");
const habitModal = habitModalEl ? new bootstrap.Modal(habitModalEl) : null;
let editingId = null;

function openHabitModal(habit) {
  editingId = habit?.id ?? null;
  qs("#habitModalTitle")?.replaceChildren(document.createTextNode(editingId ? "Tune Habit" : "Create Habit"));
  qs("#h_title").value = habit?.title || "";
  qs("#h_description").value = habit?.description || "";
  qs("#h_category").value = habit?.category || "HEALTH";
  qs("#h_type").value = habit?.type || "BUILD";
  qs("#h_frequencyType").value = habit?.frequencyType || "DAILY";
  qs("#h_frequencyValue").value = habit?.frequencyValue ?? "";
  qs("#h_daysOfWeek").value = habit?.daysOfWeek ?? "";
  qs("#h_targetValue").value = habit?.targetValue ?? "";
  qs("#h_unit").value = habit?.unit ?? "";
  syncFrequencyFields();
  habitModal?.show();
}

qs("#newHabitBtn")?.addEventListener("click", () => openHabitModal(null));
qs("#h_frequencyType")?.addEventListener("change", syncFrequencyFields);

const saveBtn = qs("#habitSaveBtn");
qs("#habitForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setBusy(saveBtn, true, "Saving…");
  try {
    const payload = getHabitPayloadFromForm();
    if (editingId) await api.habits.update(editingId, payload);
    else await api.habits.create(payload);
    habitModal?.hide();
    toast({ title: "Saved", message: "Habit updated." });
    await load();
  } catch (err) {
    toast({ title: "Save failed", message: err.message || "Check inputs." });
  } finally {
    setBusy(saveBtn, false);
  }
});

async function load() {
  try {
    state.habits = await api.habits.list();
    render();
    bind();
  } catch (err) {
    if (err.status === 401) {
      auth.logout();
      window.location.href = "../auth/login.html";
      return;
    }
    toast({ title: "Load failed", message: err.message || "Backend not reachable." });
  }
}

load();

