let currentBalance = 0;
let expenses = [];
let chart;
let budgets = {};
const categoryColors = {};

const defaultCategories = [
  "Auto", "Clothing", "Credit Card", "Dining", "Entertainment",
  "Groceries", "Insurance", "Internet", "Loan", "Medical",
  "Other", "Pet Care", "Phone", "Rent", "Subscriptions",
  "Transportation", "Utilities"
];

// Assign fixed category colors
function getCategoryColor(category) {
  if (categoryColors[category]) return categoryColors[category];
  const li = document.createElement("li");
  li.setAttribute("data-category", category);
  document.body.appendChild(li);
  const color = getComputedStyle(li).borderLeftColor || getRandomColor();
  document.body.removeChild(li);
  categoryColors[category] = color;
  return color;
}

function getRandomColor() {
  return "#" + Math.floor(Math.random() * 16777215).toString(16);
}

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

  // INIT: Populate Budget Fields
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
    renderBudgetBars();
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
    const tableRows = expenses.map(e => [e.name, `$${e.amount.toFixed(2)}`, e.category]);
    const wb = XLSX.utils.book_new();
    const wsData = [["Name", "Amount", "Category"], ...tableRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Basic formatting
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const addr = XLSX.utils.encode_cell({r:0, c:C});
      if (!ws[addr]) continue;
      ws[addr].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "DCE6F1" } }
      };
    }

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
    const raw = expenseAmountInput.value.replace(/[^0-9.]/g, '');
    expenseAmountInput.value = raw;
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
  });

  function toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) =>
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
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

  updateBalanceDisplay();
});
