// KONFİGÜRASYON
const CONFIG = {
    MAX_SALE_AMOUNT: 500,
    MIN_SALE_AMOUNT: 100,
    GOLDEN_BOOK_COUNT: 3,
    MOCK_SALES_COUNT: 50
};


const express = require('express');
const router = express.Router();


module.exports = (db, upload, path, fs) => {
    // kitapları listele
    router.get('/books', (req, res) => {
        const sql = "SELECT Books.*, Authors.name as author_name FROM Books LEFT JOIN Authors ON Books.author_id = Authors.id";
        db.all(sql, [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    });

    // kitap ekle (resimli)
    router.post('/books', upload.single('image'), (req, res) => {
        const { title, author_name, price } = req.body;
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

    // kitap güncelle (resim opsiyonel)
    router.put('/books/:id', upload.single('image'), (req, res) => {
        const { id } = req.params;
        const { title, author_name, price } = req.body;
        
        db.get("SELECT id FROM Authors WHERE name = ?", [author_name], (err, authorRow) => {
            if (err) return res.status(500).json({ error: err.message });

            const saveUpdate = (authorId) => {
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

    // kitap sil (resmini de sil)
    router.delete('/books/:id', (req, res) => {
        const { id } = req.params;
        db.get("SELECT image_url FROM Books WHERE id = ?", [id], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            db.serialize(() => {
                db.run("DELETE FROM Sales WHERE book_id = ?", [id]);
                db.run("DELETE FROM Books WHERE id = ?", [id], function(err) {
                    if (err) return res.status(500).json({ error: err.message });
                    if (row && row.image_url && row.image_url.startsWith('/uploads/')) {
                        const fullPath = path.join(__dirname, '..', row.image_url);
                        fs.unlink(fullPath, (fsErr) => {
                            if (fsErr) console.log("Dosya zaten yok veya silinemedi:", fullPath);
                        });
                    }
                    res.json({ message: "Kitap ve resmi başarıyla temizlendi!" });
                });
            });
        });
    });

    // satış yap
    router.post('/sell', (req, res) => {
        const { book_id, amount } = req.body;
        const saleDate = new Date().toISOString().split('T')[0];
        db.run("INSERT INTO Sales (book_id, sale_date, amount) VALUES (?, ?, ?)", [book_id, saleDate, amount], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });

    // gelir istatistikleri
    router.get('/revenue', (req, res) => {
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

    // mock satış verisi üret
router.post('/generate-mock-sales', (req, res) => {
    const months = ['01', '02', '03', '04', '05'];
    db.serialize(() => {
        for (let i = 0; i < CONFIG.MOCK_SALES_COUNT; i++) {
            const randomMonth = months[Math.floor(Math.random() * months.length)];
            const randomAmount = Math.floor(Math.random() * CONFIG.MAX_SALE_AMOUNT) + CONFIG.MIN_SALE_AMOUNT;
            const randomBookId = Math.floor(Math.random() * CONFIG.GOLDEN_BOOK_COUNT) + 1;
            db.run("INSERT INTO Sales (book_id, sale_date, amount) VALUES (?, ?, ?)", 
                [randomBookId, `2026-${randomMonth}-10`, randomAmount]);
        }
        res.json({ message: `${CONFIG.MOCK_SALES_COUNT} adet rastgele satış verisi üretildi! (Sadece Ocak-Mayıs arası)` });
    });
});

    return router;
};