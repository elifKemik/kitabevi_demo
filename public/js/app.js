// ========== GİRİŞ KONTROLÜ ==========
const userData = JSON.parse(localStorage.getItem('user'));
if (!userData) {
    window.location.href = 'login.html'; 
}

// ========== UYGULAMA BAŞLATICI ==========
async function init() {
    await loadBooks();
    if (userData.role === 'admin') await loadChart();
}

init();