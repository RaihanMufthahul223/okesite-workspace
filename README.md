# OkeSite CRM — Internal CRM & Finance Tracker

> CRM internal untuk agensi web: kelola prospek/klien, katalog layanan, tagihan & cicilan, dan pantau renewal domain/hosting. Dibangun Mobile-First, siap deploy ke Cloudflare Pages (Edge Runtime).

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | **Next.js 16.3.5** (App Router, Turbopack) |
| Styling | **Tailwind CSS 4** + **shadcn/ui** + `lucide-react` |
| Auth | **Clerk** (`@clerk/nextjs` Consumer Mode, `proxy.ts` middleware) |
| Database | **Turso (SQLite)** via `@libsql/client/web` |
| ORM | **Drizzle ORM** + `drizzle-kit` |
| Validasi | **Zod** + **React Hook Form** (`@hookform/resolvers`) |
| Hosting | **Cloudflare Pages** via `@opennextjs/cloudflare` + `wrangler` |
| Notifikasi | `sonner` (toast) |

> **Constraint Edge** (`architecture.md`): Semua kode yang akses DB/Turso atau Clerk API wajib `export const runtime = 'edge'` dan pakai `@libsql/client/web`. Sudah dipatuhi di `src/db/index.ts` dan halaman server `dashboard/*`.

## Struktur Project

```
src/
├── app/
│   ├── page.tsx                          # / → redirect ke /dashboard atau /sign-in (edge)
│   ├── layout.tsx                        # ClerkProvider + Toaster
│   ├── sign-in/[[...sign-in]]/page.tsx   # Clerk SignIn
│   └── dashboard/
│       ├── layout.tsx                    # Sidebar desktop + Sheet mobile (client)
│       ├── page.tsx                      # Dashboard ringkasan (edge)
│       ├── clients/page.tsx + actions.ts + AddClientDialog + ClientListContainer + ClientDetailSheet
│       ├── services/page.tsx + actions.ts + ServiceDialogs + ServiceListContainer + DeleteServiceButton
│       └── invoices/page.tsx + actions.ts + InvoiceDialogs + InvoiceListContainer
├── db/
│   ├── schema.ts                         # 4 tabel: services, clients, invoices, payments
│   └── index.ts                          # createClient(web) + drizzle()
├── components/ui/                        # shadcn: button, dialog, sheet, table, badge, input, select, etc.
├── lib/utils.ts
└── proxy.ts                              # clerkMiddleware (Next.js 16: proxy.ts)
```

**Schema DB** (`src/db/schema.ts`):
- `services(id, name, base_price, description, created_at)`
- `clients(id, name, contact_info, status[FOLLOW_UP|DEAL|REJECT], last_note, website_url, renewal_date, created_at, updated_at)`
- `invoices(id, client_id→clients, service_id→services, total_amount, status[UNPAID|PARTIAL|PAID], due_date, created_at)`
- `payments(id, invoice_id→invoices, amount_paid, payment_date, payment_method, note)` → logic: `SUM(payments) >= invoices.total_amount` ⇒ `invoices.status = PAID`

---

## ✅ Fitur yang Sudah Terpasang (MVP Selesai)

### 1. Autentikasi & Routing
- Clerk private access: `proxy.ts` protect `/dashboard/*`, `src/app/page.tsx` redirect by `auth()`.
- `UserButton` di sidebar & header (`dashboard/layout.tsx`).
- Edge runtime di semua server pages yang pakai `auth()`/`db`.

### 2. Dashboard — Ringkasan Agensi (`/dashboard`)
- 3 kartu metrik: **Klien Aktif (DEAL)**, **Pendapatan Bulan Ini** (agregasi `payments.paymentDate`), **Tagihan Belum Dibayar** (count + total outstanding).
- **Aksi Hari Ini**: list klien `status=FOLLOW_UP` atau `renewalDate` ≤ 14 hari, badge `Follow Up` / `Renewal: X hari lagi`, empty state "Semua Tugas Selesai!".

### 3. Klien & Prospek (`/dashboard/clients`)
- **CRUD**: `addClient` (default `FOLLOW_UP`), `updateClientStatus`, `deleteClient` (`actions.ts` + Zod).
- **List**: search by nama/kontak/website + filter status (ALL/DEAL/FOLLOW_UP/REJECT), hitung stats (Total/Deal/Follow Up/Reject).
- **Responsive**: Desktop `Table`, Mobile `Card` (`ClientListContainer.tsx`).
- **Detail Sheet**: slide-over kanan (`ClientDetailSheet.tsx`) — tampil kontak, website (link), renewal (hitung `daysUntil` + warning ≤30 hari), `lastNote`, tombol ganti status cepat + hapus.
- **UX**: empty state, validasi `websiteUrl` harus URL valid, `revalidatePath`.

### 4. Layanan Agensi (`/dashboard/services`)
- **CRUD penuh**: `addService`, `updateService`, `deleteService` (`actions.ts` Zod `name/basePrice>0/description`).
- **Dialog**: `AddServiceDialog` & `EditServiceDialog` (shared `ServiceForm`) + `DeleteServiceButton` dengan confirm.
- **List**: search nama/deskripsi, stats Total Paket + Rata-rata Harga, Table desktop / Card mobile.

### 5. Tagihan & Pembayaran (`/dashboard/invoices`)
- **Buat Tagihan**: `createInvoice` — pilih klien **hanya DEAL** + layanan, auto-fill `totalAmount` dari `services.basePrice` (editable), `dueDate`, `revalidatePath` ke `/dashboard`.
- **Bayar/Cicil**: `addPayment` — validasi: invoice ada, belum PAID, cek `remaining = total - SUM(paid)`, reject jika `amountPaid > remaining`, simpan `paymentDate/method/note`, auto-update `invoices.status` → `PARTIAL`/`PAID`, toast.
- **List**: enriched `clientName/serviceName/paidTotal/remaining`, stats Total/Lunas/Pending/Piutang, filter status + search, Table + Card dengan progress bar `% terbayar`.

### 6. UI/UX System (`design.md` dipatuhi)
- Mobile-First (`p-4` mobile, `p-8` desktop, `max-w-6xl`, Sidebar 250px desktop / Sheet hamburger mobile, sticky header + breadcrumb).
- Palette: `bg-slate-50` + `bg-white` + `bg-blue-600`, Badge status `emerald/amber/rose` (`components/ui/badge.tsx`).
- shadcn `Dialog`/`Sheet` untuk form biar SPA-like, `Form` + `Input` label vertikal, `EmptyState` + CTA.
- Format IDR `Intl.NumberFormat("id-ID", { currency:"IDR" })`, format tanggal `id-ID`.

### 7. Deployment
- `next.config.ts` `output: "standalone"`, `open-next.config.ts` (`cloudflare-node` + `converter: edge`), `wrangler.jsonc` (`okesite-crm`, `compatibility_date: 2026-09-17`, `nodejs_compat`).
- Scripts: `pages:build`, `preview`, `deploy` siap Cloudflare.
- `npm run build` lolos (Turbopack, 7 workers, Edge routes `ƒ`).

---

## 🔧 Yang Perlu Dikembangkan (Tech Debt / Belum Sempurna)

> Fitur sudah jalan tapi butuh pemolesan agar production-grade.

| Area | Masalah Sekarang | Yang Perlu Dikembangkan |
|---|---|---|
| **Edit Klien** | `ClientDetailSheet` hanya bisa ganti `status` & hapus. | Tambah `updateClient` (edit nama/kontak/URL/renewal/note) — dialog terpisah seperti `EditServiceDialog`. |
| **Hapus Klien Cascade** | `deleteClient` langsung `DELETE` tanpa cek FK. | Cek/hard-block jika klien punya `invoices` aktif, atau soft-delete. Tambah `onDelete: cascade` di schema jika diinginkan. |
| **Riwayat Pembayaran** | Hanya tampil `paidTotal/remaining` agregat. | Halaman/Sheet detail per invoice: list `payments` (tanggal, metode, note) + hapus/edit pembayaran. |
| **Loading State** | `design.md` minta `Skeleton`, belum ada. | Tambah `loading.tsx` / `Skeleton` untuk Table & Card saat fetch Turso. |
| **Pencarian & Filter** | Semua `filter` client-side `useMemo` (memuat semua rows). | Pindah ke server-side `WHERE ILIKE` + pagination (`limit/offset`) untuk data besar. |
| **Pagination/Sort** | Tidak ada. | Tambah pagination & sortable `TableHead` (by `createdAt`, `name`, `totalAmount`). |
| **Validasi** | `websiteUrl` Zod strict `url()` (butuh `https://`). | Longgarkan atau auto-prefix, tambah validasi `renewalDate` tidak di masa lalu, `contactInfo` format WA/email. |
| **Drizzle Config** | `drizzle.config.ts` belum ada di repo. | Tambah config + script `db:generate`/`db:migrate`/`db:push` agar migrasi versioned. |
| **Error & Audit** | Hanya `console.error` + toast. | Tambah logging terstruktur, retry Turso, dan `updatedAt` trigger otomatis. |
| **Edge Deprecation Warning** | `build` warns `Edge Runtime is deprecated`. | Evaluasi migrasi ke `nodejs` runtime bila OpenNext sudah stabil, atau pin Next 15 behavior. |

---

## ➕ Yang Perlu Ditambahkan (Roadmap Fitur Baru)

| Prioritas | Fitur | Deskripsi |
|---|---|---|
| **Tinggi** | **Export Invoice PDF** | Generate PDF tagihan (logo, item layanan, total, status, riwayat cicilan) — tombol di `InvoiceListContainer`. |
| Tinggi | **Pengingat Renewal** | Cron/Worker harian: email/WhatsApp (mis. via Resend/Twilio) H-14, H-7, H-1 untuk `renewalDate` & `dueDate`. |
| Tinggi | **Dashboard Chart** | Grafik pendapatan 6/12 bulan + donut status invoice (pakai `recharts`). |
| Tinggi | **Hapus/Edit Invoice** | Saat ini hanya create + pay. Tambah aksi hapus & edit `totalAmount/dueDate`. |
| Sedang | **Upload Bukti Bayar** | `payments` tambah kolom `proofUrl` + upload ke R2/Cloudflare Images. |
| Sedang | **Role & Multi-User** | Clerk Organizations: Admin vs Staff, filter data per user. |
| Sedang | **Global Search & Command Palette** | `⌘K` search klien/invoice/layanan lintas halaman. |
| Sedang | **Activity Log** | Tabel `audit_logs` (who, what, when) untuk perubahan status & pembayaran. |
| Sedang | **Import/Export CSV** | Bulk import klien & export laporan keuangan. |
| Rendah | **Notifikasi In-App** | Bell icon di header untuk renewal & tagihan overdue. |
| Rendah | **Dark Mode** | Toggle tema (shadcn sudah support). |
| Rendah | **Tests** | Vitest + Playwright (E2E untuk flow create client → invoice → pay). |

---

## 🚀 Cara Menjalankan

### Prasyarat
- Node 20+, `TURSO_DATABASE_URL` & `TURSO_AUTH_TOKEN` (buat DB di [turso.tech](https://turso.tech)), Clerk keys.

### 1. Install
```bash
npm install
```

### 2. Env (`.env.local`)
```ini
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Turso
TURSO_DATABASE_URL=libsql://okesite-xxx.turso.io
TURSO_AUTH_TOKEN=eyJ...
```

> DB: `TURSO_DATABASE_URL` & `TURSO_AUTH_TOKEN` wajib — lihat `src/db/index.ts:6`. Tanpa ini `next dev` akan throw.

### 3. Dev
```bash
npm run dev
# http://localhost:3000 → redirect ke /sign-in atau /dashboard
```

### 4. Build & Preview Cloudflare
```bash
npm run build          # next build (edge routes)
npm run pages:build    # npx @opennextjs/cloudflare build
npm run preview        # wrangler pages dev
npm run deploy         # wrangler pages deploy
```

### Scripts Lain
```bash
npm run lint
npx drizzle-kit generate   # setelah buat drizzle.config.ts
npx drizzle-kit push
```

---

## Catatan Kepatuhan Edge

Semua halaman server yang akses `db`/`auth()` sudah `export const runtime = 'edge'` (`src/app/page.tsx`, `src/app/dashboard/page.tsx`, `src/app/dashboard/clients/page.tsx`, `src/app/dashboard/services/page.tsx`, `src/app/dashboard/invoices/page.tsx`) dan `src/db/index.ts` pakai `from "@libsql/client/web"`. `proxy.ts` & `dashboard/layout.tsx` (client) sengaja tidak pakai runtime. Server Actions (`actions.ts`) inherit Edge dari page penganggil.

---

## Lisensi

Private — internal OkeSite Agency.
