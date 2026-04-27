// ========== GLOBAL DEĞİŞKENLER ==========
let myChart;
let cart = [];

// ========== SEPET FONKSİYONLARI ==========
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
            await API.post('/sell', { book_id: item.id, amount: item.price * item.quantity });
        }

        alert("Ödeme başarılı! Siparişiniz alındı.");
        cart = [];
        updateCartUI();
        if (userData.role === 'admin') loadChart();
    } catch (error) {
        console.error("Ödeme hatası:", error);
    }
}

// ========== YETKİ FONKSİYONLARI ==========
function checkPermissions() {
    const resetBtn = document.getElementById('reset-btn');
    const adminActions = document.getElementById('admin-actions');
    const chartSection = document.querySelector('.chart-container');
    const actionHeader = document.getElementById('action-header');
    const mockBtn = document.getElementById('mock-data-btn');
    const cartPanel = document.getElementById('user-cart-panel');

    if (userData && userData.role === 'admin') {
        if (resetBtn) resetBtn.style.display = 'block';
        if (adminActions) adminActions.style.display = 'block';
        if (chartSection) chartSection.style.display = 'block';
        if (actionHeader) actionHeader.style.display = 'table-cell';
        if (mockBtn) mockBtn.style.display = 'inline-block';
        if (cartPanel) cartPanel.style.display = 'none';
    } else if (userData && userData.role === 'user') {
        if (resetBtn) resetBtn.style.display = 'none';
        if (adminActions) adminActions.style.display = 'none';
        if (chartSection) chartSection.style.display = 'none';
        if (actionHeader) actionHeader.style.display = 'table-cell';
        if (mockBtn) mockBtn.style.display = 'none';
        if (cartPanel) cartPanel.style.display = 'block';
    }
}

// ========== KİTAP FONKSİYONLARI ==========
async function loadBooks() {
    try {
        const books = await API.get('/books');
        
        const list = document.getElementById('book-list');
        if (!list) return;
        list.innerHTML = ''; 

        books.forEach(book => {
            let imageUrl = 'https://via.placeholder.com/50x75?text=Yok';

            if (book.image_url) {
                if (book.image_url.startsWith('http')) {
                    imageUrl = book.image_url;
                } else {
                    imageUrl = `http://localhost:3000${book.image_url}`; 
                }
            }

            let actionCell = "";
            
            const safeTitle = (book.title || '').replace(/'/g, "\\'");
            const safeAuthor = (book.author_name || '').replace(/'/g, "\\'");

            if (userData && userData.role === 'user') {
                actionCell = `<td><button onclick="addToCart(${book.id}, '${safeTitle}', ${book.price})" class="buy-btn">Sepete Ekle</button></td>`;
            } else if (userData && userData.role === 'admin') {
                actionCell = `<td>
                    <button onclick="editBook(${book.id}, '${safeTitle}', '${safeAuthor}', ${book.price}, '${book.image_url || ''}')" style="background: #ffc107; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px;">Düzenle</button>
                    <button onclick="deleteBook(${book.id})" style="background: #dc3545; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px; margin-left:5px;">Sil</button>
                </td>`;
            }

            const row = `<tr>
                <td style="text-align: center;">
                    <img src="${imageUrl}" alt="${book.title}" style="width: 50px; height: 75px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;">
                </td>
                <td style="vertical-align: middle;"><b>${book.title}</b></td>
                <td style="vertical-align: middle;">${book.author_name || 'Bilinmiyor'}</td>
                <td style="vertical-align: middle;">${book.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
                ${actionCell} 
            </tr>`;
            list.innerHTML += row;
        });

        const hasJunk = books.some(b => b.title.toLowerCase().includes('asdf') || b.title.toLowerCase().includes('test'));
        const statusTitle = document.getElementById('status-title');
        if (statusTitle) {
            statusTitle.innerText = hasJunk ? "Inventory - Test Env." : "Inventory Dashboard (Golden State)";
        }
        
        checkPermissions();
    } catch (error) {
        console.error("Kitaplar yüklenirken hata oluştu:", error);
    }
}

async function addBook() {
    const title = document.getElementById('new-title').value;
    const author_name = document.getElementById('new-author').value;
    const price = document.getElementById('new-price').value;
    const imageFile = document.getElementById('new-image').files[0];

    const formData = new FormData();
    formData.append('title', title);
    formData.append('author_name', author_name);
    formData.append('price', price);
    if (imageFile) {
        formData.append('image', imageFile);
    }

    const response = await API.postFormData('/books', formData);

    if(response.ok) {
        alert("Kitap başarıyla eklendi!");
        document.getElementById('new-title').value = '';
        document.getElementById('new-author').value = '';
        document.getElementById('new-price').value = '';
        document.getElementById('new-image').value = '';
        loadBooks();
    }
}

function editBook(id, currentTitle, currentAuthor, currentPrice, currentImage) {
    const tableRow = document.querySelector(`button[onclick*="deleteBook(${id})"]`).closest('tr');
    
    tableRow.innerHTML = `
        <tr><input type="file" id="edit-image-${id}" style="width:90%"></td>
        <td><input type="text" id="edit-title-${id}" value="${currentTitle}" style="width:90%"></td>
        <td><input type="text" id="edit-author-${id}" value="${currentAuthor}" style="width:90%"></td>
        <td><input type="number" id="edit-price-${id}" value="${currentPrice}" style="width:70%"></td>
        <td>
            <button onclick="saveEdit(${id}, '${currentImage}')" style="background: #28a745; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px;">Onayla</button>
            <button onclick="loadBooks()" style="background: #6c757d; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px;">İptal</button>
        </td>
    `;
}

async function saveEdit(id, oldImageUrl) {
    const title = document.getElementById(`edit-title-${id}`).value;
    const author = document.getElementById(`edit-author-${id}`).value;
    const price = document.getElementById(`edit-price-${id}`).value;
    const imageFile = document.getElementById(`edit-image-${id}`).files[0];

    const formData = new FormData();
    formData.append('title', title);
    formData.append('author_name', author);
    formData.append('price', price);
    
    if (imageFile) {
        formData.append('image', imageFile);
    } else {
        formData.append('image_url', oldImageUrl);
    }

    await API.putFormData(`/books/${id}`, formData);
    loadBooks();
}

async function deleteBook(bookId) {
    if (!confirm("Bu kitabı silmek istediğinize emin misiniz?")) return;
    const response = await API.delete(`/books/${bookId}`);
    if (response.ok) {
        loadBooks();
        if (userData.role === 'admin') loadChart();
    }
}

// ========== GRAFİK FONKSİYONLARI ==========
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

// ========== ADMIN FONKSİYONLARI ==========
async function adminReset() {
    if(confirm("Sistem sıfırlanacak. Emin misiniz?")) {
        const response = await API.post('/reset', {});
        const result = await response.json();
        alert(result.message);
        loadBooks();
        loadChart();
    }
}

async function generateMockSales() {
    try {
        const response = await API.post('/generate-mock-sales', {});
        const result = await response.json();
        alert(result.message);
        if (typeof loadChart === "function") await loadChart();
    } catch (error) {
        console.error("Veri üretme hatası:", error);
        alert("Sunucuya bağlanılamadı.");
    }
}

// ========== Event Listener'lar burada ==========
const resetBtn = document.getElementById('reset-btn');
if(resetBtn) {
    resetBtn.addEventListener('click', adminReset);
}

const mockBtn = document.getElementById('mock-data-btn');
if (mockBtn) {
    mockBtn.onclick = generateMockSales;
}