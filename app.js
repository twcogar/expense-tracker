const form = document.getElementById('expense-form');
const nameInput = document.getElementById('name');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const list = document.getElementById('expense-list');
const ctx = document.getElementById('expense-chart').getContext('2d');

// Elements related to bank balance editing
const balanceDisplay = document.getElementById('balance-display');
const balanceEditor = document.getElementById('balance-editor');
const currentBalanceText = document.getElementById('current-balance-text');
const editBalanceBtn = document.getElementById('edit-balance-btn');
const saveBalanceBtn = document.getElementById('save-balance-btn');
const bankBalanceInput = document.getElementById('bank-balance');
const remainingBalanceSpan = document.getElementById('remaining-balance');

// Load existing data from localStorage
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let bankBalance = parseFloat(localStorage.getItem('bankBalance')) || 0;

// Initialize the pie chart
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
        plugins: {
            legend: { position: 'bottom' }
        }
    }
});

// Format numbers as US dollars
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

// Show or hide balance display/editor
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

// On initial load, decide whether to show display or editor
if (bankBalance === 0) {
    showBalanceEditor();
} else {
    showBalanceDisplay();
}

// Update the chart based on expenses
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

// Render the list with delete buttons
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
        });
        li.appendChild(deleteBtn);
        list.appendChild(li);
    });
}

// Handle adding a new expense
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;
    if (!name || isNaN(amount) || !category) {
        return;
    }
    expenses.push({ name, amount, category });
    localStorage.setItem('expenses', JSON.stringify(expenses));
    renderList();
    updateChart();
    updateRemainingBalance();
    form.reset();
    categorySelect.selectedIndex = 0;
});

// Event handlers for editing and saving balance
editBalanceBtn.addEventListener('click', () => {
    showBalanceEditor();
});
saveBalanceBtn.addEventListener('click', () => {
    const value = parseFloat(bankBalanceInput.value);
    bankBalance = isNaN(value) ? 0 : value;
    localStorage.setItem('bankBalance', bankBalance);
    updateRemainingBalance();
    showBalanceDisplay();
});

// Initial render
renderList();
updateChart();
updateRemainingBalance();

// Export to Excel using ExcelJS
async function exportToExcel() {
    if (expenses.length === 0) {
        alert('No expenses to export.');
        return;
    }
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Expense Tracker';
    // Sheet with raw data
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
    Object.entries(totals).forEach(([category, total]) => {
        summarySheet.addRow({ category, total });
    });
    summarySheet.getColumn('total').numFmt = '$0.00';
    // Embed chart image
    const chartDataURL = chart.toBase64Image();
    const imageId = workbook.addImage({ base64: chartDataURL, extension: 'png' });
    summarySheet.addImage(imageId, {
        tl: { col: 0, row: 4 },
        ext: { width: 500, height: 300 }
    });
    // Create and download the file
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
