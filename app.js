document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab-btn");
  const contents = document.querySelectorAll(".tab-content");
  const form = document.getElementById("expense-form");
  const list = document.getElementById("expense-list");
  const chartCanvas = document.getElementById("expense-chart");
  const exportBtn = document.getElementById("export-btn");
  const balanceEditor = document.getElementById("balance-editor");
  const bankBalanceInput = document.getElementById("bank-balance");
  const saveBalanceBtn = document.getElementById("save-balance-btn");
  const currentBalanceText = document.getElementById("current-balance-text");
  const editBalanceBtn = document.getElementById("edit-balance-btn");
  const remainingBalanceDisplay = document.getElementById("remaining-balance");
  const budgetSettings = document.getElementById("budget-settings");
  const saveBudgetsBtn = document.getElementById("save-budgets-btn");
  const budgetBars = document.getElementById("budget-bars");

  let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
  let budgets = JSON.parse(localStorage.getItem("budgets")) || {};
  let bankBalance = parseFloat(localStorage.getItem("bankBalance")) || 0;

  const chart = new Chart(chartCanvas, {
    type: "pie",
    data: {
      labels: [],
      datasets: [{
        label: "Expenses",
        data: [],
        backgroundColor: []
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      tabs.forEach(b => b.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("expense-name").value.trim();
    const amount = parseFloat(document.getElementById("expense-amount").value);
    const category = document.getElementById("expense-category").value;
    if (!name || isNaN(amount) || !category) return;

    expenses.push({ name, amount, category });
    localStorage.setItem("expenses", JSON.stringify(expenses));
    form.reset();
    updateUI();
  });

  exportBtn.addEventListener("click", () => {
    const rows = [["Name", "Amount", "Category"], ...expenses.map(e => [e.name, e.amount, e.category])];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "expenses.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  window.removeExpense = function(index) {
    expenses.splice(index, 1);
    localStorage.setItem("expenses", JSON.stringify(expenses));
    updateUI();
  };

  editBalanceBtn.addEventListener("click", () => {
    balanceEditor.classList.toggle("hidden");
  });

  saveBalanceBtn.addEventListener("click", () => {
    const val = parseFloat(bankBalanceInput.value);
    if (!isNaN(val)) {
      bankBalance = val;
      localStorage.setItem("bankBalance", bankBalance);
      balanceEditor.classList.add("hidden");
      updateUI();
    }
  });

  function buildBudgetSettings() {
    budgetSettings.innerHTML = "";
    const uniqueCategories = [...new Set(expenses.map(e => e.category))];
    uniqueCategories.forEach(cat => {
      const div = document.createElement("div");
      div.innerHTML = `
        <label>${cat}: </label>
        <input type="number" step="0.01" value="${budgets[cat] || ''}" data-cat="${cat}" />
      `;
      budgetSettings.appendChild(div);
    });
  }

  saveBudgetsBtn.addEventListener("click", () => {
    const inputs = budgetSettings.querySelectorAll("input");
    inputs.forEach(input => {
      const cat = input.dataset.cat;
      const val = parseFloat(input.value);
      if (!isNaN(val)) budgets[cat] = val;
    });
    localStorage.setItem("budgets", JSON.stringify(budgets));
    updateUI();
  });

  function updateUI() {
    list.innerHTML = "";
    expenses.forEach((e, i) => {
      const li = document.createElement("li");
      li.innerHTML = `${e.name} - $${e.amount.toFixed(2)} - ${e.category} <button onclick="removeExpense(${i})">Delete</button>`;
      list.appendChild(li);
    });

    const totals = {};
    expenses.forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });

    chart.data.labels = Object.keys(totals);
    chart.data.datasets[0].data = Object.values(totals);
    chart.data.datasets[0].backgroundColor = chart.data.labels.map(() => `hsl(${Math.random() * 360}, 60%, 70%)`);
    chart.update();

    currentBalanceText.textContent = `$${bankBalance.toFixed(2)}`;
    const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
    remainingBalanceDisplay.textContent = `Remaining Balance: $${(bankBalance - spent).toFixed(2)}`;

    buildBudgetSettings();
    budgetBars.innerHTML = "";
    Object.keys(budgets).forEach(cat => {
      const limit = budgets[cat];
      const used = totals[cat] || 0;
      const percent = Math.min((used / limit) * 100, 100);
      const bar = document.createElement("div");
      bar.classList.add("progress");
      const barColor = percent >= 100 ? "red" : percent >= 70 ? "yellow" : "green";
      bar.innerHTML = `<div class="bar ${barColor}" style="width:${percent}%">${used.toFixed(2)} / ${limit.toFixed(2)}</div>`;
      budgetBars.appendChild(bar);
    });
  }

  updateUI();
});
