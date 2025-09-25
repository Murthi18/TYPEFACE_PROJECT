// js/charts.js
let categoryChartInstance = null;
let timeChartInstance = null;

function renderCharts(transactions) {
  // --- Expenses by Category ---
  const categories = {};
  transactions.forEach(t => {
    if (t.type === "expense") {
      categories[t.category] = (categories[t.category] || 0) + Number(t.amount);
    }
  });

  const catLabels = Object.keys(categories);
  const catValues = Object.values(categories);

  const catCtx = document.getElementById("categoryChart").getContext("2d");
  if (categoryChartInstance) categoryChartInstance.destroy();
  categoryChartInstance = new Chart(catCtx, {
    type: "pie",
    data: {
      labels: catLabels,
      datasets: [
        {
          data: catValues,
          backgroundColor: ["#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#6b7280"]
        }
      ]
    },
    options: { responsive: true }
  });

  // --- Cashflow Over Time ---
  const daily = {};
  transactions.forEach(t => {
    const d = new Date(t.date).toLocaleDateString();
    if (!daily[d]) daily[d] = { income: 0, expense: 0 };
    daily[d][t.type] += Number(t.amount);
  });

  const sortedDates = Object.keys(daily).sort((a, b) => new Date(a) - new Date(b));
  const incomeData = sortedDates.map(d => daily[d].income);
  const expenseData = sortedDates.map(d => daily[d].expense);

  const timeCtx = document.getElementById("timeChart").getContext("2d");
  if (timeChartInstance) timeChartInstance.destroy();
  timeChartInstance = new Chart(timeCtx, {
    type: "line",
    data: {
      labels: sortedDates,
      datasets: [
        {
          label: "Income",
          data: incomeData,
          borderColor: "#10b981",
          fill: false
        },
        {
          label: "Expense",
          data: expenseData,
          borderColor: "#ef4444",
          fill: false
        }
      ]
    },
    options: { responsive: true }
  });
}
