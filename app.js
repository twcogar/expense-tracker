let currentBalance = 0;
let expenses = [];
let chart;

document.addEventListener("DOMContentLoaded", () => {
  const expenseForm = document.getElementById("expense-form");
  const expenseList = document.getElementById("expense-list");
  const depositForm = document.getElementById("deposit-form");
  const balanceBtn = document.getElementById("edit-balance-btn");
  const saveBalanceBtn = document.getElementById("save-balance-btn");
  const balanceEditor = document.getElementById("balance-editor");
  const balanceInput = document.getElementById("bank-balance");
  const exportBtn = document.getElementById("export-btn");
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  function updateBalanceDisplay() {
    document.getElementById("inline-current-balance").textContent = `$${currentBalance.toFixed(2)}`;
  }

  function renderExpenses() {
    expenseList.innerHTML = "";
    expenses.forEach((e, i) => {
      const li = document.createElement("li");
      li.textContent = `${e.name} - $${e.amount.toFixed(2)} (${e.category})`;
      const className = `category-${e.category.toLowerCase().replace(/ /g, "-")}`;
      li.classList.add(className);
      expenseList.appendChild(li);
    });
    updateChart();
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
    const colors = labels.map((cat) =>
      getComputedStyle(document.documentElement)
        .getPropertyValue(`--${cat.toLowerCase().replace(/ /g, "-")}-color`) || getRandomColor()
    );

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
    });
  }

  function getRandomColor() {
    return "#" + Math.floor(Math.random() * 16777215).toString(16);
  }

  expenseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("expense-name").value;
    const amount = parseFloat(document.getElementById("expense-amount").value);
    const category = document.getElementById("expense-category").value;

    if (!name || isNaN(amount) || !category) return;

    expenses.push({ name, amount, category });
    currentBalance -= amount;
    updateBalanceDisplay();
    renderExpenses();
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

  balanceBtn.addEventListener("click", () => {
    balanceEditor.classList.toggle("hidden");
  });

  saveBalanceBtn.addEventListener("click", () => {
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

  updateBalanceDisplay();
});
