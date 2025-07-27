let currentBalance = 0;
const expenses = [];
const budgets = {};
const categories = [
  "Credit Card", "Dining", "Entertainment", "Groceries", "Insurance", "Loans",
  "Medical", "Other", "Rent", "Subscriptions", "Transport", "Utilities"
];

// Populate dropdowns and budget panel
function populateCategories() {
  const categorySelect = document.getElementById("expense-category");
  const budgetSettings = document.getElementById("budget-settings");

  categorySelect.innerHTML = `<option value="">Select Category</option>`;
  categories.sort().forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);

    // Budget input
    const div = document.createElement("div");
    div.innerHTML = `
      <label>${cat} Budget: </label>
      <input type="number" step="0.01" class="budget-input" data-category="${cat}" />
    `;
    budgetSettings.appendChild(div);
  });
}

// Update chart
function updateChart() {
  const chartPanel = document.getElementById("chart-panel");
  chartPanel.innerHTML = "";
  const totals = {};

  expenses.forEach(exp => {
    totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
  });

  const totalSpending = Object.values(totals).reduce((a, b) => a + b, 0);
  if (!totalSpending) return;

  Object.keys(totals).forEach(cat => {
    const percent = ((totals[cat] / totalSpending) * 100).toFixed(1);
    const slice = document.createElement("div");
    slice.textContent = `${cat}: $${totals[cat].toFixed(2)} (${percent}%)`;
    slice.style.padding = "4px";
    chartPanel.appendChild(slice);
  });
}

// Tab switching
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// Expense submission
document.getElementById("expense-form").addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("expense-name").value;
  const amount = parseFloat(document.getElementById("expense-amount").value);
  const category = document.getElementById("expense-category").value;

  if (!name || !amount || !category) return;

  expenses.push({ name, amount, category });
  currentBalance -= amount;
  updateBalanceDisplay();

  const li = document.createElement("li");
  li.textContent = `${name} - $${amount.toFixed(2)} (${category})`;
  document.getElementById("expense-list").appendChild(li);

  updateChart();
  document.getElementById("expense-form").reset();
});

// Deposit
document.getElementById("deposit-form").addEventListener("submit", e => {
  e.preventDefault();
  const deposit = parseFloat(document.getElementById("deposit-amount").value);
  if (!isNaN(deposit)) {
    currentBalance += deposit;
    updateBalanceDisplay();
    document.getElementById("deposit-form").reset();
  }
});

// Balance editing
document.getElementById("edit-balance-btn").addEventListener("click", () => {
  document.getElementById("balance-editor").classList.toggle("hidden");
});

document.getElementById("save-balance-btn").addEventListener("click", () => {
  const newBal = parseFloat(document.getElementById("bank-balance").value);
  if (!isNaN(newBal)) {
    currentBalance = newBal;
    updateBalanceDisplay();
    document.getElementById("balance-editor").classList.add("hidden");
    document.getElementById("bank-balance").value = "";
  }
});

function updateBalanceDisplay() {
  document.getElementById("current-balance-text").textContent = `$${currentBalance.toFixed(2)}`;
  document.getElementById("inline-current-balance").textContent = `$${currentBalance.toFixed(2)}`;
}

// Export CSV
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
