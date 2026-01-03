import { auth } from "../auth.js";

if (auth.isAuthed()) {
  const btn = document.getElementById("hx-cta");
  if (btn) {
    btn.textContent = "Go to Dashboard";
    btn.href = "./app/dashboard.html";
  }
}

