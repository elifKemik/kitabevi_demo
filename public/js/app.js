// ========== GİRİŞ KONTROLÜ ==========
window.userData = JSON.parse(localStorage.getItem('user'));

if (!window.userData) {
    window.location.href = 'login.html'; 
}

// ========== UYGULAMA BAŞLATICI ==========
async function init() {
    try {
        // Doğrudan fonksiyonları çağır (window olmadan)
        if (typeof loadBooks !== 'undefined') {
            await loadBooks();
        } else {
            console.error("loadBooks tanımlı değil, script sırasını kontrol et");
        }
        
        if (window.userData.role === 'admin') {
            if (typeof loadChart !== 'undefined') await loadChart();
            if (typeof loadSalesCountChart !== 'undefined') await loadSalesCountChart();
        }
    } catch (error) {
        console.error("init hatası:", error);
    }
}

// Sayfa yüklendikten sonra çalıştır
window.addEventListener('load', init);