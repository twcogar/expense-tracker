const categories = [
  "Credit Card", "Loans", "Utilities", "Insurance", "Groceries", "Rent",
  "Transport", "Medical", "Entertainment", "Dining", "Subscriptions", "Other"
];
const expenses = [];
const budgets = {};
let currentBalance = 0;

const expenseForm = document.getElementById("expense-form");
const depositForm = document.getElementById("deposit-form");
const budgetSettings = document.getElementById("budget-settings");
const budgetBars = document.getElementById("budget-bars");
const expenseList = document.getElementById("expense-list");
const chartPanel = document.getElementById("chart-panel");
const remainingBalance = document.getElementById("remaining-balance");
const categorySelect = document.getElementById("expense-category");
const inlineBalance = document.getElementById("inline-current-balance");
const currentBalanceText = document.getElementById("current-balance-text");
const balanceEditor = document.getElementById("balance-editor");
const editBalanceBtn = document.getElementById("edit-balance-btn");
const saveBalanceBtn = document.getElementById("save-balance-btn");
const bankBalanceInput = document.getElementById("bank-balance");

function init() {
  categories.sort().forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);

    const input = document.createElement("input");
    input.type = "number";
    input.placeholder = `Budget for ${cat}`;
    input.dataset.category = cat;
    budgetSettings.appendChild(input);

    budgets[cat] = 0;
  });
  updateBalances();
}
init();

expenseForm.addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("expense-name").value;
  const amount = parseFloat(document.getElementById("expense-amount").value);
  const category = categorySelect.value;

  if (name && amount > 0 && category) {
    expenses.push({ name, amount, category });
    currentBalance -= amount;
    renderExpenses();
    updateChart();
    updateBudgets();
    updateBalances();
    expenseForm.reset();
  }
});

depositForm.addEventListener("submit", e => {
  e.preventDefault();
  const deposit = parseFloat(document.getElementById("deposit-amount").value);
  if (deposit > 0) {
    currentBalance += deposit;
    updateBalances();
    depositForm.reset();
  }
});

editBalanceBtn.addEventListener("click", () => {
  balanceEditor.classList.toggle("hidden");
});

saveBalanceBtn.addEventListener("click", () => {
  const val = parseFloat(bankBalanceInput.value);
  if (!isNaN(val)) {
    currentBalance = val;
    updateBalances();
    balanceEditor.classList.add("hidden");
  }
});

function updateBalances() {
  inlineBalance.textContent = `$${currentBalance.toFixed(2)}`;
  currentBalanceText.textContent = `$${currentBalance.toFixed(2)}`;
  const spent = expenses.reduce((sum, ex) => sum + ex.amount, 0);
  remainingBalance.textContent = `Remaining Balance: $${(currentBalance).toFixed(2)} | Total Spent: $${spent.toFixed(2)}`;
}

function renderExpenses() {
  expenseList.innerHTML = "";
  expenses.forEach((exp, index) => {
    const li = document.createElement("li");
    li.innerHTML = `${exp.name} - $${exp.amount.toFixed(2)} [${exp.category}]
      <button onclick="removeExpense(${index})">X</button>`;
    expenseList.appendChild(li);
  });
}

function removeExpense(index) {
  currentBalance += expenses[index].amount;
  expenses.splice(index, 1);
  renderExpenses();
  updateChart();
  updateBudgets();
  updateBalances();
}

function updateChart() {
  chartPanel.innerHTML = "";
  const totals = {};
  expenses.forEach(exp => {
    if (!totals[exp.category]) totals[exp.category] = 0;
    totals[exp.category] += exp.amount;
  });

  Object.keys(totals).forEach(cat => {
    const bar = document.createElement("div");
    bar.className = "chart-segment";
    bar.textContent = `${cat}: $${totals[cat].toFixed(2)}`;
    chartPanel.appendChild(bar);
  });
}

function updateBudgets() {
  document.querySelectorAll("#budget-settings input").forEach(input => {
    const cat = input.dataset.category;
    budgets[cat] = parseFloat(input.value) || 0;
  });

  budgetBars.innerHTML = "";
  const spentByCat = {};
  expenses.forEach(exp => {
    spentByCat[exp.category] = (spentByCat[exp.category] || 0) + exp.amount;
  });

  Object.entries(budgets).forEach(([cat, limit]) => {
    if (limit > 0) {
      const spent = spentByCat[cat] || 0;
      const percent = Math.min(100, (spent / limit) * 100);
      const bar = document.createElement("div");
      bar.className = "bar";

      const fill = document.createElement("div");
      fill.className = "bar-fill";
      fill.style.width = percent + "%";
      fill.classList.add(
        percent < 70 ? "green" : percent < 100 ? "yellow" : "red"
      );
      fill.textContent = `${Math.round(percent)}%`;

      bar.appendChild(fill);
      budgetBars.appendChild(bar);
    }
  });
}

document.getElementById("export-btn").addEventListener("click", () => {
  let csv = "Name,Amount,Category\n";
  expenses.forEach(e => {
    csv += `${e.name},${e.amount},${e.category}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "expenses.csv";
  a.click();
  URL.revokeObjectURL(url);
});

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const target = btn.dataset.tab;
    document.querySelectorAll(".tab-content").forEach(tab => {
      tab.classList.toggle("active", tab.id === target);
    });
  });
});
