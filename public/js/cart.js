// ========== SEPET FONKSİYONLARI ==========
let cart = [];

function addToCart(bookId, title, price) {
    const existingItem = cart.find(item => item.id === bookId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id: bookId, title: title, price: price, quantity: 1 });
    }
    
    updateCartUI();
    alert(`${title} sepete eklendi!`);
}

function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    const cartItemsList = document.getElementById('cart-items');

    if (cartCount) cartCount.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    let total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (cartTotal) cartTotal.innerText = total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });

    if (cartItemsList) {
        cartItemsList.innerHTML = cart.map(item => `
            <li>${item.title} x ${item.quantity} - ${(item.price * item.quantity).toFixed(2)} TL</li>
        `).join('');
    }
}

async function checkout() {
    if (cart.length === 0) {
        alert("Sepetiniz boş!");
        return;
    }

    if (!confirm("Sepetteki tüm ürünleri satın almak istiyor musunuz?")) return;

    try {
        for (const item of cart) {
            await API.post('/sell', { 
                book_id: item.id, 
                amount: item.price * item.quantity,
                quantity: item.quantity
            });
        }

        alert("Ödeme başarılı! Siparişiniz alındı.");
        cart = [];
        updateCartUI();
        if (window.userData && window.userData.role === 'admin') {
            if (typeof window.loadChart === 'function') await window.loadChart();
            if (typeof window.loadSalesCountChart === 'function') await window.loadSalesCountChart();
        }
    } catch (error) {
        console.error("Ödeme hatası:", error);
    }
}

// Global'e expose
window.addToCart = addToCart;
window.checkout = checkout;
window.cart = cart;