# UI/UX Design System & Guidelines
**Project:** Internal CRM & Finance Tracker for Web Agency
**Design Approach:** Professional B2B, Minimalist, Mobile-First
**UI Library:** Tailwind CSS + shadcn/ui

## 1. Design Philosophy
- **Mobile-First Data Density:** Menampilkan data kompleks (seperti tabel klien) menggunakan format **Card** di layar sentuh (HP) agar mudah dibaca, dan berubah menjadi **Data Table** penuh di layar desktop.
- **Action-Oriented:** Status klien dan tagihan harus terlihat dalam 1 detik. Gunakan *Badge* warna-warni untuk status.
- **Minimal Clicks:** Input data (tambah klien, ubah status) menggunakan *Slide-over* (Sheet) atau *Modal* (Dialog) agar pengguna tidak perlu berpindah halaman.

## 2. Color Palette (Tailwind)
Desain menggunakan tema warna yang bersih (*clean*) dan kontras tinggi.
- **Background:** `bg-slate-50` (terang, tidak murni putih untuk mengurangi ketegangan mata).
- **Surface/Card:** `bg-white` dengan *border* tipis `border-slate-200`.
- **Primary Text:** `text-slate-900` untuk judul, `text-slate-500` untuk deskripsi/teks sekunder.
- **Primary Action (Brand):** `bg-blue-600` hover `bg-blue-700` (untuk tombol utama / CTA).
- **Status Colors (Crucial for CRM):**
  - **Success / DEAL / PAID:** `bg-emerald-100 text-emerald-700`
  - **Warning / FOLLOW UP / PARTIAL:** `bg-amber-100 text-amber-700`
  - **Danger / REJECT / OVERDUE:** `bg-rose-100 text-rose-700`

## 3. Typography
- **Font Family:** `Inter` atau `Geist` (standar font modern Next.js/shadcn).
- **Headings:** Bold dan padat (contoh: `text-2xl font-semibold tracking-tight`).
- **Data Text:** Gunakan ukuran `text-sm` untuk kepadatan data di tabel dan kartu agar layar tidak cepat penuh.

## 4. Layout Architecture
### Mobile View (Layar < 768px)
- **Header:** Sticky di atas. Logo di kiri, tombol *Hamburger Menu* dan `UserButton` (Clerk) di kanan.
- **Navigation:** Menggunakan **Sheet** (dari shadcn) yang muncul dari sisi kiri saat menu ditekan.
- **Content Area:** Menggunakan *padding* kecil (`p-4`).
- **Data Display:** Format *Card List*. Setiap klien adalah satu kotak berisi Nama tebal, Badge Status di sudut, dan baris detail di bawahnya.

### Desktop View (Layar >= 768px)
- **Sidebar:** *Fixed* di sisi kiri (lebar ~250px) berisi navigasi (Dashboard, Clients, Invoices, Services).
- **Header:** Hanya menampilkan *Breadcrumb* halaman saat ini dan profil `UserButton` di sudut kanan atas.
- **Content Area:** *Padding* lega (`p-8`), maksimal lebar kontainer `max-w-6xl` agar terpusat.
- **Data Display:** Format *Data Table* tradisional dengan kolom yang bisa diurutkan.

## 5. Key Components (shadcn/ui mapping)
- **Forms:** Gunakan `Form`, `Input`, dan `Select` dengan validasi (Zod + React Hook Form). Label form harus berada di atas *input* (vertikal) agar rapi di layar HP.
- **Client/Invoice Status:** Gunakan komponen `Badge` (varian *outline* atau *subtle*).
- **Empty States:** Jika belum ada data klien, tampilkan ikon kotak kosong besar dengan teks abu-abu *"Belum ada klien. Tambahkan prospek pertama Anda."* dan tombol CTA yang mencolok.
- **Loading States:** Gunakan komponen `Skeleton` dengan bentuk menyerupai Card/Tabel saat transisi memuat data dari Turso.

## 6. Page Blueprints

### A. Dashboard (`/dashboard`)
- **Top Row (Mobile: Kolom, Desktop: Baris):** 3 Kartu Metrik (Total Klien Aktif, Pendapatan Bulan Ini, Tagihan Belum Dibayar).
- **Middle Section:** Daftar "Aksi Hari Ini" (List klien yang butuh *follow up* hari ini atau website yang *renewal*-nya < 14 hari).

### B. Client List (`/dashboard/clients`)
- **Header:** Judul "Daftar Klien" + Tombol utama "+ Tambah Klien" di pojok kanan.
- **Search & Filter:** *Search bar* (berdasarkan nama/kontak) dan *Dropdown Filter* (berdasarkan status: Deal/Follow Up/Reject).
- **List/Table:** Menampilkan data. Jika di-klik, buka *Slide-over* (Sheet) dari sisi kanan layar untuk melihat detail klien (Catatan Terakhir, URL, Tanggal Perpanjangan) tanpa meninggalkan daftar utama.