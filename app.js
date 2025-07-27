let currentBalance = 0;
const expenses = [];
const budgets = {};
const categories = [
  "Credit Card", "Dining", "Entertainment", "Groceries", "Insurance", "Loans",
  "Medical", "Other", "Rent", "Subscriptions", "Transport", "Utilities"
];

// Assign unique colors to categories
const categoryColors = {};
const colorPalette = [
  "#6c5ce7", "#00b894", "#fd79a8", "#e17055", "#0984e3", "#fab1a0",
  "#00cec9", "#fdcb6e", "#d63031", "#636e72", "#2d3436", "#a29bfe"
];
categories.forEach((cat, i) => categoryColors[cat] = colorPalette[i % colorPalette.length]);

function populateCategories() {
  const expenseCategory = document.getElementById("expense-category");
  const budgetSettings = document.getElementById("budget-settings");

  expenseCategory.innerHTML = `<option value="">Select Category</option>`;
  categories.sort().forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    expenseCategory.appendChild(option);

    const budgetRow = document.createElement("div");
    budgetRow.innerHTML = `
      <label>${category} Budget: </label>
      <input type="number" step="0.01" class="budget-input" data-category="${category}" />
    `;
    budgetSettings.appendChild(budgetRow);
  });
}

function updateChart() {
  const chartPanel = document.getElementById("chart-panel");
  chartPanel.innerHTML = "";

  const totals = {};
  expenses.forEach(exp => {
    totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
  });

  const totalSpent = Object.values(totals).reduce((a, b) => a + b, 0);
  if (!totalSpent) return;

  Object.entries(totals).forEach(([category, amount]) => {
    const percent = ((amount / totalSpent) * 100).toFixed(1);
    const div = document.createElement("div");
    div.className = "chart-segment";
    div.style.backgroundColor = categoryColors[category];
    div.textContent = `${category}: $${amount.toFixed(2)} (${percent}%)`;
    chartPanel.appendChild(div);
  });
}

function updateBalanceDisplay() {
  document.getElementById("current-balance-text").textContent = `$${currentBalance.toFixed(2)}`;
  document.getElementById("inline-current-balance").textContent = `$${currentBalance.toFixed(2)}`;
}

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

document.getElementById("expense-form").addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("expense-name").value;
  const amount = parseFloat(document.getElementById("expense-amount").value);
  const category = document.getElementById("expense-category").value;

  if (!name || isNaN(amount) || !category) return;

  expenses.push({ name, amount, category });
  currentBalance -= amount;
  updateBalanceDisplay();

  const li = document.createElement("li");
  li.textContent = `${name} - $${amount.toFixed(2)} (${category})`;
  document.getElementById("expense-list").appendChild(li);

  updateChart();
  e.target.reset();
});

document.getElementById("deposit-form").addEventListener("submit", e => {
  e.preventDefault();
  const deposit = parseFloat(document.getElementById("deposit-amount").value);
  if (!isNaN(deposit)) {
    currentBalance += deposit;
    updateBalanceDisplay();
    e.target.reset();
  }
});

document.getElementById("edit-balance-btn").addEventListener("click", () => {
  document.getElementById("balance-editor").classList.toggle("hidden");
});

document.getElementById("save-balance-btn").addEventListener("click", () => {
  const newBalance = parseFloat(document.getElementById("bank-balance").value);
  if (!isNaN(newBalance)) {
    currentBalance = newBalance;
    updateBalanceDisplay();
    document.getElementById("bank-balance").value = "";
    document.getElementById("balance-editor").classList.add("hidden");
  }
});

document.getElementById("export-btn").addEventListener("click", () => {
  let csv = "Name,Amount,Category\n";
  expenses.forEach(exp => {
    csv += `${exp.name},${exp.amount.toFixed(2)},${exp.category}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "expenses.csv";
  a.click();
});

populateCategories();
updateBalanceDisplay();
