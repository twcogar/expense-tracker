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
    const colors = labels.map((cat) => getCategoryColor(cat));

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

  function getCategoryColor(category) {
    const li = document.createElement("li");
    li.setAttribute("data-category", category);
    document.body.appendChild(li);
    const color = getComputedStyle(li).borderLeftColor;
    document.body.removeChild(li);
    return color || "#999";
  }

  function updateBudgetBars() {
    if (!budgetBarsContainer) return;

    budgetBarsContainer.innerHTML = "";

    const totals = {};
    expenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });

    const sortedCategories = Object.keys(budgets).sort();

    sortedCategories.forEach((category) => {
      const spent = totals[category] || 0;
      const budgeted = budgets[category];

      const percent = Math.min((spent / budgeted) * 100, 100);
      const color = getCategoryColor(category);

      const wrapper = document.createElement("div");
      wrapper.classList.add("budget-visual-wrapper");

      const title = document.createElement("div");
      title.textContent = `${category}: $${spent.toFixed(2)} of $${budgeted.toFixed(2)}`;
      title.classList.add("budget-title");

      const bar = document.createElement("div");
      bar.classList.add("budget-bar");
      bar.innerHTML = `<div class="budget-bar-fill" style="width:${percent}%; background-color:${color};"></div>`;

      wrapper.appendChild(title);
      wrapper.appendChild(bar);
      budgetBarsContainer.appendChild(wrapper);
    });
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

    budgetStatus.textContent = output.trim() || "✅ All categories within budget.";
    budgetStatus.style.color = output ? "red" : "green";
  }

  function parseDollarInput(value) {
    const cleaned = value.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned);
  }

  expenseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("expense-name").value.trim();
    const amount = parseDollarInput(expenseAmountInput.value);
    const category = document.getElementById("expense-category").value;

    if (!name || isNaN(amount) || !category) return;

    expenses.push({ name, amount, category });
    currentBalance -= amount;
    updateBalanceDisplay();
    renderExpenses();
    checkBudgetStatus();
    expenseForm.reset();
  });

  expenseAmountInput.addEventListener("input", () => {
    // Allow freeform typing with formatting only on blur
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
      updateBudgetBars(); // Re-render on tab switch in case budget changed
    })
  );

  saveBudgetBtn.addEventListener("click", () => {
    const rows = document.querySelectorAll("#budget-container .budget-row");
    rows.forEach((row) => {
      const label = row.querySelector("label").textContent;
      const value = parseFloat(row.querySelector("input").value);
      if (!isNaN(value)) {
        budgets[label] = value;
      }
    });
    checkBudgetStatus();
    updateBudgetBars();
  });

  updateBalanceDisplay();
});
