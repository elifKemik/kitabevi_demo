const express = require('express');
const router = express.Router();

module.exports = (db) => {
    // LOGIN
    router.post('/login', (req, res) => {
        const { username, password } = req.body;
        db.get("SELECT * FROM Users WHERE username = ? AND password = ?", [username, password], (err, row) => {
            if (row) res.json({ success: true, role: row.role, username: row.username });
            else res.status(401).json({ success: false });
        });
    });

    // REGISTER
    router.post('/register', (req, res) => {
        const { username, password } = req.body;
        db.run("INSERT INTO Users (username, password, role) VALUES (?, ?, 'user')", [username, password], (err) => {
            if (err) return res.status(500).json({ error: "Hata" });
            res.json({ success: true });
        });
    });

    // ADMIN RESET (sistem sıfırlama)
    router.post('/reset', (req, res) => {
        db.all("SELECT image_url FROM Books", [], (err, rows) => {
            if (!err && rows) {
                const goldenFiles = ['saatleri-ayarlama.jpg', 'beyaz-kale.jpg', 'my-name-is-red.jpg'];
                rows.forEach(row => {
                    if (row.image_url && row.image_url.startsWith('/uploads/')) {
                        const fileName = row.image_url.split('/').pop();
                        if (!goldenFiles.includes(fileName)) {
                            const fullPath = require('path').join(__dirname, '..', row.image_url);
                            require('fs').unlink(fullPath, (err) => {
                                if (err) console.log("Dosya silinirken hata veya zaten yok:", fileName);
                            });
                        }
                    }
                });
            }

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

    return router;
};