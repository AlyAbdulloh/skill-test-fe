# GriyaHub - Frontend Installation Guide

Panduan instalasi dan persiapan untuk service frontend dashboard berbasis React, TypeScript, Vite, dan DaisyUI.

## Prasyarat (Requirements)
Pastikan komputer lokal Anda sudah terinstall:
* **Node.js >= 20.x**
* **npm** (atau package manager alternatif seperti yarn/pnpm)

---

## Langkah-langkah Instalasi

### 1. Masuk ke Direktori Project
```bash
cd skill-test-fe
```

### 2. Install Node Dependencies
Unduh dan install seluruh dependensi UI/library yang dibutuhkan:
```bash
npm install
```

### 3. Setup Konfigurasi Environment
Salin file `.env.example` menjadi `.env.development` (atau `.env.local` / `.env`):
```bash
cp .env.example .env.development
```

Buka file `.env.development` tersebut dan sesuaikan URL API dengan service backend Anda:
```env
VITE_API_BASE_URL=http://skill-test-api.test/api
VITE_FILE_PATH=http://skill-test-api.test/storage/
```
*(Atur `VITE_API_BASE_URL=http://localhost:8000/api` jika Anda menggunakan server php artisan serve standar)*

### 4. Menjalankan Development Server
Mulai server development lokal dengan perintah:
```bash
npm run dev
```
Setelah berjalan, buka browser dan akses URL yang ditampilkan di terminal (biasanya **`http://localhost:5173`**).

---

## Kredensial Akun Login Default
Gunakan akun administrator berikut untuk masuk ke dashboard utama (dihasilkan oleh database seeders backend):
* **Email:** `admin@gmail.com`
* **Password:** `admin123`

## Melakukan Production Build
Untuk menguji proses kompilasi kode bersih dan mem-bundle aset untuk production:
```bash
npm run build
```
Aset siap pakai akan dihasilkan di folder `dist/`.
