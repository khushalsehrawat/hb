export function qs(sel, root = document) {
  return root.querySelector(sel);
}
export function qsa(sel, root = document) {
  return [...root.querySelectorAll(sel)];
}

export function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function toast({ title = "Notice", message = "", timeoutMs = 3600 } = {}) {
  const hostId = "hx-toast-host";
  let host = document.getElementById(hostId);
  if (!host) {
    host = document.createElement("div");
    host.id = hostId;
    host.className = "toast-container position-fixed top-0 end-0 p-3";
    host.style.zIndex = "1090";
    document.body.appendChild(host);
  }

  const el = document.createElement("div");
  el.className = "toast hx-toast border-0";
  el.setAttribute("role", "alert");
  el.setAttribute("aria-live", "assertive");
  el.setAttribute("aria-atomic", "true");
  el.innerHTML = `
    <div class="toast-header border-0 bg-transparent">
      <span class="me-2 rounded-circle d-inline-block" style="width:10px;height:10px;background:var(--hx-accent-2)"></span>
      <strong class="me-auto">${escapeHtml(title)}</strong>
      <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body pt-0 text-secondary">${escapeHtml(message)}</div>
  `;

  host.appendChild(el);
  const t = new bootstrap.Toast(el, { delay: timeoutMs });
  el.addEventListener("hidden.bs.toast", () => el.remove());
  t.show();
}

export function setBusy(btn, busy, textWhileBusy = "Working…") {
  if (!btn) return;
  if (busy) {
    btn.dataset.hxOldText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>${escapeHtml(textWhileBusy)}`;
  } else {
    btn.disabled = false;
    if (btn.dataset.hxOldText) btn.innerHTML = btn.dataset.hxOldText;
  }
}

export function formatDatePretty(isoDate) {
  if (!isoDate) return "";
  const d = new Date(`${isoDate}T00:00:00`);
  return new Intl.DateTimeFormat(undefined, { weekday: "short", day: "2-digit", month: "short" }).format(d);
}

