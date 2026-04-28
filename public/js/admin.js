// ========== ADMIN FONKSİYONLARI ==========
async function adminReset() {
    if(confirm("Sistem sıfırlanacak. Emin misiniz?")) {
        const response = await API.post('/reset', {});
        const result = await response.json();
        alert(result.message);
        if (typeof window.loadBooks === 'function') await window.loadBooks();
        if (typeof window.loadChart === 'function') await window.loadChart();
        if (typeof window.loadSalesCountChart === 'function') await window.loadSalesCountChart();
    }
}

async function generateMockSales() {
    try {
        const response = await API.post('/generate-mock-sales', {});
        const result = await response.json();
        alert(result.message);
        if (typeof window.loadChart === 'function') await window.loadChart();
        if (typeof window.loadSalesCountChart === 'function') await window.loadSalesCountChart();
    } catch (error) {
        console.error("Veri üretme hatası:", error);
        alert("Sunucuya bağlanılamadı.");
    }
}

// Event listener'lar
document.addEventListener('DOMContentLoaded', () => {
    const resetBtn = document.getElementById('reset-btn');
    if(resetBtn) {
        resetBtn.addEventListener('click', adminReset);
    }

    const mockBtn = document.getElementById('mock-data-btn');
    if (mockBtn) {
        mockBtn.onclick = generateMockSales;
    }
});

// Global'e expose
window.adminReset = adminReset;
window.generateMockSales = generateMockSales;