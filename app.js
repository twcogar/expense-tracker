let currentBalance = 0;
let expenses = [];
let chart;
let budgets = {};

document.addEventListener("DOMContentLoaded", () => {
  const expenseForm = document.getElementById("expense-form");
  const depositForm = document.getElementById("deposit-form");
  const balanceInput = document.getElementById("bank-balance");
  const balanceEditor = document.getElementById("balance-editor");
  const inlineBalanceLabel = document.getElementById("inline-current-balance");
  const expenseList = document.getElementById("expense-list");
  const exportBtn = document.getElementById("export-btn");
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  const expenseAmountInput = document.getElementById("expense-amount");
  const saveBudgetBtn = document.getElementById("save-budget-btn");
  const budgetStatus = document.getElementById("budget-status");
  const budgetBarsContainer = document.getElementById("budget-bars");

  function updateBalanceDisplay() {
    inlineBalanceLabel.textContent = `$${currentBalance.toFixed(2)}`;
    inlineBalanceLabel.className = currentBalance < 0 ? "balance-negative" : "balance-positive";
  }

  function renderExpenses() {
    expenseList.innerHTML = "";
    expenses.forEach((e) => {
      const li = document.createElement("li");
      li.setAttribute("data-category", e.category);
      li.innerHTML = `
        <span>${e.name}</span>
        <span>$${e.amount.toFixed(2)} - ${e.category}</span>
      `;
      expenseList.appendChild(li);
    });
    updateChart();
    updateBudgetBars();
  }

  function updateChart() {
    const ctxId = "expense-chart";
    let ctx = document.getElementById(ctxId);

    if (!ctx) {
      const canvas = document.createElement("canvas");
      canvas.id = ctxId;
      document.getElementById("chart-panel").appendChild(canvas);
      ctx = canvas;
    }

    const categoryTotals = {};
    expenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const colors = labels.map((cat) => {
      const li = document.createElement("li");
      li.setAttribute("data-category", cat);
      document.body.appendChild(li);
      const color = getComputedStyle(li).borderLeftColor;
      document.body.removeChild(li);
      return color || getRandomColor();
    });

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
      },
    });
  }

  function getRandomColor() {
    return "#" + Math.floor(Math.random() * 16777215).toString(16);
  }

  expenseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("expense-name").value.trim();
    const amountStr = expenseAmountInput.value.replace(/[^0-9.]+/g, "");
    const amount = parseFloat(amountStr);
    const category = document.getElementById("expense-category").value;

    if (!name || isNaN(amount) || !category) return;

    expenses.push({ name, amount, category });
    currentBalance -= amount;
    updateBalanceDisplay();
    renderExpenses();
    checkBudgetStatus();
    expenseForm.reset();
  });

  depositForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById("deposit-amount").value);
    if (!isNaN(amount)) {
      currentBalance += amount;
      updateBalanceDisplay();
    }
    depositForm.reset();
  });

  document.getElementById("save-balance-btn").addEventListener("click", () => {
    const value = parseFloat(balanceInput.value);
    if (!isNaN(value)) {
      currentBalance = value;
      updateBalanceDisplay();
    }
    balanceInput.value = "";
    balanceEditor.classList.add("hidden");
  });

  exportBtn.addEventListener("click", () => {
    const tableRows = expenses.map(e => [e.name, `$${e.amount.toFixed(2)}`, e.category]);
    const wb = XLSX.utils.book_new();
    const wsData = [["Name", "Amount", "Category"], ...tableRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, "Expenses_Export.xlsx");
  });

  tabButtons.forEach(btn =>
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    })
  );

  expenseAmountInput.addEventListener("input", () => {
    let raw = expenseAmountInput.value.replace(/[^0-9.]/g, '');
    if (!isNaN(raw) && raw !== '') {
      expenseAmountInput.value = raw;
    }
  });

  saveBudgetBtn.addEventListener("click", () => {
    const rows = document.querySelectorAll(".budget-row");
    rows.forEach((row) => {
      const label = row.querySelector("label").textContent;
      const amountInput = row.querySelector("input");
      const value = parseFloat(amountInput.value);
      if (!isNaN(value)) {
        budgets[label] = value;
      }
    });
    checkBudgetStatus();
    updateBudgetBars();
  });

  function checkBudgetStatus() {
    const totals = {};

    expenses.forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });

    let overages = "";

    for (const [cat, limit] of Object.entries(budgets)) {
      if (totals[cat] > limit) {
        overages += `⚠ Over budget in ${cat} by $${(totals[cat] - limit).toFixed(2)}\n`;
      }
    }

    budgetStatus.textContent = overages ? overages.trim() : "✅ All categories within budget.";
    budgetStatus.style.color = overages ? "red" : "green";
  }

  function updateBudgetBars() {
    if (!budgetBarsContainer) return;

    budgetBarsContainer.innerHTML = "";

    const totals = {};
    expenses.forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });

    Object.keys(budgets).sort().forEach(category => {
      const limit = budgets[category];
      const spent = totals[category] || 0;
      const percent = Math.min((spent / limit) * 100, 100);

      const tempLi = document.createElement("li");
      tempLi.setAttribute("data-category", category);
      document.body.appendChild(tempLi);
      const color = getComputedStyle(tempLi).borderLeftColor;
      document.body.removeChild(tempLi);

      const wrapper = document.createElement("div");
      wrapper.className = "budget-bar-wrapper";

      const title = document.createElement("div");
      title.className = "budget-bar-title";
      title.textContent = `${category} — $${spent.toFixed(2)} / $${limit.toFixed(2)}`;

      const container = document.createElement("div");
      container.className = "budget-bar-container";

      const fill = document.createElement("div");
      fill.className = "budget-bar-fill";
      fill.style.width = `${percent}%`;
      fill.style.backgroundColor = color;

      container.appendChild(fill);
      wrapper.appendChild(title);
      wrapper.appendChild(container);
      budgetBarsContainer.appendChild(wrapper);
    });
  }

  updateBalanceDisplay();
});
