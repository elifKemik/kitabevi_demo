const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

app.use('/uploads', express.static('uploads'));
app.use('/assets', express.static('assets'));

const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Multer yapılandırması (her iki route dosyası da aynı ayarı kullanacak)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

const db = new sqlite3.Database('./kitabevi.db');

// Route dosyalarını yükle
const authRoutes = require('./routes/authRoutes')(db);
const bookRoutes = require('./routes/bookRoutes')(db, upload, path, fs);

// Route'ları kullan
app.use('/api', authRoutes);
app.use('/api', bookRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server http://localhost:${PORT} üzerinde aktif.`));