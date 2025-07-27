let expenses = [];
let totalBalance = 0;

const expenseForm = document.getElementById("expense-form");
const depositForm = document.getElementById("deposit-form");
const expenseList = document.getElementById("expense-list");
const chartPanel = document.getElementById("chart-panel");
const inlineBalance = document.getElementById("inline-current-balance");
const currentBalanceText = document.getElementById("current-balance-text");
const bankBalanceInput = document.getElementById("bank-balance");
const saveBalanceBtn = document.getElementById("save-balance-btn");
const editBalanceBtn = document.getElementById("edit-balance-btn");
const balanceEditor = document.getElementById("balance-editor");
const remainingBalance = document.getElementById("remaining-balance");
const exportBtn = document.getElementById("export-btn");

function updateBalanceDisplay() {
  inlineBalance.textContent = `$${totalBalance.toFixed(2)}`;
  currentBalanceText.textContent = `$${totalBalance.toFixed(2)}`;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = totalBalance - totalExpenses;
  remainingBalance.textContent = `Remaining Balance: $${remaining.toFixed(2)}`;
}

function updateChart() {
  chartPanel.innerHTML = "";
  const categorySums = {};
  expenses.forEach(e => {
    categorySums[e.category] = (categorySums[e.category] || 0) + e.amount;
  });

  for (const category in categorySums) {
    const div = document.createElement("div");
    div.className = "chart-segment";
    div.textContent = `${category}: $${categorySums[category].toFixed(2)}`;
    chartPanel.appendChild(div);
  }
}

function renderExpenses() {
  expenseList.innerHTML = "";
  expenses.forEach((expense, index) => {
    const li = document.createElement("li");
    li.textContent = `${expense.name} - $${expense.amount.toFixed(2)} (${expense.category})`;
    const btn = document.createElement("button");
    btn.textContent = "×";
    btn.onclick = () => {
      expenses.splice(index, 1);
      renderExpenses();
      updateChart();
      updateBalanceDisplay();
    };
    li.appendChild(btn);
    expenseList.appendChild(li);
  });
}

expenseForm.addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("expense-name").value.trim();
  const amount = parseFloat(document.getElementById("expense-amount").value);
  const category = document.getElementById("expense-category").value;
  if (!name || isNaN(amount) || !category) return;
  expenses.push({ name, amount, category });
  expenseForm.reset();
  renderExpenses();
  updateChart();
  updateBalanceDisplay();
});

depositForm.addEventListener("submit", e => {
  e.preventDefault();
  const deposit = parseFloat(document.getElementById("deposit-amount").value);
  if (!isNaN(deposit) && deposit > 0) {
    totalBalance += deposit;
    updateBalanceDisplay();
  }
  depositForm.reset();
});

saveBalanceBtn.addEventListener("click", () => {
  const value = parseFloat(bankBalanceInput.value);
  if (!isNaN(value)) totalBalance = value;
  balanceEditor.classList.add("hidden");
  updateBalanceDisplay();
});

editBalanceBtn.addEventListener("click", () => {
  balanceEditor.classList.toggle("hidden");
});

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

exportBtn.addEventListener("click", () => {
  const csv = ["Name,Amount,Category"];
  expenses.forEach(e => csv.push(`${e.name},${e.amount},${e.category}`));
  const blob = new Blob([csv.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "expenses.csv";
  a.click();
});
