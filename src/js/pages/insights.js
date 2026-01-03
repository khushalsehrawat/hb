import { api } from "../api.js";
import { auth } from "../auth.js";
import { qs, toast, escapeHtml } from "../ui.js";
import { wireShell } from "../shell.js";

if (!auth.requireAuth()) throw new Error("Not authenticated");
wireShell({ active: "insights" });

let chartDaily = null;
let chartCategories = null;

function ymNow() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function setMonthSelect(year, month) {
  const y = qs("#year");
  const m = qs("#month");
  if (y) y.value = String(year);
  if (m) m.value = String(month);
}

function getSelectedYm() {
  const year = Number(qs("#year")?.value || ymNow().year);
  const month = Number(qs("#month")?.value || ymNow().month);
  return { year, month };
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

async function load() {
  const { year, month } = getSelectedYm();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth(year, month)).padStart(2, "0")}`;

  try {
    const [monthly, streaks, daily, categories, prompt, exportTxt] = await Promise.all([
      api.stats.monthly(year, month),
      api.stats.streaks(),
      api.stats.dailyRange(start, end),
      api.stats.categories(year, month),
      api.exportAi.monthlyPrompt(year, month).catch(() => null),
      api.exportAi.exportMonth(year, month).catch(() => null),
    ]);

    qs("#k_total")?.replaceChildren(document.createTextNode(String(monthly.totalTasks)));
    qs("#k_done")?.replaceChildren(document.createTextNode(String(monthly.completedTasks)));
    qs("#k_avg")?.replaceChildren(document.createTextNode(`${Math.round(monthly.averageCompletionPercent)}%`));
    qs("#k_streak")?.replaceChildren(document.createTextNode(String(streaks.currentStreakDays)));
    qs("#k_best")?.replaceChildren(document.createTextNode(monthly.bestDay ? String(monthly.bestDay) : "—"));
    qs("#k_worst")?.replaceChildren(document.createTextNode(monthly.worstDay ? String(monthly.worstDay) : "—"));

    renderDailyChart(daily);
    renderCategoryChart(categories?.categories || []);

    qs("#aiPrompt")?.replaceChildren(document.createTextNode(prompt || "AI prompt not available."));
    qs("#exportText")?.replaceChildren(document.createTextNode(exportTxt || "Export not available."));
  } catch (err) {
    if (err.status === 401) {
      auth.logout();
      window.location.href = "../auth/login.html";
      return;
    }
    toast({ title: "Insights failed", message: err.message || "Backend not reachable." });
  }
}

function renderDailyChart(daily) {
  const ctx = qs("#dailyChart");
  if (!ctx) return;
  const labels = daily.map((d) => String(d.date).slice(8));
  const data = daily.map((d) => Math.round(d.completionPercent));

  if (chartDaily) chartDaily.destroy();
  chartDaily = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Completion %",
          data,
          backgroundColor: "rgba(21,209,255,.55)",
          borderColor: "rgba(255,61,110,.55)",
          borderWidth: 1,
          borderRadius: 10,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100, grid: { color: "rgba(11,18,32,.06)" } },
        x: { grid: { display: false } },
      },
    },
  });
}

function renderCategoryChart(items) {
  const ctx = qs("#categoryChart");
  if (!ctx) return;
  const labels = items.map((c) => String(c.category));
  const data = items.map((c) => Math.round(c.completionPercent));

  if (chartCategories) chartCategories.destroy();
  chartCategories = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: ["rgba(21,209,255,.55)", "rgba(255,61,110,.42)", "rgba(124,247,213,.50)", "rgba(11,18,32,.12)"],
          borderColor: "rgba(255,255,255,.92)",
          borderWidth: 2,
        },
      ],
    },
    options: {
      plugins: { legend: { position: "bottom", labels: { boxWidth: 10 } } },
      cutout: "72%",
    },
  });

  const list = qs("#categoryList");
  if (list) {
    list.innerHTML = items
      .sort((a, b) => b.completionPercent - a.completionPercent)
      .map((c) => {
        return `
          <div class="d-flex justify-content-between align-items-center py-2 border-bottom" style="border-color:rgba(11,18,32,.08)!important">
            <div class="fw-semibold">${escapeHtml(String(c.category))}</div>
            <div class="text-secondary">${Math.round(c.completionPercent)}%</div>
          </div>
        `;
      })
      .join("");
  }
}

qs("#applyMonth")?.addEventListener("click", () => load());

const now = ymNow();
setMonthSelect(now.year, now.month);
load();

