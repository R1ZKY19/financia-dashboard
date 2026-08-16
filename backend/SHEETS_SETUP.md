# Setup Google Sheets — Financia

Panduan membuat struktur database Google Sheets untuk backend Financia.

## 1. Buat Spreadsheet Baru

Buat Google Spreadsheet baru (nama bebas, misal **"Financia Database"**).

## 2. Buat Sheet & Kolom

Anda bisa membuat sheet berikut secara manual, **atau** cukup jalankan fungsi
`setup()` di Apps Script (lihat `Code.gs`) untuk membuatnya otomatis.

### Sheet: `Users`
| id | name | email | password_hash | status | created_at | last_login |
|----|------|-------|----------------|--------|------------|------------|

### Sheet: `Transactions`
| id | user_id | date | type | category | subcategory | account_id | amount | description | created_at | updated_at |
|----|---------|------|------|----------|-------------|------------|--------|--------------|------------|------------|

`type` hanya boleh berisi `income` atau `expense`.

### Sheet: `Accounts`
| id | user_id | name | type | initial_balance | status | created_at |
|----|---------|------|------|------------------|--------|------------|

`type`: `bank` / `cash` / `ewallet` / `other`.

### Sheet: `Categories`
| id | user_id | name | type | status | created_at |
|----|---------|------|------|--------|------------|

### Sheet: `Transfers`
| id | user_id | date | from_account | to_account | amount | description | created_at |
|----|---------|------|--------------|------------|--------|--------------|------------|

### Sheet: `Savings`
| id | user_id | name | target_amount | current_amount | target_date | status | created_at |
|----|---------|------|----------------|-----------------|-------------|--------|------------|

### Sheet: `Budgets`
| id | user_id | month | category | budget_amount | created_at |
|----|---------|-------|----------|----------------|------------|

`month` berformat `YYYY-MM`, contoh `2026-08`.

### Sheet: `Audit_Log`
| id | user_id | action | module | record_id | timestamp | ip_or_session |
|----|---------|--------|--------|-----------|-----------|----------------|

### Sheet: `Sessions`
| token | user_id | expires_at | created_at |
|-------|---------|------------|------------|

Sheet ini menyimpan sesi login aktif. Jangan pernah membagikan isi sheet ini.

## 3. Deploy Apps Script

1. Di spreadsheet, buka **Extensions > Apps Script**.
2. Hapus isi file `Code.gs` default, tempel isi file `backend/Code.gs` dari repo ini.
3. Jalankan fungsi `setup()` sekali (pilih dari dropdown fungsi di toolbar, lalu klik ▶ Run).
   Berikan izin akses yang diminta.
4. Buka fungsi `createDemoUser()`, ubah `email`, `password`, dan `name` sesuai
   kebutuhan Anda, lalu jalankan sekali untuk membuat akun pertama.
5. Klik **Deploy > New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Salin **Web app URL** yang diberikan.

## 4. Hubungkan ke Frontend

Isi `.env` di root proyek frontend:

```
VITE_API_BASE_URL=https://script.google.com/macros/s/XXXXXXXXXXXXXXXX/exec
```

Build ulang (`npm run build`) atau restart `npm run dev` agar perubahan terbaca.

## Keamanan

- **Jangan** bagikan spreadsheet ini secara publik (Editor akses hanya untuk Anda).
- **Jangan** commit `.env` yang berisi URL Apps Script ke repository publik jika
  Anda menganggapnya sensitif (walaupun URL ini sendiri tidak berisi secret,
  praktik terbaik tetap menyimpannya sebagai environment variable, bukan hardcode).
- Password pengguna disimpan sebagai **hash SHA-256 + salt**, bukan plaintext.
  Ganti nilai `SALT` di `Code.gs` dengan string acak milik Anda sendiri sebelum
  deploy ke production.
- Setiap request non-login divalidasi terhadap sheet `Sessions` dan setiap
  operasi baca/tulis data selalu difilter berdasarkan `user_id` pemilik sesi.
