# Financia — Dashboard Keuangan Pribadi

Dashboard keuangan pribadi premium untuk mengelola pemasukan, pengeluaran, rekening,
transfer, tabungan, budget, laporan, dan analitik — dalam Rupiah (IDR).

- **Frontend**: React + Vite + Tailwind CSS + Recharts + Lucide Icons
- **Backend**: Google Apps Script (Web App)
- **Database**: Google Sheets

Frontend **tidak pernah** membaca Google Sheets secara langsung. Semua komunikasi
data melalui: `Frontend → Google Apps Script API → Google Sheets`.

## Fitur

Login & logout dengan protected route • Dashboard dengan kartu ringkasan, grafik,
dan insight otomatis • Pemasukan & Pengeluaran (CRUD, search, filter, sort,
pagination) • Rekening (Bank/Cash/E-Wallet) dengan saldo otomatis • Transfer antar
rekening • Target tabungan dengan progress bar • Budget bulanan per kategori
dengan indikator status • Laporan lengkap dengan export CSV • Analitik (saving
rate, rata-rata pengeluaran, tren, dll) • Kategori custom • Pengaturan & profil •
Dark mode • Full responsive (desktop, tablet, mobile dengan bottom navigation) •
Toast notification, confirmation modal, skeleton loading, empty state.

## Menjalankan secara Lokal

### 1. Install dependencies

```bash
npm install
```

### 2. Konfigurasi environment

```bash
cp .env.example .env
```

Jika Anda **belum** mendeploy backend Google Apps Script, biarkan
`VITE_API_BASE_URL` di `.env` kosong atau tetap berisi placeholder
`XXXXXXXXXXXXXXXX` — aplikasi otomatis berjalan dalam **mode demo** (data
tersimpan lokal di browser) sehingga Anda tetap bisa mencoba seluruh fitur.

Login demo:
- Email: `demo@financia.app`
- Password: `demo1234`

### 3. Jalankan development server

```bash
npm run dev
```

Buka `http://localhost:5173`.

### 4. Build untuk production

```bash
npm run build
```

Hasil build ada di folder `dist/`.

## Menghubungkan Backend Sungguhan (Google Sheets)

Ikuti panduan lengkap di [`backend/SHEETS_SETUP.md`](backend/SHEETS_SETUP.md):

1. Buat Google Spreadsheet baru dan sheet-sheet yang dibutuhkan.
2. Salin isi `backend/Code.gs` ke Extensions > Apps Script pada spreadsheet.
3. Jalankan `setup()` lalu `createDemoUser()` sekali dari editor Apps Script.
4. Deploy sebagai **Web app** (Execute as: Me, Who has access: Anyone).
5. Salin URL Web App ke `VITE_API_BASE_URL` pada `.env`.
6. Build ulang / restart dev server.

Setelah `VITE_API_BASE_URL` terisi URL valid, aplikasi otomatis berpindah dari
mode demo ke backend sungguhan tanpa perubahan kode apa pun.

## Deploy Frontend

Proyek ini adalah static site (hasil `npm run build`), sehingga bisa di-deploy ke:

- **GitHub Pages** — push folder `dist/` ke branch `gh-pages`, atau gunakan GitHub Actions.
- **Vercel** — import repo, build command `npm run build`, output directory `dist`.
- **Cloudflare Pages** — build command `npm run build`, output directory `dist`.

Pastikan environment variable `VITE_API_BASE_URL` (dan `VITE_APP_NAME` jika ingin
mengganti nama aplikasi) diset di dashboard platform hosting yang Anda pakai —
**jangan** commit file `.env` berisi nilai production ke repository.

## Struktur Proyek

```text
finance-dashboard/
│
├── src/
│   ├── components/      # UI reusable & layout (Sidebar, MobileNav, Modal, dst)
│   ├── pages/            # Halaman aplikasi (Dashboard, Transaksi, dst)
│   ├── charts/            # Komponen grafik (Recharts)
│   ├── context/          # AuthContext, AppContext (tema, toast)
│   ├── hooks/             # useDateRange, dst
│   ├── services/          # api.js (service layer) & localStore.js (mode demo)
│   └── utils/              # format Rupiah, tanggal, konstanta
│
├── backend/
│   ├── Code.gs             # Backend Google Apps Script (API lengkap)
│   └── SHEETS_SETUP.md    # Panduan setup Google Sheets & deploy Apps Script
│
├── public/
├── .env.example
├── .gitignore
├── package.json
└── vite.config.js
```

## Keamanan

- Password di-hash (SHA-256 + salt) di sisi server (Apps Script) — tidak pernah
  disimpan atau dikirim sebagai plaintext ke database.
- Sesi login memiliki token acak (UUID) dengan masa berlaku (default 8 jam),
  divalidasi di setiap request non-login.
- Setiap operasi baca/tulis data pada backend memfilter berdasarkan `user_id`
  pemilik sesi, sehingga user hanya dapat mengakses datanya sendiri.
- Tidak ada credential, API key, atau service account yang di-hardcode di
  frontend maupun repository — hanya URL Web App publik yang bersifat non-secret,
  disimpan melalui environment variable `VITE_API_BASE_URL`.
- Validasi input dilakukan di frontend (lapisan pertama) **dan** backend
  (wajib, sumber kebenaran utama).
- Setiap aktivitas penting (login, logout, tambah/edit/hapus data, transfer,
  ubah password) dicatat di sheet `Audit_Log`.

## Catatan Mode Demo

Saat `VITE_API_BASE_URL` belum dikonfigurasi, aplikasi menggunakan mesin data
lokal (`src/services/localStore.js`) yang meniru kontrak API Apps Script secara
identik menggunakan `localStorage` browser. Ini murni untuk keperluan mencoba
aplikasi sebelum backend sungguhan di-deploy — **bukan** pengganti Google
Sheets, dan data akan hilang jika Anda membersihkan data browser atau
menggunakan tombol "Reset Data Demo" di halaman Pengaturan.
