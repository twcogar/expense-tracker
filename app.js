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

  function updateBudgetBars() {
    const container = document.getElementById("budget-management-content");
    if (!container) return;
    container.innerHTML = "";

    const totals = {};
    expenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });

    const sortedCategories = Object.keys(budgets).sort();

    sortedCategories.forEach(cat => {
      const spent = totals[cat] || 0;
      const limit = budgets[cat];
      const percent = Math.min(100, (spent / limit) * 100).toFixed(0);

      const barWrapper = document.createElement("div");
      barWrapper.classList.add("budget-bar-wrapper");

      const label = document.createElement("div");
      label.classList.add("budget-label");
      label.textContent = `${cat}: $${spent.toFixed(2)} of $${limit.toFixed(2)}`;
      barWrapper.appendChild(label);

      const bar = document.createElement("div");
      bar.classList.add("budget-bar");

      const fill = document.createElement("div");
      fill.classList.add("budget-fill");
      fill.style.width = `${percent}%`;

      // Set category color
      const li = document.createElement("li");
      li.setAttribute("data-category", cat);
      document.body.appendChild(li);
      const color = getComputedStyle(li).borderLeftColor;
      document.body.removeChild(li);
      fill.style.backgroundColor = color || "#888";

      bar.appendChild(fill);
      barWrapper.appendChild(bar);
      container.appendChild(barWrapper);
    });
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
    const wb = XLSX.utils.book_new();
    const wsData = [["Name", "Amount", "Category"]];
    expenses.forEach(e => {
      wsData.push([e.name, e.amount.toFixed(2), e.category]);
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");

    // Add chart image if available
    if (chart) {
      const canvas = document.getElementById("expense-chart");
      const img = canvas.toDataURL("image/png");
      const imgSheet = XLSX.utils.aoa_to_sheet([["Expense Chart"]]);
      imgSheet["!merges"] = [{ s: { c: 0, r: 1 }, e: { c: 3, r: 20 } }];
      XLSX.utils.book_append_sheet(wb, imgSheet, "Chart");

      // NOTE: XLSX library cannot embed images directly unless converted and patched with custom plugins.
      // Placeholder behavior; you may export the image separately if needed.
    }

    XLSX.writeFile(wb, "Expenses_Report.xlsx");
  });

  tabButtons.forEach(btn =>
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");

      // Refresh budget bars if tab is Budget Management
      if (btn.dataset.tab === "budget-mgmt-tab") updateBudgetBars();
    })
  );

  expenseAmountInput.addEventListener("input", () => {
    let val = expenseAmountInput.value.replace(/[^\d.]/g, '');
    if (val && !isNaN(val)) {
      expenseAmountInput.value = val;
    }
  });

  document.getElementById("save-budget-btn").addEventListener("click", () => {
    const rows = document.querySelectorAll("#budget-container .budget-row");
    rows.forEach(row => {
      const label = row.querySelector("label").textContent;
      const input = row.querySelector("input");
      const value = parseFloat(input.value);
      if (!isNaN(value)) {
        budgets[label] = value;
      }
    });
    checkBudgetStatus();
    updateBudgetBars();
  });

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

  updateBalanceDisplay();
});
