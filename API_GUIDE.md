# 🔌 Panduan Integrasi Backend & Konversi APK: Bos UMKM

Dokumentasi ini dibuat khusus untuk memudahkan rekan pengembang backend Anda menghubungkan database dan logika server (PHP / Laravel / NodeJS / Express / Python) ke frontend **Bos UMKM**.

---

## 1. Cara Menyambungkan Frontend ke Backend Rekan Anda

Buka file [js/api.js](file:///c:/xampp/htdocs/bos%20umkm/js/api.js) pada baris ke-12:

```javascript
const ApiConfig = {
  USE_MOCK: false, // Ubah dari true menjadi false
  API_BASE_URL: 'http://localhost/bos-umkm-backend/api', // Sesuaikan URL backend rekan Anda
  TIMEOUT: 8000
};
```

Saat `USE_MOCK: false`, semua fungsi di frontend akan secara otomatis memanggil REST API server menggunakan `fetch()`.

---

## 2. Spesifikasi Endpoint REST API yang Dibutuhkan

Frontend mengharapkan format respon JSON standar:
```json
{
  "success": true,
  "data": { ... },
  "message": "Pesan sukses atau error opsional"
}
```

### A. Dashboard Finansial
- **URL**: `GET /api/dashboard?period={today|weekly|monthly}`
- **Fungsi**: Mengisi card utama "Data hari ini"
- **Contoh Respon JSON**:
```json
{
  "success": true,
  "data": {
    "stockAvailable": 342,
    "stockUnit": "item",
    "stockOut": 38,
    "turnover": 2840000,
    "turnoverGrowth": "+14.8%",
    "profit": 965000,
    "profitMargin": "33.9%"
  }
}
```

### B. Modul Stok & Inventaris
- **URL**: `GET /api/stok`
  - Mengambil daftar semua barang dagangan.
- **URL**: `POST /api/stok`
  - Menyimpan barang/produk baru dari form modal.
  - **Body JSON (Request)**:
    ```json
    {
      "name": "Kopi Susu Aren 250ml",
      "stock": 50,
      "unit": "botol",
      "buyPrice": 12000,
      "sellPrice": 18000,
      "category": "Minuman"
    }
    ```

### C. Modul Transaksi & Kasir POS
- **URL**: `GET /api/transaksi`
  - Mengambil daftar riwayat transaksi terakhir.
- **URL**: `POST /api/transaksi`
  - Menyimpan penjualan baru dari Kasir Cepat.
  - **Body JSON (Request)**:
    ```json
    {
      "customer": "Ibu Ratna",
      "items": "Beras 5kg (1x), Minyak 2L (2x)",
      "total": 147000,
      "paymentMethod": "QRIS",
      "type": "sale"
    }
    ```

### D. Modul Biaya Operasional
- **URL**: `GET /api/operasional`
- **URL**: `POST /api/operasional`
  - **Body JSON (Request)**:
    ```json
    {
      "name": "Bensin Kurir Antar",
      "amount": 50000,
      "category": "Transport"
    }
    ```

### E. Modul Marketing & Promosi
- **URL**: `GET /api/marketing`
- **URL**: `POST /api/marketing`
  - **Body JSON (Request)**:
    ```json
    {
      "title": "Promo Gajian Diskon 10%",
      "discount": "Diskon 10% Min. Belanja 100rb",
      "channel": "WhatsApp Broadcast"
    }
    ```

---

## 3. Rekomendasi Struktur Tabel Database MySQL (di XAMPP / phpMyAdmin)

Jika rekan Anda menggunakan MySQL/MariaDB di XAMPP, berikut tabel yang direkomendasikan:

```sql
CREATE DATABASE IF NOT EXISTS bos_umkm;
USE bos_umkm;

-- Tabel Pengguna & Toko
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    store_name VARCHAR(150) NOT NULL,
    is_premium TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Produk / Stok
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Umum',
    stock INT NOT NULL DEFAULT 0,
    min_stock INT DEFAULT 10,
    unit VARCHAR(50) DEFAULT 'pcs',
    buy_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    sell_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Transaksi Penjualan
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tx_code VARCHAR(50) UNIQUE,
    customer_name VARCHAR(150),
    items_summary TEXT,
    total_amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'QRIS',
    tx_type ENUM('sale', 'purchase', 'expense') DEFAULT 'sale',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Biaya Operasional
CREATE TABLE operational_expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expense_name VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    category VARCHAR(100),
    expense_date DATE DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Cara Menjadikan File APK Android

Aplikasi frontend ini sudah dirancang dengan standar **Progressive Web App (PWA)** dan **Mobile App Container**. Anda punya 2 pilihan mudah untuk menjadikannya APK:

### Opsi 1: Menggunakan Capacitor (Rekomendasi untuk Play Store & APK Asli)
1. Di folder proyek, inisialisasi Capacitor:
   ```bash
   npm init -y
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init "Bos UMKM" com.bosumkm.app --web-dir .
   npx cap add android
   npx cap copy
   ```
2. Buka folder `android/` di Android Studio, lalu klik **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
3. File `.apk` langsung jadi dan siap di-install di HP Android manapun!

### Opsi 2: Menggunakan PWA (Langsung Install dari Browser HP)
1. Buka URL `http://[IP-Komputer-Anda]/bos%20umkm/index.html` dari Chrome di HP Android (dalam jaringan WiFi yang sama).
2. Tekan menu titik tiga di Chrome > **Tambahkan ke Layar Utama** (atau *Install App*).
3. Ikon **Bos UMKM** akan muncul di menu aplikasi HP dengan layar penuh tanpa address bar layaknya aplikasi native.
