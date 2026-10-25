# Our Little Goals 💑
> *Small Savings, Big Memories.*

Aplikasi web modern, romantis, dan aman untuk menabung bersama pasangan sekaligus mengelola wishlist impian pribadi. Didesain secara khusus untuk **Lutfi Idham Puro** (Partner) dan **Thania Al Zahra** (Partner & Bendahara Umum).

---

## ✨ Fitur Utama

1. **Ruang Tabungan Pasangan (Couple Space)**
   - Sistem undangan menggunakan kode unik (*Invite Code*).
   - Dua akun terhubung dalam satu ruang tabungan bersama yang transparan.

2. **Target Tabungan Bersama (Shared Savings Goals)**
   - Kategori lengkap: Liburan, Kuliner, Hadiah, Anniversary, Transportasi, Hiburan, dll.
   - Estimasi harga minimum & maksimum, target nominal, dan tanggal deadline.
   - Progress bar real-time, persentase ketercapaian, dan nominal yang masih kurang.

3. **Setoran Tabungan Harian (Senin - Jumat)**
   - Pilihan nominal cepat: **Rp 5.000**, **Rp 10.000**, **Rp 15.000**, dan **Rp 20.000**.
   - Input catatan/bukti setoran.
   - Status setoran berjenjang: *Pending* ➔ *Verified* (oleh Bendahara) / *Rejected*.

4. **Panel Khusus Bendahara Umum (Thania Al Zahra)**
   - Hanya akun Bendahara Umum yang dapat mengakses rute `/bendahara`.
   - Ringkasan kas riil (saldo uang fisik / rekening kas bersama).
   - Verifikasi dana masuk (validasi apakah uang fisik/transfer sudah diterima).
   - Fitur tolak setoran disertai alasan penolakan yang jelas.
   - Persetujuan (*approval*) atau penolakan pengajuan pengeluaran dana tabungan.

5. **Pengajuan Pengeluaran Dana (Expense Requests)**
   - Partner dapat mengajukan penggunaan dana dari tabungan bersama (misal untuk DP tiket, hotel, atau belanja kebutuhan target).
   - Saldo target dan kas bersama otomatis berkurang setelah disetujui Bendahara.

6. **Wishlist Pribadi (Personal Wishlists)**
   - Mengelola impian dan belanja pribadi masing-masing tanpa mengganggu tabungan bersama.
   - Pilihan privasi: *Private* (hanya saya) atau *Shared* (dapat dilihat pasangan).
   - Skala prioritas: Tinggi, Sedang, Santai.
   - Alokasi tabungan pribadi khusus untuk tiap barang wishlist.

7. **Kalender Habit & Streak Tracker**
   - Kalender visual bulanan untuk memantau konsistensi menabung setiap hari kerja (Senin - Jumat).
   - Penghitung *streak* berturut-turut untuk membangun kebiasaan finansial yang sehat.
   - Rincian aktivitas harian saat tanggal pada kalender diklik.

8. **Riwayat Transaksi & Ekspor Data**
   - Transparansi menyeluruh: mutasi tabungan bersama, tabungan pribadi, dan pengeluaran.
   - Filter berdasarkan jenis transaksi, status, dan pencarian kata kunci.
   - Fitur **Ekspor CSV** untuk dokumentasi atau pelaporan berkala.

9. **Desain Elegan, Romantis, & Responsif**
   - Palet warna hangat: *Cream, Ivory, Soft Pink, Warm Coffee*, dan aksen *Burgundy*.
   - Tipografi anggun dengan Google Fonts *Playfair Display* & *Inter*.
   - *Dark mode* bernuansa *Coffee Dark* yang nyaman di malam hari.
   - Tampilan optimal di desktop, tablet, dan smartphone.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Custom CSS Tokens, Lucide Icons
- **State Management**: Zustand
- **Routing**: React Router DOM v7
- **Notifikasi**: Sonner Toast
- **Backend & Database**: Supabase (PostgreSQL, Supabase Auth, Row Level Security)

---

## 🚀 Panduan Instalasi & Menjalankan Lokal

### 1. Prasyarat
- [Node.js](https://nodejs.org/) (versi 18 atau lebih baru)
- Akun gratis di [Supabase](https://supabase.com/)

### 2. Clone atau Buka Folder Proyek
Masuk ke direktori proyek di terminal / PowerShell:
```powershell
cd "c:\WebNabungNia&Idham"
```

### 3. Setup Supabase Database
1. Buka [Supabase Dashboard](https://app.supabase.com/) dan buat proyek baru (misal: `Our Little Goals`).
2. Masuk ke menu **SQL Editor** di sidebar kiri.
3. Buka file [`supabase/schema.sql`](./supabase/schema.sql) pada proyek ini, salin seluruh kodenya, dan tempelkan ke SQL Editor Supabase.
4. Klik tombol **Run** untuk membuat semua tabel, trigger profil otomatis, dan Row Level Security (RLS) policies.
5. *(Opsional)* Di menu **Authentication** -> **Providers** -> **Email**:
   - Jika ingin langsung login saat registrasi tanpa menunggu verifikasi email, nonaktifkan opsi **"Confirm email"**.

### 4. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env`:
```powershell
cp .env.example .env
```
Buka file `.env` lalu masukkan kredensial dari Supabase (**Project Settings** ➔ **API**):
```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 5. Menjalankan Aplikasi
Di Windows PowerShell:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm run dev
```
Buka browser di alamat `http://localhost:5173`.

---

## 👥 Skenario Penggunaan Berdua (Lutfi & Thania)

1. **Registrasi Akun Thania (Bendahara Umum)**:
   - Buka `/register`, masukkan nama lengkap `Thania Al Zahra`, email, dan password.
   - Sistem secara otomatis menandai peran Thania sebagai Bendahara Umum.
   - Buat ruang pasangan (misal: *"Idham & Nia Goals"*), lalu salin **Kode Undangan** yang muncul di Dashboard.

2. **Registrasi Akun Lutfi (Partner)**:
   - Buka `/register` di perangkat atau browser lain, masukkan nama `Lutfi Idham Puro`.
   - Di Dashboard, masukkan **Kode Undangan** dari Thania lalu klik *"Gabung Ruang"*.
   - Sekarang kedua akun sudah terhubung dalam satu ruang tabungan bersama!

3. **Membuat Target Tabungan**:
   - Klik menu **Tabungan** ➔ **Tambah Target**.
   - Masukkan tujuan, nominal target (misal Rp 5.000.000), estimasi, kategori, dan deadline.

4. **Menabung Harian**:
   - Buka target tabungan, klik **Sisihkan Tabungan Hari Ini**.
   - Pilih nominal (Rp 5.000 s/d Rp 20.000) dan masukkan catatan. Setoran masuk ke status *Pending*.

5. **Verifikasi oleh Thania**:
   - Thania membuka menu **Bendahara** (`/bendahara`).
   - Cek uang fisik / mutasi bank. Jika dana sudah masuk, klik **Verifikasi Dana Masuk**.
   - Saldo target dan kas bertambah, habit kalender otomatis tercentang hijau, dan Lutfi menerima notifikasi verifikasi!

---

## 📦 Deployment ke Cloud (Vercel / Netlify)

1. Hubungkan repository GitHub ini ke akun [Vercel](https://vercel.com/) atau [Netlify](https://www.netlify.com/).
2. Konfigurasikan Environment Variables pada project dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Aplikasi langsung aktif dan dapat diakses melalui link publik dari smartphone masing-masing!
