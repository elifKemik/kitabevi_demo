const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer'); // Resim yüklemek için eklendi
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// 1. Resimlerin dışarıdan erişilebilmesi için 'uploads' klasörünü dışa açıyoruz
app.use('/uploads', express.static('uploads'));
app.use('/assets', express.static('assets'));
// 'uploads' klasörü yoksa otomatik oluştur
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// 2. Multer Yapılandırması (Dosyaları nasıl kaydedeceğini söyler)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Dosya ismini benzersiz yapmak için zaman damgası ekler (örn: 171234567-kitap.jpg)
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

const db = new sqlite3.Database('./kitabevi.db');

// 1. Kitapları Listeleme
app.get('/api/books', (req, res) => {
    const sql = "SELECT Books.*, Authors.name as author_name FROM Books LEFT JOIN Authors ON Books.author_id = Authors.id";
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 2. ADMIN RESET
app.post('/api/reset', (req, res) => {
    // 1. Mevcut kitapların resim yollarını al
    db.all("SELECT image_url FROM Books", [], (err, rows) => {
        if (!err && rows) {
            // Golden resim isimlerini burada tanımlıyoruz ki silinmesinler
            const goldenFiles = ['saatleri-ayarlama.jpg', 'beyaz-kale.jpg', 'my-name-is-red.jpg'];
            
            rows.forEach(row => {
                if (row.image_url && row.image_url.startsWith('/uploads/')) {
                    const fileName = row.image_url.split('/').pop();
                    
                    // Eğer dosya adı golden listesinde YOKSA klasörden sil
                    if (!goldenFiles.includes(fileName)) {
                        const fullPath = path.join(__dirname, row.image_url);
                        fs.unlink(fullPath, (err) => {
                            if (err) console.log("Dosya silinirken hata veya zaten yok:", fileName);
                        });
                    }
                }
            });
        }

        // 2. Veritabanını sıfırla ve Golden Data'yı tekrar ekle
        db.serialize(() => {
            db.run("DELETE FROM Users WHERE role != 'admin'");
            db.run("DELETE FROM Sales");
            db.run("DELETE FROM Books");
            db.run("DELETE FROM Authors");
            
            const goldenData = [
                { author: "Ahmet Hamdi Tanpınar", books: [
                    { title: "Saatleri Ayarlama Enstitüsü", price: 185.00, img: "/uploads/saatleri-ayarlama.jpg" }
                ]},
                { author: "Orhan Pamuk", books: [
                    { title: "Beyaz Kale", price: 195.50, img: "/uploads/beyaz-kale.jpg" },
                    { title: "My Name Is Red", price: 210.00, img: "/uploads/my-name-is-red.jpg" }
                ]}
            ];
            
            goldenData.forEach(authorData => {
                db.run("INSERT INTO Authors (name) VALUES (?)", [authorData.author], function(err) {
                    if (!err) {
                        const authorId = this.lastID;
                        authorData.books.forEach(book => {
                            db.run("INSERT INTO Books (title, author_id, price, image_url) VALUES (?, ?, ?, ?)", 
                                [book.title, authorId, book.price, book.img]);
                        });
                    }
                });
            });
            res.json({ message: "Sistem sıfırlandı, gereksiz resimler temizlendi!" });
        });
    });
});

// 3. Kitap Ekleme (Resim Yükleme Desteği ile)
// upload.single('image') ifadesi frontend'den gelen 'image' isimli dosyayı yakalar
app.post('/api/books', upload.single('image'), (req, res) => {
    const { title, author_name, price } = req.body;
    // Eğer resim seçildiyse dosya yolunu, seçilmediyse boş string kaydet
    const image_url = req.file ? `/uploads/${req.file.filename}` : '';

    db.run("INSERT INTO Authors (name) VALUES (?)", [author_name], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        const newAuthorId = this.lastID;
        const sql = "INSERT INTO Books (title, author_id, price, image_url) VALUES (?, ?, ?, ?)";
        db.run(sql, [title, newAuthorId, price, image_url], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: "Kitap başarıyla yüklendi!" });
        });
    });
});

// 4. Kitap Güncelleme (Resim Güncelleme Desteği ile)
app.put('/api/books/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { title, author_name, price } = req.body;
    
    db.get("SELECT id FROM Authors WHERE name = ?", [author_name], (err, authorRow) => {
        if (err) return res.status(500).json({ error: err.message });

        const saveUpdate = (authorId) => {
            // Eğer yeni bir resim yüklendiyse onu kullan, yoksa eski resme dokunma (body'den gelen image_url'i kullan)
            let image_url = req.file ? `/uploads/${req.file.filename}` : req.body.image_url;

            db.run("UPDATE Books SET title = ?, author_id = ?, price = ?, image_url = ? WHERE id = ?", 
                [title, authorId, price, image_url, id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            });
        };

        if (authorRow) {
            saveUpdate(authorRow.id);
        } else {
            db.run("INSERT INTO Authors (name) VALUES (?)", [author_name], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                saveUpdate(this.lastID);
            });
        }
    });
});

// Diğer rotalar (Sell, Revenue, Login, Register, Delete)
app.get('/api/revenue', (req, res) => {
    const sql = `SELECT strftime('%m', sale_date) as month, SUM(amount) as total FROM Sales GROUP BY month`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const stats = Array(12).fill(0).map((_, i) => ({
            month: (i + 1).toString().padStart(2, '0'),
            total: 0
        }));
        rows.forEach(row => {
            const index = parseInt(row.month) - 1;
            stats[index].total = row.total;
        });
        res.json(stats);
    });
});

app.post('/api/sell', (req, res) => {
    const { book_id, amount } = req.body;
    const saleDate = new Date().toISOString().split('T')[0]; 
    db.run("INSERT INTO Sales (book_id, sale_date, amount) VALUES (?, ?, ?)", [book_id, saleDate, amount], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM Users WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (row) res.json({ success: true, role: row.role, username: row.username });
        else res.status(401).json({ success: false });
    });
});

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    db.run("INSERT INTO Users (username, password, role) VALUES (?, ?, 'user')", [username, password], (err) => {
        if (err) return res.status(500).json({ error: "Hata" });
        res.json({ success: true });
    });
});

app.delete('/api/books/:id', (req, res) => {
    const { id } = req.params;

    // 1. Önce silinecek kitabın resim yolunu veritabanından al
    db.get("SELECT image_url FROM Books WHERE id = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        db.serialize(() => {
            // 2. Satış ve Kitap verilerini sil
            db.run("DELETE FROM Sales WHERE book_id = ?", [id]);
            db.run("DELETE FROM Books WHERE id = ?", [id], function(err) {
                if (err) return res.status(500).json({ error: err.message });

                // 3. Eğer bir resim yolu varsa ve bu bir yerel dosyaysa (/uploads/ ile başlıyorsa) sil
                if (row && row.image_url && row.image_url.startsWith('/uploads/')) {
                    const fullPath = path.join(__dirname, row.image_url);
                    fs.unlink(fullPath, (fsErr) => {
                        if (fsErr) console.log("Dosya zaten yok veya silinemedi:", fullPath);
                        else console.log("Dosya başarıyla silindi:", fullPath);
                    });
                }
                res.json({ message: "Kitap ve resmi başarıyla temizlendi!" });
            });
        });
    });
});
// Rastgele Satış Verisi Üretici (Demo için grafiği doldurur)
app.post('/api/generate-mock-sales', (req, res) => {
    const months = ['01', '02', '03', '04', '05']; // Bu yılın ayları
    db.serialize(() => {
        for (let i = 0; i < 50; i++) {
            const randomMonth = months[Math.floor(Math.random() * months.length)];
            const randomAmount = Math.floor(Math.random() * 500) + 100;
            const randomBookId = Math.floor(Math.random() * 3) + 1; // Golden kitaplar
            db.run("INSERT INTO Sales (book_id, sale_date, amount) VALUES (?, ?, ?)", 
                [randomBookId, `2026-${randomMonth}-10`, randomAmount]);
        }
        res.json({ message: "50 adet rastgele satış verisi üretildi!" });
    });
});
const PORT = 3000;
app.listen(PORT, () => console.log(`Server http://localhost:${PORT} üzerinde aktif.`));