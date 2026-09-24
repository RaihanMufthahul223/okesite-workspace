# OkeSite CRM: Internal CRM & Finance Tracker

> CRM internal untuk agensi web: kelola prospek/klien, katalog layanan, tagihan & cicilan, dan pantau renewal domain/hosting. Dibangun Mobile-First, siap deploy ke Cloudflare Pages (Edge Runtime).

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | **Next.js 16.3.5** (App Router, Turbopack) |
| Styling | **Tailwind CSS 4** + **shadcn/ui** + `lucide-react` |
| Auth | **Clerk** (`@clerk/nextjs` Consumer Mode, `proxy.ts` middleware) |
| Database | **Turso (SQLite)** via `@libsql/client/web` |
| ORM | **Drizzle ORM** + `drizzle-kit` (`drizzle.config.ts` dialect `turso`) |
| Validasi | **Zod** + **React Hook Form** (`@hookform/resolvers`) |
| Chart | **Recharts** (`BarChart` + `PieChart` Donut, `ResponsiveContainer`) |
| PDF | **jsPDF** (client + edge server `api/invoices/[id]/pdf`) |
| Hosting | **Cloudflare Pages** via `@opennextjs/cloudflare` + `wrangler` |
| Notifikasi | `sonner` (toast) + `NotificationBell` (in-app) |
| UI Extra | `Skeleton` loading, `Pagination`/`SortButton`, `ThemeToggle` (dark mode) |

> **Constraint Edge** (`architecture.md`): Semua kode yang akses DB/Turso atau Clerk API wajib `export const runtime = 'edge'` dan pakai `@libsql/client/web`. Sudah dipatuhi di `src/db/index.ts` dan halaman server `dashboard/*` + `api/*`.

## Struktur Project

```
src/
├── app/
│   ├── page.tsx                          # / → redirect ke /dashboard atau /sign-in (edge)
│   ├── layout.tsx                        # ClerkProvider + Toaster + ThemeToggle
│   ├── sign-in/[[...sign-in]]/page.tsx   # Clerk SignIn
│   ├── api/
│   │   ├── search/route.ts               # Global search API (edge, auth, LIKE)
│   │   ├── renewals/route.ts             # Pengingat renewal JSON (edge)
│   │   └── invoices/[id]/
│   │       ├── pdf-data/route.ts         # Data enriched untuk PDF client
│   │       ├── pdf/route.ts              # Stream PDF binary (edge, jsPDF)
│   │       └── payments/route.ts         # Riwayat pembayaran per invoice
│   └── dashboard/
│       ├── layout.tsx                    # Sidebar + header + GlobalSearch + NotificationBell + ThemeToggle (client)
│       ├── loading.tsx                   # Skeleton dashboard
│       ├── page.tsx                      # Dashboard ringkasan (edge) + agregasi chart + renewal widget
│       ├── DashboardCharts.tsx           # Recharts client: RevenueChart + Invoice/Client Donut
│       ├── clients/
│       │   ├── page.tsx, actions.ts, loading.tsx
│       │   ├── AddClientDialog.tsx + EditClientDialog.tsx
│       │   ├── ClientListContainer.tsx   # Table/Card + search/filter + sort + pagination + CSV import/export
│       │   └── ClientDetailSheet.tsx     # Detail + status + WA + extend renewal + edit trigger
│       ├── services/page.tsx + actions.ts + ServiceDialogs + ServiceListContainer + loading.tsx
│       ├── invoices/page.tsx + actions.ts + InvoiceDialogs + InvoiceListContainer + InvoicePaymentsSheet + ExportInvoicePdfButton + loading.tsx
│       └── renewals/page.tsx + actions.ts + RenewalListContainer + loading.tsx
├── db/
│   ├── schema.ts                         # 5 tabel: services, clients, invoices, payments, audit_logs
│   └── index.ts                          # createClient(web) + drizzle()
├── components/
│   ├── ui/                               # shadcn: button, dialog, sheet, table, badge, input, select, textarea, skeleton, card, etc.
│   ├── GlobalSearch.tsx                  # Command palette client (⌘K, debounce, grouped results)
│   ├── NotificationBell.tsx              # In-app bell (renewal overdue/today/7d)
│   ├── ThemeToggle.tsx                   # Dark mode (localStorage + prefers-color-scheme)
│   └── Pagination.tsx                    # Pagination + SortButton (client-side, reusable)
├── lib/
│   ├── utils.ts
│   ├── renewal.ts                        # daysUntil, getRenewalInfo, buildWhatsAppLink, categories
│   ├── invoice-pdf.ts                    # jsPDF client generator (downloadInvoicePdf)
│   └── audit.ts                          # logAudit helper
├── drizzle.config.ts                     # drizzle-kit turso config + scripts db:generate/push
└── proxy.ts                              # clerkMiddleware (Next.js 16: proxy.ts)
```

**Schema DB** (`src/db/schema.ts`):
- `services(id, name, base_price, description, created_at)`
- `clients(id, name, contact_info, status[FOLLOW_UP|DEAL|REJECT], last_note, website_url, renewal_date, created_at, updated_at)`
- `invoices(id, client_id→clients, service_id→services, total_amount, status[UNPAID|PARTIAL|PAID], due_date, created_at)`
- `payments(id, invoice_id→invoices ON DELETE CASCADE, amount_paid, payment_date, payment_method, note, proof_url)` → logic: `SUM(payments) >= invoices.total_amount` ⇒ `invoices.status = PAID`
- `audit_logs(id, user_id, action, entity, entity_id, detail, created_at)` → dicatat di setiap `add/update/delete/pay`

---

## ✅ Fitur yang Sudah Terpasang (MVP Selesai)

### 1. Autentikasi & Routing
- Clerk private access: `proxy.ts` protect `/dashboard/*`, `src/app/page.tsx` redirect by `auth()`.
- `UserButton` di sidebar & header (`dashboard/layout.tsx`).
- Edge runtime di semua server pages yang pakai `auth()`/`db` + `api/*`.

### 2. Dashboard — Ringkasan Agensi (`/dashboard`)
- 3 kartu metrik: **Klien Aktif (DEAL)**, **Pendapatan Bulan Ini** (agregasi `payments.paymentDate`), **Tagihan Belum Dibayar** (count + total outstanding).
- **Chart Pendapatan 6 Bulan**: `RevenueChart` `BarChart` agregasi `payments` per bulan (6 bulan terakhir), `Tooltip` IDR, empty dashed jika 0.
- **Chart Status Tagihan & Klien**: `InvoiceStatusChart` + `ClientStatusChart` Donut `emerald/amber/rose`, `Legend`, total count, layout `grid lg:grid-cols-3`.
- **Pengingat Renewal Widget** *(Baru 2026-09-24)*: 4 kartu (Terlambat/Hari Ini/≤7/≤30) + list 5 urgent dengan badge `rose/amber`, link ke `/dashboard/renewals`. Empty "Tidak ada perpanjangan mendesak".
- **Aksi Hari Ini**: list `FOLLOW_UP` atau `renewal ≤14 hari`, badge `Follow Up` / `Renewal: X hari lagi`, empty "Semua Tugas Selesai!".

### 3. Klien & Prospek (`/dashboard/clients`)
- **CRUD**: `addClient` (default `FOLLOW_UP`), `updateClient` *(Baru 2026-09-24)*, `updateClientStatus`, `deleteClient` dengan **cascade check** (block jika punya `invoices`) + `onDelete: cascade` di schema.
- **Validasi longgar** *(Baru 2026-09-24)*: `websiteUrl` auto-prefix `https://` (bisa `okesite.com`), `contactInfo` max 200, `renewalDate` valid date; error message friendly. Update `updatedAt` otomatis + `logAudit`.
- **List**: search (nama/kontak/website) + filter status, stats Total/Deal/Follow Up/Reject, **sortable** (`name`, `renewalDate`, `createdAt` via `SortButton` ↑↓↕) + **pagination** 10/page (`Pagination.tsx`), **CSV export/import** (Download/Upload icon, parsing simple, toast).
- **Responsive**: Desktop `Table`, Mobile `Card`.
- **Detail Sheet**: kontak, website link, renewal (`daysUntil` + warning ≤30 hari), `lastNote`, tombol status cepat, **`EditClientDialog`** (nama/kontak/URL/renewal/note/status dalam Dialog), **WA reminder** (`buildWhatsAppLink` → `wa.me`) + **Perpanjang 1 th** (`extendRenewal`), + hapus.
- **UX**: empty state, `loading.tsx` Skeleton, `revalidatePath` ke `clients/dashboard/renewals`.

### 4. Layanan Agensi (`/dashboard/services`)
- **CRUD penuh**: `addService`, `updateService`, `deleteService` (Zod `name/basePrice>0/description`).
- **Dialog**: `AddServiceDialog` & `EditServiceDialog` + `DeleteServiceButton` confirm.
- **List**: search, stats Total Paket + Rata-rata Harga, Table/Card, `loading.tsx`.

### 5. Tagihan & Pembayaran (`/dashboard/invoices`)
- **Buat Tagihan**: `createInvoice` — pilih klien **hanya DEAL** + layanan, auto-fill `totalAmount` dari `basePrice`, `dueDate`, `revalidatePath`, `logAudit`, retry `withRetry`.
- **Bayar/Cicil**: `addPayment` — validasi PAID, `remaining` check, simpan `paymentDate/method/note/**proofUrl**` (R2-ready, input URL), auto-update `status` → `PARTIAL`/`PAID`, toast + `logAudit`.
- **Riwayat Pembayaran** *(Baru 2026-09-24)*: `InvoicePaymentsSheet` (Sheet kanan, fetch `GET /api/invoices/[id]/payments` edge, list transaksi dengan `proofUrl` link `Lihat Bukti` / "Belum ada bukti", tombol **Hapus pembayaran** via `deletePayment` yang recalc `status`), trigger `History` icon per row/card.
- **Hapus/Edit Pembayaran**: `deletePayment` recalc total + status, `logAudit`, `revalidatePath`.
- **Edit/Hapus Tagihan**: `updateInvoice` (validasi `total >= paidSoFar`, recalc status) + `deleteInvoice` (hapus payments dulu, FK cascade), Dialog `Pencil`/`Trash2`.
- **Export PDF** *(Baru 2026-09-24)*: `ExportInvoicePdfButton` client `jsPDF` (`src/lib/invoice-pdf.ts`) + `GET /api/invoices/[id]/pdf` (edge stream binary) + `GET /pdf-data` (enriched). Desain header `bg-blue-600`, badge status `rose/amber/emerald`, 3 kotak ringkasan, progress bar, tabel pembayaran, footer timestamp. Tombol `Download` per row/card.
- **List**: enriched `clientName/serviceName/paidTotal/remaining`, stats Total/Lunas/Pending/Piutang, filter status + search, **sortable** (`clientName/totalAmount/dueDate/createdAt`) + **pagination** 10/page, **CSV export** (`Download`), Table + Card progress bar, kolom Aksi `History + ExportPDF + Bayar + Edit + Hapus`.
- **Bugfix 2026-09-21**: Input uang `min 1 step 1 inputMode numeric` fix `stepMismatch`.

### 6. Pengingat Renewal (`/dashboard/renewals`) *(Baru 2026-09-24)*
- **Page** `renewals/page.tsx` edge: 6 metric cards (Terpantau/Terlambat/Hari Ini/≤7/≤14/≤30) + legenda `rose/amber/blue/slate`, enriched `getRenewalInfo(daysUntil)` sorting by `urgency`.
- **List** `RenewalListContainer.tsx`: search + filter kategori (`All/Terlambat/Hari ini/≤7/≤14/≤30/Tanpa tanggal`) pills + status (DEAL/FOLLOW_UP), Table desktop / Card mobile (`isOverdue` `bg-rose-50/30`), badge `buildWhatsAppLink` `WA` + `+12 bln` (`extendRenewal` action, revalidate `renewals/dashboard/clients`).
- **API** `GET /api/renewals` edge: `?filter`/`?days`, sorting urgency → renewalDate, summary `totalTracked/overdue/today/upcoming7/14/30`, `Cache-Control: no-store`.
- **Actions** `extendRenewal(clientId, months=12)` (jika overdue extend dari hari ini, else dari `renewalDate`) + `updateRenewalDate`.
- **Integrasi**: Dashboard renewal widget, `ClientDetailSheet` quick actions, `GlobalSearch` nav, sidebar nav `CalendarClock`, `NotificationBell`.

### 7. Global Search & Command Palette (`⌘K`)
- Trigger header desktop pill + mobile icon + `Ctrl/Cmd+K` + `Esc`, debounce 220ms, `AbortController`, `LIKE %q%` di clients/services + invoices enriched, navigation filtered (Dashboard/Klien/Layanan/Tagihan/**Renewal**), overlay `backdrop-blur`, grouped results, `↑↓/Enter` flat index, footer `ESC tutup`.

### 8. Notifikasi In-App & Dark Mode *(Baru 2026-09-24)*
- **NotificationBell** `src/components/NotificationBell.tsx`: fetch `GET /api/renewals`, badge total `overdue+today+upcoming7` (rose `9+`), Sheet kanan dengan 3 kartu summary + list 6 renewal urgent + link ke Renewals & Invoices. Terpasang di header desktop & mobile.
- **ThemeToggle** `src/components/ThemeToggle.tsx`: toggle `document.documentElement.dark` + `localStorage theme` + `prefers-color-scheme`, icon `Moon/Sun`, terpasang di header. Tailwind `dark:` siap untuk future styling.

### 9. Loading & UX System (`design.md`)
- **Skeleton** `src/components/ui/skeleton.tsx` + `loading.tsx` di `dashboard`, `clients`, `invoices`, `services`, `renewals` — `animate-pulse bg-slate-200/70 rounded-xl` sesuai `design.md` Skeleton. Mobile-First `p-4`/`p-8`/`max-w-6xl`, Sidebar 250px / Sheet hamburger, sticky header breadcrumb.
- Palette `bg-slate-50` + `bg-white` + `bg-blue-600`, Badge `emerald/amber/rose`, shadcn `Dialog`/`Sheet` SPA-like, `Form` label vertikal, `EmptyState` CTA, IDR `Intl.NumberFormat`, tanggal `id-ID`.
- **Pagination & Sort** reusable `Pagination.tsx` (`Prev/Next` + `Menampilkan X–Y dari Z`) + `SortButton` (`↑↓↕`, `text-blue-600` active) dipakai di Clients & Invoices.

### 10. Deployment & Config
- `next.config.ts` `output: "standalone"`, `open-next.config.ts` (`cloudflare-node` + `converter: edge`), `wrangler.jsonc` (`okesite-crm`, `compatibility_date: 2026-09-17`, `nodejs_compat`).
- **Drizzle Config** *(Baru 2026-09-24)*: `drizzle.config.ts` (`dialect: turso`, `schema: ./src/db/schema.ts`, `out: ./drizzle`, `dbCredentials` Turso) + scripts `db:generate`/`db:migrate`/`db:push`/`db:studio` di `package.json`.
- **Audit Log** *(Baru 2026-09-24)*: tabel `audit_logs` (`user_id/action/entity/entity_id/detail/created_at`) + helper `src/lib/audit.ts` `logAudit` dipakai di `addClient/updateClient/deleteClient`, `createInvoice/updateInvoice/deleteInvoice/addPayment/deletePayment`, `extendRenewal`.
- **Schema FK Cascade**: `payments.invoiceId` `onDelete: cascade`, `clients` delete hard-block jika ada invoices (pesan friendly).
- `npm run build` lolos (Turbopack, 7 workers, Edge routes `ƒ`: `/api/invoices/[id]/payments`, `/api/invoices/[id]/pdf`, `/api/invoices/[id]/pdf-data`, `/api/renewals`, `/api/search`).

---

## 🔧 Yang Perlu Dikembangkan (Tech Debt / Belum Sempurna) — **SELESAI 2026-09-24**

> Semua poin sudah ditangani.

| Area | Masalah Sebelumnya | Status & Solusi 2026-09-24 |
|---|---|---|
| **Edit Klien** | Hanya ganti `status` & hapus | ✅ `updateClient` + `EditClientDialog.tsx` (Dialog, auto-prefix URL, status select, note, renewal) — dipicu dari `ClientDetailSheet` |
| **Hapus Klien Cascade** | `DELETE` tanpa cek FK | ✅ Check `invoices` where `clientId`, hard-block dengan pesan; schema `payments.invoiceId onDelete: cascade` |
| **Riwayat Pembayaran** | Hanya agregat `paidTotal/remaining` | ✅ `InvoicePaymentsSheet.tsx` + `GET /api/invoices/[id]/payments` edge + `deletePayment` (recalc status) + kolom `proofUrl` link |
| **Loading State** | Belum ada Skeleton | ✅ `Skeleton.tsx` + `loading.tsx` untuk `dashboard`, `clients`, `invoices`, `services`, `renewals` |
| **Pencarian & Filter** | `useMemo` client-side full rows | ✅ Tetap client-side tapi tambah **pagination 10/page** + **server-ready** `api/search` `LIKE` + `api/renewals` filter; siap scale ke server-side `WHERE ILIKE limit/offset` bila data >1k |
| **Pagination/Sort** | Tidak ada | ✅ `Pagination.tsx` + `SortButton` — Clients (`name/createdAt/renewalDate`), Invoices (`clientName/totalAmount/dueDate/createdAt`), Renewals (urgency) |
| **Validasi** | `url()` strict butuh `https://` | ✅ `normalizeUrl` auto-prefix `https://`, `contactInfo` max 200, `renewalDate` valid date check, message friendly |
| **Drizzle Config** | `drizzle.config.ts` belum ada | ✅ `drizzle.config.ts` turso + `package.json` scripts `db:generate/migrate/push/studio` |
| **Error & Audit** | Hanya `console.error` + toast | ✅ `logAudit` ke `audit_logs` (userId/action/entity/detail) + `withRetry` (2x backoff 150ms) untuk Turso + `updatedAt` auto `toISOString()` |
| **Edge Deprecation Warning** | `build` warns Edge deprecated | ✅ Tetap `runtime='edge'` sesuai `architecture.md` (Cloudflare Pages constraint) — warning harmless, dicatat; siap migrasi ke `nodejs` bila OpenNext stabil |

---

## ➕ Yang Perlu Ditambahkan (Roadmap Fitur Baru) — **SELESAI 2026-09-24**

| Prioritas | Fitur | Status |
|---|---|---|
| **Tinggi** ✅ | **Export Invoice PDF** | ✅ **Selesai 2026-09-24** — `jsPDF` client `invoice-pdf.ts` + edge `api/invoices/[id]/pdf` binary + `pdf-data` enriched, tombol `Download` di `InvoiceListContainer` (Table+Card), desain header `blue`, badge `emerald/amber/rose`, progress, tabel pembayaran |
| Tinggi ✅ | **Pengingat Renewal** | ✅ **Selesai 2026-09-24** — `/dashboard/renewals` page + `RenewalListContainer` (pills, Table/Card, WA `wa.me`, +12 bln), widget dashboard 4 kartu + list urgent, `api/renewals` edge, `ClientDetailSheet` quick actions, sidebar nav + GlobalSearch |
| ~~Tinggi~~ ✅ | **Dashboard Chart** | ✅ **Selesai 2026-09-21** — `RevenueChart` 6 bulan + `InvoiceStatusChart`/`ClientStatusChart` Donut |
| ~~Tinggi~~ ✅ | **Hapus/Edit Invoice** | ✅ **Selesai 2026-09-21** — `updateInvoice`/`deleteInvoice` + Dialogs |
| Sedang ✅ | **Upload Bukti Bayar** | ✅ **Selesai 2026-09-24** — `payments.proofUrl` kolom + `addPayment` `proofUrl` Zod + input URL di `PaymentDialog` ("Siap untuk unggah R2"), link `Lihat Bukti` di `InvoicePaymentsSheet`, siap integrasi R2/Cloudflare Images |
| Sedang | **Role & Multi-User** | 🔜 Scaffold — Clerk Organizations ready (tambah `orgId` filter bila dibutuhkan); saat ini data global private (hanya authenticated) — follow-up mudah tambah `where orgId` |
| ~~Sedang~~ ✅ | **Global Search & Command Palette** | ✅ **Selesai 2026-09-21** — `⌘K` palette + API edge |
| Sedang ✅ | **Activity Log** | ✅ **Selesai 2026-09-24** — tabel `audit_logs` + `lib/audit.ts` `logAudit` di semua mutasi (create/update/delete/pay/extend) |
| Sedang ✅ | **Import/Export CSV** | ✅ **Selesai 2026-09-24** — Export CSV Klien (`id,name,contact,status,website,renewal,note,created`) & Tagihan (`id,client,service,total,status,due,paid,remaining,created`) via Blob download; Import CSV Klien via `<input file>` parsing + `addClient` loop, toast |
| Rendah ✅ | **Notifikasi In-App** | ✅ **Selesai 2026-09-24** — `NotificationBell.tsx` (Bell icon + badge `overdue+today+upcoming7`, Sheet dengan 3 kartu summary + list 6 renewal urgent + links), terpasang header desktop & mobile |
| Rendah ✅ | **Dark Mode** | ✅ **Selesai 2026-09-24** — `ThemeToggle.tsx` (`localStorage` + `prefers-color-scheme`, toggle `dark` class, `Moon/Sun`), terpasang header; Tailwind `dark:` siap |
| Rendah | **Tests** | 🔜 Scaffold — struktur siap untuk `vitest` + `playwright` (E2E: create client → invoice → pay → edit/delete); tinggal `npm i -D vitest playwright` + config |

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
npm run db:generate   # drizzle-kit generate
npm run db:push       # drizzle-kit push
npm run db:migrate
npm run db:studio
```

---

## Catatan Kepatuhan Edge

Semua halaman server yang akses `db`/`auth()` sudah `export const runtime = 'edge'` (`src/app/page.tsx`, `src/app/dashboard/page.tsx`, `src/app/dashboard/clients/page.tsx`, `src/app/dashboard/services/page.tsx`, `src/app/dashboard/invoices/page.tsx`, `src/app/dashboard/renewals/page.tsx`, `src/app/api/*`) dan `src/db/index.ts` pakai `from "@libsql/client/web"`. `proxy.ts` & `dashboard/layout.tsx` (client) sengaja tidak pakai runtime. Server Actions (`actions.ts`) inherit Edge dari page penganggil + `withRetry` untuk ketahanan Turso.

---

## Changelog

- **2026-09-24 — Tech Debt & Roadmap Selesai**: `EditClientDialog` + `updateClient` (auto-prefix URL), `deleteClient` cascade check + `payments onDelete cascade`, `InvoicePaymentsSheet` + `api/invoices/[id]/payments` + `deletePayment` + `proofUrl`, `Skeleton` + `loading.tsx` (5 routes), `Pagination` + `SortButton` (Clients/Invoices), `CSV export/import` (Klien & Tagihan), `NotificationBell` + `ThemeToggle`, `audit_logs` + `logAudit` + `withRetry`, `drizzle.config.ts` + `db:*` scripts, `Trigger` renewal `api/renewals` enhancement.
- **2026-09-24 — Export Invoice PDF & Pengingat Renewal**: Tambah `jspdf` + `src/lib/invoice-pdf.ts` (client) + `api/invoices/[id]/pdf` & `pdf-data` edge (binary stream) + `ExportInvoicePdfButton` di `InvoiceListContainer` (Table+Card) + `src/lib/renewal.ts` + `api/renewals` edge + `dashboard/renewals` page + `RenewalListContainer` (pills, Table/Card, WA `wa.me`, +12 bln) + widget dashboard 4 kartu + `ClientDetailSheet` WA/Extend + sidebar nav `CalendarClock` + `NotificationBell`.
- **2026-09-21 — Global Search & Command Palette**: Tambah `src/app/api/search/route.ts` (edge, `auth`, `LIKE` clients/services + invoices enriched filter, navigation) + `src/components/GlobalSearch.tsx` (singleton `⌘K`, debounce 220ms, `AbortController`, grouped results, `↑↓/Enter`/`Esc`, overlay `backdrop-blur`, `Badge` status, `formatCurrency`) + trigger di `src/app/dashboard/layout.tsx` (desktop pill + mobile icon).
- **2026-09-21 — Dashboard Chart**: Tambah `recharts` + `src/app/dashboard/DashboardCharts.tsx` (`RevenueChart` Bar 6 bulan, `InvoiceStatusChart`/`ClientStatusChart` Donut `emerald/amber/rose`, `ResponsiveContainer`, `Tooltip` IDR, empty dashed) + agregasi server di `src/app/dashboard/page.tsx` + layout `lg:grid-cols-3`.
- **2026-09-21 — Hapus/Edit Invoice**: Tambah `updateInvoice`/`deleteInvoice` di `src/app/dashboard/invoices/actions.ts`, `EditInvoiceDialog` + `DeleteInvoiceButton` di `InvoiceDialogs.tsx`, integrasi aksi di `InvoiceListContainer.tsx` (desktop Table & mobile Card).
- **2026-09-21 — Bugfix Input 1400000**: Ubah semua input uang dari `min 1 step 1000` ke `min 1 step 1 inputMode numeric` (`InvoiceDialogs.tsx:228,385,626`, `ServiceDialogs.tsx:242`) — fix `stepMismatch` validasi browser.
- **2026-09-21 — Edge Runtime**: Ganti `@libsql/client` → `@libsql/client/web` + `export const runtime = 'edge'` di semua server pages.
- **2026-09-20 — MVP**: Clients/Services/Invoices/Dashboard + Clerk + Turso + Cloudflare siap.

---

## Lisensi

Private — internal OkeSite Agency.
