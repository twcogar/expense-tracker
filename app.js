let expenses = [];
let balance = 0;
let chart;

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initForms();
  updateBalanceDisplay();
  renderChart();
});

function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(tab => tab.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });
}

function initForms() {
  document.getElementById('expense-form').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('expense-name').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;

    if (!name || isNaN(amount) || !category) return;

    expenses.push({ name, amount, category });
    balance -= amount;

    document.getElementById('expense-name').value = '';
    document.getElementById('expense-amount').value = '';
    document.getElementById('expense-category').value = '';

    updateBalanceDisplay();
    renderExpenses();
    renderChart();
  });

  document.getElementById('deposit-form').addEventListener('submit', e => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('deposit-amount').value);
    if (!isNaN(amount)) {
      balance += amount;
      updateBalanceDisplay();
    }
    document.getElementById('deposit-amount').value = '';
  });

  document.getElementById('edit-balance-btn').addEventListener('click', () => {
    document.getElementById('balance-editor').classList.toggle('hidden');
  });

  document.getElementById('save-balance-btn').addEventListener('click', () => {
    const newBalance = parseFloat(document.getElementById('bank-balance').value);
    if (!isNaN(newBalance)) {
      balance = newBalance;
      updateBalanceDisplay();
      document.getElementById('balance-editor').classList.add('hidden');
    }
  });

  document.getElementById('export-btn').addEventListener('click', () => {
    alert("Export to Excel is coming in next patch. It will generate a downloadable .xlsx file with formatted data.");
  });
}

function updateBalanceDisplay() {
  document.getElementById('inline-current-balance').textContent = `$${balance.toFixed(2)}`;
}

function renderExpenses() {
  const list = document.getElementById('expense-list');
  list.innerHTML = '';

  expenses.forEach(exp => {
    const li = document.createElement('li');
    const categoryClass = `category-${exp.category.toLowerCase().replace(/\s/g, '-')}`;
    li.classList.add(categoryClass);
    li.innerHTML = `${exp.name} - $${exp.amount.toFixed(2)} <strong>(${exp.category})</strong>`;
    list.appendChild(li);
  });
}

function renderChart() {
  const chartPanel = document.getElementById('chart-panel');
  chartPanel.innerHTML = '';

  if (expenses.length === 0) return;

  const totals = {};
  expenses.forEach(({ amount, category }) => {
    totals[category] = (totals[category] || 0) + amount;
  });

  const data = {
    labels: Object.keys(totals),
    datasets: [{
      label: 'Spending',
      data: Object.values(totals),
      backgroundColor: generateColors(Object.keys(totals).length),
    }],
  };

  const canvas = document.createElement('canvas');
  chartPanel.appendChild(canvas);

  chart = new Chart(canvas.getContext('2d'), {
    type: 'pie',
    data,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
        },
      },
    }
  });
}

function generateColors(count) {
  const colors = [
    '#3366cc', '#dc3912', '#ff9900', '#109618', '#990099',
    '#0099c6', '#dd4477', '#66aa00', '#b82e2e', '#316395',
    '#994499', '#22aa99', '#aaaa11', '#6633cc', '#e67300',
    '#8b0707', '#651067', '#329262', '#5574a6', '#3b3eac'
  ];
  return colors.slice(0, count);
}
