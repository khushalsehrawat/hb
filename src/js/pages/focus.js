import { api } from "../api.js";
import { auth } from "../auth.js";
import { qs, toast, setBusy, escapeHtml } from "../ui.js";
import { wireShell } from "../shell.js";

if (!auth.requireAuth()) throw new Error("Not authenticated");
wireShell({ active: "focus" });

const state = { activeSession: null, sessions: [], habits: [] };

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function renderActive() {
  const host = qs("#activeHost");
  if (!host) return;
  const s = state.activeSession;
  if (!s) {
    host.innerHTML = `
      <div class="hx-card p-4">
        <div class="fw-semibold">No active session.</div>
        <div class="text-secondary">Start a focus run and protect it like a qualifying lap.</div>
      </div>
    `;
    return;
  }

  host.innerHTML = `
    <div class="hx-card p-4 hx-border-grad">
      <div class="d-flex justify-content-between align-items-start gap-3">
        <div>
          <div class="fw-semibold">Live Session</div>
          <div class="text-secondary small">${escapeHtml(s.label || "Focus")} • Started: ${escapeHtml(String(s.startTime || ""))}</div>
          <div class="small mt-2">${s.habitTitle ? `Linked to <span class="hx-badge-soft">${escapeHtml(s.habitTitle)}</span>` : ""}</div>
        </div>
        <button class="btn hx-btn btn-outline-danger btn-sm" id="endBtn"><i class="bi bi-flag-fill me-1"></i>End</button>
      </div>
      <div class="hx-mini-divider my-3"></div>
      <div class="row g-3">
        <div class="col-lg-6">
          <label class="form-label text-secondary small">Notes</label>
          <textarea id="endNotes" class="form-control" rows="3" placeholder="What worked? What broke focus?"></textarea>
        </div>
        <div class="col-lg-6">
          <label class="form-label text-secondary small">Distraction (optional)</label>
          <div class="d-flex gap-2">
            <input id="distractionReason" class="form-control" placeholder="Reason">
            <button class="btn hx-btn hx-btn-ghost" id="addDistractionBtn"><i class="bi bi-plus"></i></button>
          </div>
          <div class="text-secondary small mt-2">Distractions logged: <span id="distractionCount">${s.distractionCount ?? 0}</span></div>
        </div>
      </div>
    </div>
  `;

  qs("#endBtn")?.addEventListener("click", () => endSession());
  qs("#addDistractionBtn")?.addEventListener("click", () => addDistraction());
}

function renderSessions() {
  const host = qs("#sessionsHost");
  if (!host) return;
  if (!state.sessions.length) {
    host.innerHTML = `<div class="text-secondary">No sessions yet.</div>`;
    return;
  }
  host.innerHTML = `
    <div class="table-responsive">
      <table class="table hx-table align-middle">
        <thead><tr class="text-secondary small">
          <th>Label</th><th>Start</th><th>End</th><th>Minutes</th><th>Distractions</th>
        </tr></thead>
        <tbody>
          ${state.sessions
            .slice()
            .reverse()
            .map(
              (s) => `
            <tr>
              <td class="fw-semibold">${escapeHtml(s.label || "Focus")}${s.habitTitle ? ` <span class="hx-badge-soft ms-2">${escapeHtml(s.habitTitle)}</span>` : ""}</td>
              <td class="text-secondary small">${escapeHtml(String(s.startTime || ""))}</td>
              <td class="text-secondary small">${escapeHtml(String(s.endTime || ""))}</td>
              <td>${escapeHtml(String(s.durationMinutes ?? "—"))}</td>
              <td>${escapeHtml(String(s.distractionCount ?? 0))}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

async function startSession() {
  const btn = qs("#startBtn");
  setBusy(btn, true, "Starting…");
  try {
    const habitId = qs("#focusHabit")?.value ? Number(qs("#focusHabit").value) : null;
    const label = qs("#focusLabel")?.value?.trim() || "Focus Run";
    state.activeSession = await api.focus.start({ habitId: Number.isFinite(habitId) ? habitId : null, label });
    toast({ title: "Focus started", message: "Protect this session. No noise." });
    renderActive();
  } catch (err) {
    toast({ title: "Start failed", message: err.message || "Try again." });
  } finally {
    setBusy(btn, false);
  }
}

async function endSession() {
  const endBtn = qs("#endBtn");
  if (!state.activeSession?.id) return;
  setBusy(endBtn, true, "Ending…");
  try {
    const notes = qs("#endNotes")?.value?.trim() || null;
    const ended = await api.focus.end(state.activeSession.id, { notes });
    state.activeSession = null;
    toast({ title: "Session ended", message: `Duration: ${ended.durationMinutes ?? "—"} min` });
    await loadSessions();
    renderActive();
  } catch (err) {
    toast({ title: "End failed", message: err.message || "Try again." });
  } finally {
    setBusy(endBtn, false);
  }
}

async function addDistraction() {
  const btn = qs("#addDistractionBtn");
  if (!state.activeSession?.id) return;
  setBusy(btn, true, "Adding…");
  try {
    const reason = qs("#distractionReason")?.value?.trim() || "Distraction";
    await api.focus.addDistraction(state.activeSession.id, { reason });
    state.activeSession.distractionCount = (state.activeSession.distractionCount ?? 0) + 1;
    qs("#distractionCount")?.replaceChildren(document.createTextNode(String(state.activeSession.distractionCount)));
    qs("#distractionReason").value = "";
  } catch (err) {
    toast({ title: "Failed", message: err.message || "Try again." });
  } finally {
    setBusy(btn, false);
  }
}

async function loadSessions() {
  try {
    state.sessions = await api.focus.byDate(todayIso());
    renderSessions();
  } catch (err) {
    toast({ title: "Load failed", message: err.message || "Try again." });
  }
}

async function loadHabits() {
  try {
    state.habits = await api.habits.list();
    const sel = qs("#focusHabit");
    if (!sel) return;
    sel.innerHTML =
      `<option value="">No link</option>` +
      state.habits.map((h) => `<option value="${h.id}">${escapeHtml(h.title)}</option>`).join("");
  } catch {
    // ignore
  }
}

qs("#startBtn")?.addEventListener("click", () => startSession());

loadHabits();
loadSessions();
renderActive();

