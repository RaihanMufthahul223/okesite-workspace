# Project Architecture & Tech Stack Guidelines

## 1. Tech Stack Overview
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Authentication:** Clerk (Consumer Mode, private access)
- **Database:** Turso (SQLite)
- **ORM:** Drizzle ORM
- **Hosting/Deployment:** Cloudflare Pages
- **Deployment Adapter:** `@cloudflare/next-on-pages`

## 2. Critical Constraints (Cloudflare Pages Edge)
Semua kode yang berinteraksi dengan database (Turso) ATAU Clerk API **wajib** berjalan di Edge Runtime. 
- Gunakan `@libsql/client/web` (bukan standar Node.js client).
- Tambahkan `export const runtime = 'edge';` di setiap file Route Handlers (`app/api/...`), Server Actions, dan halaman Server Components yang melakukan *fetching* ke database.

## 3. Folder Structure Convention
- `/app`: Routing aplikasi, Layout, dan Pages.
- `/components`: Komponen UI modular (termasuk komponen shadcn di `/components/ui`).
- `/db`: Konfigurasi koneksi Turso dan definisi Drizzle Schema (`schema.ts`).
- `/actions`: Next.js Server Actions untuk mutasi data (CRUD) agar terpisah dari komponen UI.
- `/lib`: Fungsi utilitas (format tanggal, format mata uang, cn tailwind).

## 4. Database Schema (Turso / Drizzle)
Database terdiri dari 4 tabel utama dengan relasi berikut:
1. `services`: Daftar paket/produk (id, name, base_price, description).
2. `clients`: Data prospek dan klien aktif (id, name, status, renewal_date). Status: 'FOLLOW_UP', 'DEAL', 'REJECT'.
3. `invoices`: Tagihan klien (id, client_id, service_id, total_amount, status). Status: 'UNPAID', 'PARTIAL', 'PAID'.
   - `client_id` terhubung ke `clients`.
   - `service_id` terhubung ke `services`.
4. `payments`: Riwayat cicilan/pembayaran (id, invoice_id, amount_paid, payment_date).
   - `invoice_id` terhubung ke `invoices`.
   - *Logic Flow:* Jika total `amount_paid` di `payments` == `total_amount` di `invoices`, maka status `invoices` berubah otomatis menjadi `PAID`.

## 5. UI/UX Rules
- Rujuk ke file `design.md` untuk aturan warna, tipografi, dan pendekatan desain Mobile-First (Cards untuk Mobile, Table untuk Desktop).
- Gunakan komponen `Sheet` atau `Dialog` dari shadcn untuk form agar UX terasa seperti Web App satu halaman (SPA).