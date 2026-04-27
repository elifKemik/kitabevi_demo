// ========== SAYFA GEÇİŞLERİ ==========
function switchPage(pageId) {
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active-page');
    });
    document.getElementById(`page-${pageId}`).classList.add('active-page');
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.nav-item[data-page="${pageId}"]`).classList.add('active');
}

// Sadece kitap listesi (books sayfası için)
async function loadBooksOnly() {
    try {
        const books = await API.get('/books');
        const list = document.getElementById('books-only-list');
        if (!list) return;
        list.innerHTML = '';
        
        books.forEach(book => {
            let imageUrl = 'https://via.placeholder.com/50x75?text=Yok';
            if (book.image_url) {
                if (book.image_url.startsWith('http')) imageUrl = book.image_url;
                else imageUrl = `http://localhost:3000${book.image_url}`;
            }
            
            list.innerHTML += `<tr>
                <td><img src="${imageUrl}" width="50" style="border-radius:4px;"></td>
                <td><b>${book.title}</b></td>
                <td>${book.author_name || 'Bilinmiyor'}</td>
                <td>${book.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
            </tr>`;
        });
    } catch (error) {
        console.error("Kitap listesi yüklenirken hata:", error);
    }
}

// Charts sayfası için grafikleri yeniden oluştur
let revenueChart2, salesCountChart2;

async function loadChartsOnly() {
    await loadChart2();
    await loadSalesCountChart2();
}

async function loadChart2() {
    const canvas = document.getElementById('revenueChart2');
    if (!canvas) return;
    try {
        const data = await API.get('/revenue');
        const ctx = canvas.getContext('2d');
        if (revenueChart2) revenueChart2.destroy();
        
        revenueChart2 = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Monthly Revenue (₺)',
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

async function loadSalesCountChart2() {
    const canvas = document.getElementById('salesCountChart2');
    if (!canvas) return;
    try {
        const data = await API.get('/sales-count');
        const ctx = canvas.getContext('2d');
        if (salesCountChart2) salesCountChart2.destroy();
        
        salesCountChart2 = new Chart(ctx, {
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

// Event listener'lar
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', async (e) => {
            const page = item.getAttribute('data-page');
            switchPage(page);
            
            if (page === 'books') {
                await loadBooksOnly();
            } else if (page === 'charts') {
                await loadChartsOnly();
            } else if (page === 'home') {
                await loadBooks();
                if (window.userData?.role === 'admin') {
                    await loadChart();
                    await loadSalesCountChart();
                }
                checkPermissions();
            }
        });
    });
});