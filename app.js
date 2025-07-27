const form = document.getElementById('expense-form');
const list = document.getElementById('expense-list');
const ctx = document.getElementById('expense-chart').getContext('2d');

let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

let chart = new Chart(ctx, {
    type: 'pie',
    data: {
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
        }]
    },
    options: {
        responsive: true
    }
});

function updateChart() {
    const categories = {};
    expenses.forEach(({ category, amount }) => {
        categories[category] = (categories[category] || 0) + amount;
    });
    chart.data.labels = Object.keys(categories);
    chart.data.datasets[0].data = Object.values(categories);
    chart.update();
}

function renderList() {
    list.innerHTML = '';
    expenses.forEach(({ name, amount, category }) => {
        const li = document.createElement('li');
        li.textContent = `${name} - $${amount.toFixed(2)} [${category}]`;
        list.appendChild(li);
    });
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;

    if (!name || isNaN(amount)) return;

    expenses.push({ name, amount, category });
    localStorage.setItem('expenses', JSON.stringify(expenses));

    renderList();
    updateChart();

    form.reset();
});

// Initial render
renderList();
updateChart();
