const form = document.getElementById('expense-form');
const nameInput = document.getElementById('name');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const list = document.getElementById('expense-list');
const ctx = document.getElementById('expense-chart').getContext('2d');

// Balance editing elements
const balanceDisplay = document.getElementById('balance-display');
const balanceEditor = document.getElementById('balance-editor');
const currentBalanceText = document.getElementById('current-balance-text');
const editBalanceBtn = document.getElementById('edit-balance-btn');
const saveBalanceBtn = document.getElementById('save-balance-btn');
const bankBalanceInput = document.getElementById('bank-balance');
const remainingBalanceSpan = document.getElementById('remaining-balance');

// Budget elements
const toggleBudgetPanelBtn = document.getElementById('toggle-budget-panel');
const budgetPanel = document.getElementById('budget-panel');
const budgetInputsDiv = document.getElementById('budget-inputs');
const saveBudgetsBtn = document.getElementById('save-budgets-btn');
const budgetProgressContainer = document.getElementById('budget-progress-container');

// Categories list (ensure it matches the select options)
const categoriesList = [
    'Food', 'Housing', 'Utilities', 'Transportation', 'Entertainment',
    'Healthcare', 'Insurance', 'Loans', 'Credit Card',
    'Education', 'Personal', 'Miscellaneous'
];

// Load data from localStorage
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let bankBalance = parseFloat(localStorage.getItem('bankBalance')) || 0;
let budgets = JSON.parse(localStorage.getItem('budgets')) || {};

// Initialize Chart.js pie chart
let chart = new Chart(ctx, {
    type: 'pie',
    data: {
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                '#FF9F40', '#C9CBCF', '#B552DB', '#00BFA6', '#F38C8C'
            ]
        }]
    },
    options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } }
    }
});

// Currency formatter
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

// Show/hide balance display/editor
function showBalanceDisplay() {
    currentBalanceText.textContent = `Current Balance: ${formatCurrency(bankBalance)}`;
    balanceDisplay.classList.remove('hidden');
    balanceEditor.classList.add('hidden');
}
function showBalanceEditor() {
    bankBalanceInput.value = bankBalance;
    balanceDisplay.classList.add('hidden');
    balanceEditor.classList.remove('hidden');
}

// On initial load, show either display or editor depending on whether a balance exists
if (bankBalance === 0) {
    showBalanceEditor();
} else {
    showBalanceDisplay();
}

// Update the pie chart data
function updateChart() {
    const categories = {};
    expenses.forEach(({ category, amount }) => {
        categories[category] = (categories[category] || 0) + amount;
    });
    chart.data.labels = Object.keys(categories);
    chart.data.datasets[0].data = Object.values(categories);
    chart.update();
}

// Update the remaining balance display
function updateRemainingBalance() {
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const remaining = bankBalance - totalExpenses;
    remainingBalanceSpan.textContent = `Remaining Balance: ${formatCurrency(remaining)}`;
    remainingBalanceSpan.classList.remove('positive', 'negative');
    remainingBalanceSpan.classList.add(remaining >= 0 ? 'positive' : 'negative');
}

// Render the expense list with delete buttons
function renderList() {
    list.innerHTML = '';
    expenses.forEach(({ name, amount, category }, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${name} - ${formatCurrency(amount)} [${category}]</span>`;
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.addEventListener('click', () => {
            expenses.splice(index, 1);
            localStorage.setItem('expenses', JSON.stringify(expenses));
            renderList();
            updateChart();
            updateRemainingBalance();
            updateProgressBars();
        });
        li.appendChild(deleteBtn);
        list.appendChild(li);
    });
}

// Generate budget input fields based on the categories
function generateBudgetInputs() {
    budgetInputsDiv.innerHTML = '';
    categoriesList.forEach(cat => {
        const group = document.createElement('div');
        group.className = 'budget-input-group';
        const label = document.createElement('label');
        label.textContent = cat;
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '0';
        input.step = '0.01';
        input.dataset.category = cat;
        input.value = budgets[cat] !== undefined ? budgets[cat] : '';
        group.appendChild(label);
        group.appendChild(input);
        budgetInputsDiv.appendChild(group);
    });
}

// Update progress bars based on current expenses and budgets
function updateProgressBars() {
    budgetProgressContainer.innerHTML = '';
    categoriesList.forEach(cat => {
        const budgetValue = parseFloat(budgets[cat]);
        if (budgetValue > 0) {
            const spent = expenses
                .filter(exp => exp.category === cat)
                .reduce((sum, exp) => sum + exp.amount, 0);
            const ratio = spent / budgetValue;
            // Create progress bar elements
            const barDiv = document.createElement('div');
            barDiv.className = 'progress-bar';
            const labelDiv = document.createElement('div');
            labelDiv.className = 'progress-label';
            labelDiv.innerHTML = `<span>${cat}</span><span>${formatCurrency(spent)} / ${formatCurrency(budgetValue)}</span>`;
            const progress = document.createElement('div');
            progress.className = 'progress';
            const fill = document.createElement('div');
            fill.className = 'progress-fill';
            fill.style.width = `${Math.min(ratio * 100, 100)}%`;
            // Colour based on ratio
            if (ratio < 0.7) {
                fill.style.backgroundColor = '#28a745'; // green
            } else if (ratio <= 1) {
                fill.style.backgroundColor = '#ffc107'; // yellow
            } else {
                fill.style.backgroundColor = '#dc3545'; // red
            }
            progress.appendChild(fill);
            barDiv.appendChild(labelDiv);
            barDiv.appendChild(progress);
            budgetProgressContainer.appendChild(barDiv);
        }
    });
}

// Toggle the budget panel
toggleBudgetPanelBtn.addEventListener('click', () => {
    if (budgetPanel.classList.contains('hidden')) {
        generateBudgetInputs();
        budgetPanel.classList.remove('hidden');
    } else {
        budgetPanel.classList.add('hidden');
    }
});

// Save budgets and update progress bars
saveBudgetsBtn.addEventListener('click', () => {
    const inputs = budgetInputsDiv.querySelectorAll('input');
    inputs.forEach(input => {
        const category = input.dataset.category;
        const value = parseFloat(input.value);
        if (!isNaN(value) && value > 0) {
            budgets[category] = value;
        } else {
            delete budgets[category];
        }
    });
    localStorage.setItem('budgets', JSON.stringify(budgets));
    updateProgressBars();
    budgetPanel.classList.add('hidden');
});

// Handle adding a new expense
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;
    if (!name || isNaN(amount) || !category) return;
    expenses.push({ name, amount, category });
    localStorage.setItem('expenses', JSON.stringify(expenses));
    renderList();
    updateChart();
    updateRemainingBalance();
    updateProgressBars();
    form.reset();
    categorySelect.selectedIndex = 0;
});

// Edit and save bank balance
editBalanceBtn.addEventListener('click', showBalanceEditor);
saveBalanceBtn.addEventListener('click', () => {
    const value = parseFloat(bankBalanceInput.value);
    bankBalance = isNaN(value) ? 0 : value;
    localStorage.setItem('bankBalance', bankBalance);
    updateRemainingBalance();
    showBalanceDisplay();
    updateProgressBars();
});

// Initial render
renderList();
updateChart();
updateRemainingBalance();
updateProgressBars();

// Excel export
async function exportToExcel() {
    if (expenses.length === 0) {
        alert('No expenses to export.');
        return;
    }
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Expense Tracker';
    const sheet = workbook.addWorksheet('Expenses');
    sheet.columns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Amount ($)', key: 'amount', width: 15 },
        { header: 'Category', key: 'category', width: 20 }
    ];
    expenses.forEach(exp => {
        sheet.addRow({ name: exp.name, amount: exp.amount, category: exp.category });
    });
    sheet.getColumn('amount').numFmt = '$0.00';

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Total Amount ($)', key: 'total', width: 20 }
    ];
    const totals = {};
    expenses.forEach(exp => {
        totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
    });
    Object.entries(totals).forEach(([cat, total]) => {
        summarySheet.addRow({ category: cat, total });
    });
    summarySheet.getColumn('total').numFmt = '$0.00';

    // Embed the pie chart
    const chartDataURL = chart.toBase64Image();
    const imageId = workbook.addImage({
        base64: chartDataURL,
        extension: 'png'
    });
    summarySheet.addImage(imageId, {
        tl: { col: 0, row: 4 },
        ext: { width: 500, height: 300 }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

document.getElementById('export-btn').addEventListener('click', exportToExcel);
