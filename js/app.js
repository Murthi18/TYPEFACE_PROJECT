// js/app.js

// utility
function formatCurrency(num) {
  return "₹" + Number(num).toLocaleString("en-IN");
}

const PAGE_SIZE = 5;
let currentPage = 1;

// DOM elements
const transactionsEl = document.getElementById("transactions");
const paginationEl = document.getElementById("pagination");
const fromDateEl = document.getElementById("fromDate");
const toDateEl = document.getElementById("toDate");
const filterTypeEl = document.getElementById("filterType");
const applyFilterBtn = document.getElementById("applyFilter");

// 🔹 Summary cards updater
function updateSummary(list) {
  const incomeValue = document.getElementById("incomeValue");
  const expenseValue = document.getElementById("expenseValue");
  const balanceValue = document.getElementById("balanceValue");

  const totalIncome = list
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = list
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  if (incomeValue) incomeValue.textContent = formatCurrency(totalIncome);
  if (expenseValue) expenseValue.textContent = formatCurrency(totalExpense);
  if (balanceValue) balanceValue.textContent = formatCurrency(balance);
}

// 🔹 Badge color by category
function badgeClassForCategory(cat) {
  const c = (cat || "").toLowerCase();
  if (c.includes("food")) return "food";
  if (c.includes("transport")) return "transport";
  if (c.includes("entertain")) return "entertainment";
  if (c.includes("salary")) return "salary";
  if (c.includes("shop")) return "shopping";
  return "misc";
}

// 🔹 Render transaction list
function renderList() {
  const from = fromDateEl ? fromDateEl.value : null;
  const to = toDateEl ? toDateEl.value : null;
  const type = filterTypeEl ? filterTypeEl.value : "all";

  const filtered = filterTransactions(transactions, type, from, to);

  // Pagination
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  // Clear list
  transactionsEl.innerHTML = "";
  if (pageItems.length === 0) {
    transactionsEl.innerHTML =
      '<li class="transaction"><span>No transactions found</span></li>';
  } else {
    pageItems.forEach((t) => {
      const li = document.createElement("li");
      li.className = `transaction ${t.type}`;

      const badgeClass = badgeClassForCategory(t.category);

      li.innerHTML = `
        <div class="left">
          <div class="top">
            <span class="badge ${badgeClass}">${t.category}</span>
            <span class="desc">${t.description || ""}</span>
          </div>
          <div class="sub">${new Date(t.date).toLocaleString()}</div>
        </div>
        <div class="right">
          <div class="amount">${
            t.type === "expense" ? "-" : "+"
          }${formatCurrency(t.amount)}</div>
          <div class="date">${new Date(t.date).toLocaleDateString()}</div>
        </div>
      `;

      transactionsEl.appendChild(li);
    });
  }

  renderPagination(totalPages);

  // ✅ update summary with all transactions
  updateSummary(transactions);

  // ✅ update charts if function available
  if (typeof renderCharts === "function") {
    renderCharts(transactions);
  }
}

// 🔹 Render pagination controls
function renderPagination(totalPages) {
  paginationEl.innerHTML = "";
  if (totalPages <= 1) return;

  // Prev
  const prev = document.createElement("button");
  prev.innerText = "Prev";
  prev.disabled = currentPage === 1;
  prev.addEventListener("click", () => {
    currentPage--;
    renderList();
  });
  paginationEl.appendChild(prev);

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.innerText = i;
    btn.disabled = i === currentPage;
    btn.addEventListener("click", () => {
      currentPage = i;
      renderList();
    });
    paginationEl.appendChild(btn);
  }

  // Next
  const next = document.createElement("button");
  next.innerText = "Next";
  next.disabled = currentPage === totalPages;
  next.addEventListener("click", () => {
    currentPage++;
    renderList();
  });
  paginationEl.appendChild(next);
}

// 🔹 Add Transaction form
const transactionForm = document.getElementById("transactionForm");
if (transactionForm) {
  transactionForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const type = document.getElementById("type").value;
    const amount = Number(document.getElementById("amount").value);
    const category = document.getElementById("category").value;
    const date =
      document.getElementById("date").value ||
      new Date().toISOString().split("T")[0];
    const description = document.getElementById("description").value;

    if (!amount || !category) {
      alert("Please enter amount and category");
      return;
    }

    transactions.push({
      id: transactions.length + 1,
      type,
      amount,
      category,
      date,
      description,
    });

    renderList();
    transactionForm.reset();
  });
}

// 🔹 Filters
if (applyFilterBtn)
  applyFilterBtn.addEventListener("click", () => {
    currentPage = 1;
    renderList();
  });
if (filterTypeEl)
  filterTypeEl.addEventListener("change", () => {
    currentPage = 1;
    renderList();
  });

// 🔹 Init
document.addEventListener("DOMContentLoaded", () => {
  renderList();
});
