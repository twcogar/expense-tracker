// DOM Elements
const form = document.getElementById('expense-form');
const nameInput = document.getElementById('expense-name');
const amountInput = document.getElementById('expense-amount');
const categoryInput = document.getElementById('expense-category');
const list = document.getElementById('expense-list');
const chartCanvas = document.getElementById('expense-chart');
const exportBtn = document.getElementById('export-btn');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

const balanceEditor = document.getElementById('balance-editor');
const bankBalanceInput = document.getElementById('bank-balance');
const saveBalanceBtn = document.getElementById('save-balance-btn');
const currentBalanceText = document.getElementById('current-balance-text');
const editBalanceBtn = document.getElementById('edit-balance-btn');
const remainingBalanceDisplay = document.getElementById('remaining-balance');

const budgetSettings = document.getElementById('budget-settings');
const saveBudgetsBtn = document.getElementById('save-budgets-btn');
const budgetBars = document.getElementById('budget-bars');

let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let budgets = JSON.parse(localStorage.getItem('budgets')) || {};
let bankBalance = parseFloat(localStorage.getItem('bankBalance')) || 0;

// CHART SETUP
let chart = new Chart(chartCanvas, {
    type: 'pie',
    data: {
        labels: [],
        datasets: [{
            label: 'Expenses',
            data: [],
            backgroundColor: []
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false
    }
});

// EVENT LISTENERS
form.addEventListener('submit', e => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categoryInput.value;
    if (!name || !amount || !category) return;

    const expense = { name, amount, category };
    expenses.push(expense);
    localStorage.setItem('expenses', JSON.stringify(expenses));

    nameInput.value = '';
    amountInput.value = '';
    categoryInput.value = '';
    updateUI();
});

exportBtn.addEventListener('click', () => {
    const rows = [
        ['Name', 'Amount', 'Category'],
        ...expenses.map(e => [e.name, e.amount, e.category])
    ];
    let csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.download = 'expenses.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

// BALANCE
editBalanceBtn.addEventListener('click', () => {
    balanceEditor.classList.toggle('hidden');
});

saveBalanceBtn.addEventListener('click', () => {
    const balance = parseFloat(bankBalanceInput.value);
    if (!isNaN(balance)) {
        bankBalance = balance;
        localStorage.setItem('bankBalance', bankBalance);
        updateUI();
        balanceEditor.classList.add('hidden');
    }
});

// BUDGETS
function buildBudgetSettings() {
    budgetSettings.innerHTML = '';
    const categories = [...new Set(expenses.map(e => e.category))];
    categories.forEach(cat => {
        const div = document.createElement('div');
        div.innerHTML = `
            <label>${cat}: </label>
            <input type="number" step="0.01" value="${budgets[cat] || ''}" data-cat="${cat}" />
        `;
        budgetSettings.appendChild(div);
    });
}

saveBudgetsBtn.addEventListener('click', () => {
    const inputs = budgetSettings.querySelectorAll('input');
    inputs.forEach(input => {
        const cat = input.dataset.cat;
        const val = parseFloat(input.value);
        if (!isNaN(val)) {
            budgets[cat] = val;
        }
    });
    localStorage.setItem('budgets', JSON.stringify(budgets));
    updateUI();
});

// DELETE EXPENSE
function removeExpense(index) {
    expenses.splice(index, 1);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    updateUI();
}

// UI RENDER
function updateUI() {
    // Expense List
    list.innerHTML = '';
    expenses.forEach((e, i) => {
        const li = document.createElement('li');
        li.innerHTML = `${e.name} - $${e.amount.toFixed(2)} - ${e.category}
            <button onclick="removeExpense(${i})" style="float:right">Delete</button>`;
        list.appendChild(li);
    });

    // Chart
    const totals = {};
    expenses.forEach(e => {
        totals[e.category] = (totals[e.category] || 0) + e.amount;
    });

    chart.data.labels = Object.keys(totals);
    chart.data.datasets[0].data = Object.values(totals);
    chart.data.datasets[0].backgroundColor = chart.data.labels.map(() =>
        `hsl(${Math.random() * 360}, 60%, 70%)`
    );
    chart.update();

    // Balance Display
    currentBalanceText.textContent = `$${bankBalance.toFixed(2)}`;
    const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = bankBalance - spent;
    remainingBalanceDisplay.textContent = `Remaining Balance: $${remaining.toFixed(2)}`;

    // Budgets
    buildBudgetSettings();
    budgetBars.innerHTML = '';
    Object.keys(budgets).forEach(cat => {
        const limit = budgets[cat];
        const used = totals[cat] || 0;
        const percent = Math.min((used / limit) * 100, 100);
        let color = 'green';
        if (percent >= 100) color = 'red';
        else if (percent >= 70) color = 'yellow';

        const bar = document.createElement('div');
        bar.classList.add('progress');
        bar.innerHTML = `
            <div class="bar ${color}" style="width:${percent}%">
                ${used.toFixed(2)} / ${limit.toFixed(2)}
            </div>
        `;
        budgetBars.appendChild(bar);
    });
}

// GLOBAL DELETE HANDLER
window.removeExpense = removeExpense;

// INIT
updateUI();
