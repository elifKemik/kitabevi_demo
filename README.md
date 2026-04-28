# 📚 Kitabevi Demo Projesi

Bu proje, bir kitabevi yönetim sistemi simülasyonudur. Sepet sistemi, satış işlemleri, grafikler ve admin işlemleri gibi temel özellikleri içerir.

---

## 🚀 Özellikler

- 🛒 Sepet Sistemi ve Satın Alma
- 📊 Aylık Gelir Grafiği (Chart.js)
- 📈 Aylık Satılan Kitap Sayısı Grafiği
- 🔄 Admin Reset (Sistemi golden dataya döndürür)
- 🎲 Rastgele Satış Verisi Üretme
- 🛠️ Admin CRUD İşlemleri
- 📑 Sidebar Menü ile Sayfa Geçişleri (Home / Books / Charts)

---
## 🔄 Admin Reset Mekanizması

- **State 1 (Test Env):** 3'ten fazla kitap olabilir  
- **State 2 (Golden State):** Sadece  golden kitaplar bulunur  

➡️ Admin reset butonu sistemi **State 2'ye döndürür**  
➡️ Golden kitapların satış verileri korunur  

---

## 🧪 Test Senaryoları

- Admin girişinde reset butonu görünür  
- Kullanıcı girişinde reset butonu görünmez  
- Reset sonrası sadece golden kitap kalır  
- Kitaplar güncellense bile reset eski haline döner  
- Sepete kitap eklenip satın alınabilir  
- Satış sonrası her iki grafik de güncellenir  
- 3 kitap alındığında satış adedi grafiğinde 3 görünür  

---
## ⚙️ Kurulum

```bash
git clone https://github.com/elifKemik/kitabevi_demo.git
cd kitabevi_demo
npm install
node server.js