// ========== YETKİ FONKSİYONLARI ==========
function checkPermissions() {
    const resetBtn = document.getElementById('reset-btn');
    const adminActions = document.getElementById('admin-actions');
    const chartSections = document.querySelectorAll('.chart-container');
    const actionHeader = document.getElementById('action-header');
    const mockBtn = document.getElementById('mock-data-btn');
    const cartPanel = document.getElementById('user-cart-panel');

    if (window.userData && window.userData.role === 'admin') {
        if (resetBtn) resetBtn.style.display = 'block';
        if (adminActions) adminActions.style.display = 'block';
        chartSections.forEach(section => section.style.display = 'block');
        if (actionHeader) actionHeader.style.display = 'table-cell';
        if (mockBtn) mockBtn.style.display = 'inline-block';
        if (cartPanel) cartPanel.style.display = 'none';
    } else if (window.userData && window.userData.role === 'user') {
        if (resetBtn) resetBtn.style.display = 'none';
        if (adminActions) adminActions.style.display = 'none';
        chartSections.forEach(section => section.style.display = 'none');
        if (actionHeader) actionHeader.style.display = 'table-cell';
        if (mockBtn) mockBtn.style.display = 'none';
        if (cartPanel) cartPanel.style.display = 'block';
    }
}

// Global'e expose
window.checkPermissions = checkPermissions;