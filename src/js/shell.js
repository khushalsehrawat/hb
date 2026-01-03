import { auth } from "./auth.js";
import { qs, qsa } from "./ui.js";

export function wireShell({ active } = {}) {
  const user = auth.getUser();
  const name = user?.fullName || "Driver";
  const email = user?.email || "";

  const u = qs("[data-hx-user]");
  if (u) u.textContent = name;
  const e = qs("[data-hx-email]");
  if (e) e.textContent = email;

  qsa("[data-hx-nav]").forEach((a) => {
    const key = a.getAttribute("data-hx-nav");
    if (key && key === active) a.classList.add("active");
  });

  qsa("[data-hx-logout]").forEach((btn) =>
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      auth.logout();
      window.location.href = "../index.html";
    }),
  );

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0].toUpperCase())
    .join("");
  const bubble = qs("[data-hx-avatar]");
  if (bubble) bubble.textContent = initials || "H";
}
