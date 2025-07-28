let currentBalance = 0;
let expenses = [];
let chart;
let budgets = {};
const categoryColors = {
  "Auto": "#009688",
  "Clothing": "#00bcd4",
  "Credit Card": "#f06292",
  "Dining": "#ff9800",
  "Entertainment": "#9c27b0",
  "Groceries": "#4caf50",
  "Insurance": "#795548",
  "Internet": "#673ab7",
  "Loan": "#8bc34a",
  "Medical": "#e91e63",
  "Other": "#9e9e9e",
  "Pet Care": "#ff7043",
  "Phone": "#607d8b",
  "Rent": "#f44336",
  "Subscriptions": "#ffc107",
  "Transportation": "#3f51b5",
  "Utilities": "#2196f3"
};

const defaultCategories = Object.keys(categoryColors);

function getCategoryColor(category) {
  return categoryColors[category] || "#777";
}

function getGradient(category) {
  return `linear-gradient(to bottom, ${getCategoryColor(category)}, #1c75bc)`;
}

document.addEventListener("DOMContentLoaded", () => {
  const expenseForm = document.getElementById("expense-form");
  const depositForm = document.getElementById("deposit-form");
  const balanceForm = document.getElementById("balance-form");
  const balanceInput = document.getElementById("bank-balance");
  const inlineBalanceLabel = document.getElementById("inline-current-balance");
  const expenseList = document.getElementById("expense-list");
  const exportBtn = document.getElementById("export-btn");
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  const expenseAmountInput = document.getElementById("expense-amount");
  const analyticsSpent = document.getElementById("total-spent");
  const analyticsTop = document.getElementById("top-category");
  const analyticsBurn = document.getElementById("burn-rate");
  const historySelector = document.getElementById("month-selector");
  const historySummary = document.getElementById("history-summary");
  const budgetContainer = document.getElementById("budget-container");

  defaultCategories.sort().forEach(cat => {
    const row = document.createElement("div");
    row.className = "budget-row";
    row.innerHTML = `
      <label for="budget-${cat.toLowerCase().replace(/\s+/g, '-')}">${cat}</label>
      <input type="number" id="budget-${cat.toLowerCase().replace(/\s+/g, '-')}" placeholder="Budget for ${cat}" />
    `;
    budgetContainer.appendChild(row);
  });

  function updateBalanceDisplay() {
    inlineBalanceLabel.textContent = `$${currentBalance.toFixed(2)}`;
    inlineBalanceLabel.className = currentBalance < 0 ? "balance-negative" : "balance-positive";
  }

  function renderExpenses() {
    expenseList.innerHTML = "";
    expenses.forEach((e, i) => {
      const li = document.createElement("li");
      li.setAttribute("data-category", e.category);
      li.style.setProperty('--gradient-color', getGradient(e.category));
      li.innerHTML = `
        <div class="expense-name">${e.name}</div>
        <div class="expense-amount">$${e.amount.toFixed(2)}</div>
        <div class="expense-category">${e.category}</div>
        <button class="delete-btn" data-index="${i}" title="Delete Expense"></button>
      `;
      expenseList.appendChild(li);
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.getAttribute("data-index"));
        expenses.splice(index, 1);
        saveState();
        renderExpenses();
        checkBudgetStatus();
      });
    });

    updateChart();
    renderBudgetBars();
    updateAnalytics();
    updateHistory();
  }

  function updateChart() {
    const ctx = document.getElementById("expense-chart");
    const categoryTotals = {};
    expenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const colors = labels.map(cat => getCategoryColor(cat));

    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: "pie",
      data: {
        labels,
        datasets: [{
          label: "Expenses",
          data,
          backgroundColor: colors,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: "#333",
              font: {
                size: 14
              }
            }
          }
        }
      },
    });
  }

  function renderBudgetBars() {
    const container = document.getElementById("budget-management-content");
    if (!container) return;
    container.innerHTML = "";

    const totals = {};
    expenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });

    Object.keys(budgets).sort().forEach((cat) => {
      const spent = totals[cat] || 0;
      const budgeted = budgets[cat] || 0;
      const percent = Math.min(100, (spent / budgeted) * 100);
      const color = getCategoryColor(cat);

      const wrapper = document.createElement("div");
      wrapper.classList.add("budget-bar-wrapper");

      const label = document.createElement("div");
      label.classList.add("budget-bar-label");
      label.textContent = `${cat}: $${spent.toFixed(2)} of $${budgeted.toFixed(2)}`;

      const bar = document.createElement("div");
      bar.classList.add("budget-bar");
      const fill = document.createElement("div");
      fill.classList.add("budget-bar-fill");
      fill.style.width = percent + "%";
      fill.style.backgroundColor = color;

      bar.appendChild(fill);
      wrapper.appendChild(label);
      wrapper.appendChild(bar);
      container.appendChild(wrapper);
    });
  }

  function updateAnalytics() {
    const totals = {};
    let total = 0;

    expenses.forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
      total += e.amount;
    });

    const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
    const days = Math.max(1, new Date().getDate());
    analyticsSpent.textContent = `$${total.toFixed(2)}`;
    analyticsTop.textContent = top ? `${top[0]} ($${top[1].toFixed(2)})` : "-";
    analyticsBurn.textContent = `$${(total / days).toFixed(2)}/day`;
  }

  function updateHistory() {
    const monthly = {};

    expenses.forEach(e => {
      const date = new Date();
      const month = date.toLocaleString('default', { month: 'long' });
      if (!monthly[month]) monthly[month] = [];
      monthly[month].push(e);
    });

    historySelector.innerHTML = `<option disabled selected>Select Month</option>`;
    Object.keys(monthly).forEach(m => {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      historySelector.appendChild(opt);
    });

    historySelector.onchange = () => {
      const selected = historySelector.value;
      const list = monthly[selected] || [];
      const total = list.reduce((acc, e) => acc + e.amount, 0);
      historySummary.innerHTML = `
        <p><strong>Total Expenses:</strong> $${total.toFixed(2)}</p>
        <ul>${list.map(e => `<li>${e.name} - $${e.amount.toFixed(2)} (${e.category})</li>`).join("")}</ul>
      `;
    };
  }

  function saveState() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
    localStorage.setItem("budgets", JSON.stringify(budgets));
    localStorage.setItem("balance", currentBalance);
  }

  function loadState() {
    expenses = JSON.parse(localStorage.getItem("expenses") || "[]");
    budgets = JSON.parse(localStorage.getItem("budgets") || "{}");
    currentBalance = parseFloat(localStorage.getItem("balance")) || 0;
  }

  function checkBudgetStatus() {
    let output = "";
    const totals = {};
    expenses.forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });

    for (const [cat, limit] of Object.entries(budgets)) {
      if (totals[cat] > limit) {
        output += `⚠ Over budget in ${cat} by $${(totals[cat] - limit).toFixed(2)}\n`;
      }
    }

    const status = document.getElementById("budget-status");
    status.textContent = output.trim() || "✅ All categories within budget.";
    status.style.color = output ? "red" : "green";
  }

  expenseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("expense-name").value.trim();
    const amountStr = expenseAmountInput.value.replace(/[^0-9.]/g, "");
    const amount = parseFloat(amountStr);
    const category = document.getElementById("expense-category").value;

    if (!name || isNaN(amount) || !category) return;

    expenses.push({ name, amount, category });
    currentBalance -= amount;
    updateBalanceDisplay();
    renderExpenses();
    checkBudgetStatus();
    saveState();
    expenseForm.reset();
  });

  depositForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById("deposit-amount").value);
    if (!isNaN(amount)) {
      currentBalance += amount;
      updateBalanceDisplay();
      saveState();
    }
    depositForm.reset();
  });

  balanceForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = parseFloat(balanceInput.value);
    if (!isNaN(value)) {
      currentBalance = value;
      updateBalanceDisplay();
      saveState();
    }
    balanceInput.value = "";
  });

  exportBtn.addEventListener("click", () => {
    const wb = XLSX.utils.book_new();
    const wsData = [["Name", "Amount", "Category", "Date"]];
    expenses.forEach(e => {
      wsData.push([e.name, e.amount, e.category, new Date().toLocaleDateString()]);
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");

    const imgSheet = XLSX.utils.aoa_to_sheet([
      ["Note: Excel export does not embed image directly via JavaScript."],
      ["Recommendation: Use screenshot or insert manually."]
    ]);
    XLSX.utils.book_append_sheet(wb, imgSheet, "Chart");

    const fileName = `Expenses_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  });

  document.getElementById("save-budget-btn").addEventListener("click", () => {
    const inputs = document.querySelectorAll("#budget-container input[type='number']");
    inputs.forEach(input => {
      const id = input.id;
      const cat = id.replace("budget-", "").replace(/-/g, " ");
      const val = parseFloat(input.value);
      if (!isNaN(val)) budgets[toTitleCase(cat)] = val;
    });
    checkBudgetStatus();
    renderBudgetBars();
    saveState();
  });

  function toTitleCase(str) {
    return str.replace(/\w\S*/g, txt =>
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  tabButtons.forEach(btn =>
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    })
  );

  expenseAmountInput.addEventListener("input", () => {
    const raw = expenseAmountInput.value.replace(/[^0-9.]/g, '');
    expenseAmountInput.value = raw;
  });

  loadState();
  updateBalanceDisplay();
  renderExpenses();
});
