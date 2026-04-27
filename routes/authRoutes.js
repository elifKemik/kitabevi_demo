const express = require('express');
const router = express.Router();


module.exports = (db) => {
    // LOGIN
    router.post('/login', (req, res) => {
        const { username, password } = req.body;
        db.get("SELECT * FROM Users WHERE username = ? AND password = ?", [username, password], (err, row) => {
            if (err) {
                console.error("Login hatası:", err);
                return res.status(500).json({ success: false, error: err.message });
            }
            if (row) {
                res.json({ success: true, role: row.role, username: row.username });
            } else {
                res.status(401).json({ success: false, message: "Hatalı kullanıcı adı veya şifre" });
            }
        });
    });

    // REGISTER
    router.post('/register', (req, res) => {
        const { username, password } = req.body;
        
        // Kullanıcı var mı kontrol et
        db.get("SELECT * FROM Users WHERE username = ?", [username], (err, row) => {
            if (err) {
                console.error("Register hatası:", err);
                return res.status(500).json({ success: false, error: err.message });
            }
            if (row) {
                return res.status(400).json({ success: false, message: "Bu kullanıcı adı zaten alınmış" });
            }
            
            db.run("INSERT INTO Users (username, password, role) VALUES (?, ?, 'user')", [username, password], (err) => {
                if (err) {
                    console.error("Kullanıcı eklenirken hata:", err);
                    return res.status(500).json({ success: false, error: "Kayıt hatası" });
                }
                res.json({ success: true, message: "Kayıt başarılı!" });
            });
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
                // Admin dışındaki kullanıcıları sil
                db.run("DELETE FROM Users WHERE role != 'admin'");
                
                // Golden kitapların isimleri
                const goldenTitles = ["Saatleri Ayarlama Enstitüsü", "Beyaz Kale", "My Name Is Red"];
                
                // Golden olmayan kitapların satışlarını sil
                db.run("DELETE FROM Sales WHERE book_id NOT IN (SELECT id FROM Books WHERE title IN (?, ?, ?))", goldenTitles, (err) => {
                    if (err) console.log("Satış silme hatası:", err);
                });
                
                // Golden olmayan kitapları sil
                db.run("DELETE FROM Books WHERE title NOT IN (?, ?, ?)", goldenTitles, (err) => {
                    if (err) console.log("Kitap silme hatası:", err);
                });
                
                // Boşta kalan yazarları sil
                db.run("DELETE FROM Authors WHERE id NOT IN (SELECT author_id FROM Books)");
                
                // Golden kitaplar yoksa ekle
                db.get("SELECT COUNT(*) as count FROM Books WHERE title IN (?, ?, ?)", goldenTitles, (err, row) => {
                    if (row && row.count < 3) {
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
                    }
                });
                
                setTimeout(() => {
                    res.json({ message: "Sistem sıfırlandı! Golden kitap satışları korundu." });
                }, 500);
            });
        });
    });

    return router;
};