// ========== GİRİŞ KONTROLÜ ==========
window.userData = JSON.parse(localStorage.getItem('user'));

if (!window.userData) {
    window.location.href = 'login.html'; 
}

// ========== UYGULAMA BAŞLATICI ==========
async function init() {
    // loadBooks'u modules.js'den çağır
    if (typeof window.loadBooks === 'function') {
        await window.loadBooks();
    } else {
        console.error("loadBooks fonksiyonu bulunamadı!");
    }
    
    if (window.userData.role === 'admin') {
        if (typeof window.loadChart === 'function') await window.loadChart();
        if (typeof window.loadSalesCountChart === 'function') await window.loadSalesCountChart();
    }
}

init();