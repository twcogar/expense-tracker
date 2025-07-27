let currentBalance = 0;
const expenses = [];
const budgets = {};
const categories = [
  "Credit Card", "Dining", "Entertainment", "Groceries", "Insurance", "Loans",
  "Medical", "Other", "Rent", "Subscriptions", "Transport", "Utilities"
];

// Populate category dropdown and budget input fields
function populateCategories() {
  const expenseCategory = document.getElementById("expense-category");
  const budgetSettings = document.getElementById("budget-settings");

  expenseCategory.innerHTML = `<option value="">Select Category</option>`;
  categories.sort().forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    expenseCategory.appendChild(option);

    // Create budget setting row
    const budgetRow = document.createElement("div");
    budgetRow.innerHTML = `
      <label>${category} Budget: </label>
      <input type="number" step="0.01" class="budget-input" data-category="${category}" />
    `;
    budgetSettings.appendChild(budgetRow);
  });
}

// Update chart display
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
    div.textContent = `${category}: $${amount.toFixed(2)} (${percent}%)`;
    div.style.padding = "4px";
    chartPanel.appendChild(div);
  });
}

// Update balance text in multiple places
function updateBalanceDisplay() {
  document.getElementById("current-balance-text").textContent = `$${currentBalance.toFixed(2)}`;
  document.getElementById("inline-current-balance").textContent = `$${currentBalance.toFixed(2)}`;
}

// Switch tabs
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// Handle expense submission
document.getElementById("expense-form").addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("expense-name").value;
  const amount = parseFloat(document.getElementById("expense-amount").value);
  const category = document.getElementById("expense-category").value;

  if (!name || !amount || !category || isNaN(amount)) return;

  expenses.push({ name, amount, category });
  currentBalance -= amount;
  updateBalanceDisplay();

  const li = document.createElement("li");
  li.textContent = `${name} - $${amount.toFixed(2)} (${category})`;
  document.getElementById("expense-list").appendChild(li);

  updateChart();
  e.target.reset();
});

// Handle deposit
document.getElementById("deposit-form").addEventListener("submit", e => {
  e.preventDefault();
  const deposit = parseFloat(document.getElementById("deposit-amount").value);
  if (!isNaN(deposit)) {
    currentBalance += deposit;
    updateBalanceDisplay();
    e.target.reset();
  }
});

// Toggle balance editor
document.getElementById("edit-balance-btn").addEventListener("click", () => {
  document.getElementById("balance-editor").classList.toggle("hidden");
});

// Save balance update
document.getElementById("save-balance-btn").addEventListener("click", () => {
  const newBalance = parseFloat(document.getElementById("bank-balance").value);
  if (!isNaN(newBalance)) {
    currentBalance = newBalance;
    updateBalanceDisplay();
    document.getElementById("bank-balance").value = "";
    document.getElementById("balance-editor").classList.add("hidden");
  }
});

// Export to CSV
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

// Initialize
populateCategories();
updateBalanceDisplay();
