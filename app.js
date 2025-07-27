const form = document.getElementById('expense-form');
const nameInput = document.getElementById('name');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const list = document.getElementById('expense-list');
const ctx = document.getElementById('expense-chart').getContext('2d');

// Load existing expenses from localStorage or start with an empty array
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

// Initialise the pie chart
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
            legend: {
                position: 'bottom'
            }
        }
    }
});

// Format numbers as US dollars
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

// Update the chart based on current expenses
function updateChart() {
    const categories = {};
    expenses.forEach(({ category, amount }) => {
        categories[category] = (categories[category] || 0) + amount;
    });
    chart.data.labels = Object.keys(categories);
    chart.data.datasets[0].data = Object.values(categories);
    chart.update();
}

// Render the list of expenses with delete buttons
function renderList() {
    list.innerHTML = '';
    expenses.forEach(({ name, amount, category }, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${name} - ${formatCurrency(amount)} [${category}]</span>`;
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.addEventListener('click', () => {
            // Remove the selected expense
            expenses.splice(index, 1);
            localStorage.setItem('expenses', JSON.stringify(expenses));
            renderList();
            updateChart();
        });
        li.appendChild(deleteBtn);
        list.appendChild(li);
    });
}

// Handle form submission
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
    form.reset();
    // Reset category select to default option
    categorySelect.selectedIndex = 0;
});

// Initial render when the page loads
renderList();
updateChart();
