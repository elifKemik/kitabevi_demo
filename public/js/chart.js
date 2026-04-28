// ========== GRAFİK FONKSİYONLARI ==========
let myChart;
let salesCountChart;

async function loadChart() {
    const canvas = document.getElementById('revenueChart');
    if (!canvas) return; 
    try {
        const data = await API.get('/revenue');
        const ctx = canvas.getContext('2d');
        
        if (myChart) myChart.destroy(); 

        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Monthly Revenue',
                    data: data.map(d => d.total),
                    borderColor: '#2c3e50',
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderWidth: 4,
                    pointBackgroundColor: '#e74c3c',
                    pointRadius: 5,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    } catch (error) {
        console.error("Grafik hatası:", error);
    }
}

async function loadSalesCountChart() {
    const canvas = document.getElementById('salesCountChart');
    if (!canvas) return; 
    try {
        const data = await API.get('/sales-count');
        const ctx = canvas.getContext('2d');
        
        if (salesCountChart) salesCountChart.destroy(); 

        salesCountChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Satılan Kitap Sayısı (Adet)',
                    data: data.map(d => d.count),
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.2)',
                    borderWidth: 4,
                    pointBackgroundColor: '#2c3e50',
                    pointRadius: 5,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    } catch (error) {
        console.error("Satış adedi grafiği hatası:", error);
    }
}

// Global'e expose
window.loadChart = loadChart;
window.loadSalesCountChart = loadSalesCountChart;