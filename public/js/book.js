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

            if (window.userData && window.userData.role === 'user') {
                actionCell = `<td><button onclick="addToCart(${book.id}, '${safeTitle}', ${book.price})" class="buy-btn">Sepete Ekle</button></td>`;
            } else if (window.userData && window.userData.role === 'admin') {
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

        const hasJunk = books.length > CONFIG.GOLDEN_BOOK_COUNT;
        const statusTitle = document.getElementById('status-title');
        if (statusTitle) {
            statusTitle.innerText = hasJunk ? "Inventory - Test Env." : "Inventory Dashboard (Golden State)";
        }
        
        if (typeof window.checkPermissions === 'function') window.checkPermissions();
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
        await loadBooks();
    }
}

function editBook(id, currentTitle, currentAuthor, currentPrice, currentImage) {
    const tableRow = document.querySelector(`button[onclick*="deleteBook(${id})"]`).closest('tr');
    
    tableRow.innerHTML = `
        </td><input type="file" id="edit-image-${id}" style="width:90%"></td>
        <tr><input type="text" id="edit-title-${id}" value="${currentTitle}" style="width:90%"></td>
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
    await loadBooks();
}

async function deleteBook(bookId) {
    if (!confirm("Bu kitabı silmek istediğinize emin misiniz?")) return;
    const response = await API.delete(`/books/${bookId}`);
    if (response.ok) {
        await loadBooks();
        if (window.userData && window.userData.role === 'admin') {
            if (typeof window.loadChart === 'function') window.loadChart();
        }
    }
}

// Global'e expose
window.loadBooks = loadBooks;
window.addBook = addBook;
window.editBook = editBook;
window.saveEdit = saveEdit;
window.deleteBook = deleteBook;