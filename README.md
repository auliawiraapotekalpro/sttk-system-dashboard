<div align="center">
  <h1 align="center">STTK Management System</h1>
  <p align="center">
    Sistem Manajemen STTK komprehensif untuk Manajer Area dan Manajer.
    <br />
    <br />
    <a href="#">Lihat Demo</a>
    ·
    <a href="#">Laporkan Bug</a>
  </p>
</div>

![Project Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## Tentang Proyek

**STTK Management System** adalah aplikasi web yang dirancang untuk Manajer Area (AM) dan Manajer guna menyederhanakan proses pelaporan, pemantauan, dan analisis Surat Tanda Terima Kembali (STTK). Aplikasi ini menyediakan dashboard intuitif dengan metrik kunci, tampilan data terperinci, pelacakan KPI, dan formulir untuk mengirimkan laporan STTK baru.

Sistem ini dibangun untuk meningkatkan efisiensi, akurasi data, dan memberikan wawasan yang dapat ditindaklanjuti untuk pengambilan keputusan yang lebih baik.

### Fitur Utama

- **Dashboard Manajer Area:** Visualisasi ringkas data STTK berdasarkan Area dan AM.
- **Dashboard Manajer:** Tampilan tingkat tinggi dari tren pengiriman, laporan yang tertunda, dan kinerja AM.
- **Formulir Input Data Dinamis:** Formulir komprehensif untuk mengirimkan laporan STTK baru dengan perhitungan denda otomatis dan distribusi penalti.
- **Tampilan Data Terpusat:** Tabel terperinci dari semua laporan STTK dengan fungsi pencarian dan filter.
- **Approval Satu Klik:** Manajer dapat meninjau dan menyetujui laporan yang tertunda langsung dari antarmuka.
- **Analisis KPI:** Melacak metrik kinerja utama seperti AM dengan pengiriman tertinggi, toko dengan akurasi terendah, dan AM yang belum mengirimkan laporan.
- **Ekspor ke XLSX:** Unduh semua data laporan dalam format `.xlsx` untuk analisis offline.
- **Otentikasi Pengguna:** Sistem login aman yang membedakan peran antara Manajer Area dan Manajer.

### Dibangun Dengan

- **Frontend:** [React](https://reactjs.org/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend:** [Google Apps Script](https://developers.google.com/apps-script) (sebagai Web App yang terhubung ke Google Sheets)
- **Deployment:** [GitHub Pages](https://pages.github.com/)

---

## Memulai

Untuk menjalankan salinan lokal, ikuti langkah-langkah sederhana ini.

### Prasyarat

Pastikan Anda telah menginstal Node.js dan npm di mesin Anda.
- **Node.js** (versi 16 atau lebih tinggi)
  ```sh
  node -v
  ```
- **npm** (biasanya terinstal bersama Node.js)
  ```sh
  npm -v
  ```

### Panduan Instalasi

#### 1. Backend (Google Apps Script)

Aplikasi ini menggunakan Google Apps Script yang terhubung ke Google Sheet sebagai backend-nya.

1.  **Buat Google Sheet Baru:** Buka [Google Sheets](https://sheets.new) dan beri nama, misalnya "Database STTK".
2.  **Buka Apps Script Editor:** Dari menu Google Sheet, buka `Extensions` > `Apps Script`.
3.  **Salin Kode Backend:** Salin semua konten dari file `backend/main.gs` di repositori ini dan tempelkan ke editor Apps Script, ganti semua kode yang ada.
4.  **Deploy sebagai Web App:**
    - Klik `Deploy` > `New deployment`.
    - Pilih tipe `Web app`.
    - Pada "Execute as", pilih `Me`.
    - Pada "Who has access", pilih `Anyone`. **Penting:** Ini diperlukan agar frontend dapat berkomunikasi dengan backend.
    - Klik `Deploy`.
5.  **Salin URL Web App:** Setelah deployment berhasil, salin **Web app URL** yang diberikan. Anda akan membutuhkannya untuk langkah frontend.

#### 2. Frontend (React App)

1.  **Clone Repositori**
    ```sh
    git clone https://github.com/USERNAME/NEW_REPO_NAME.git
    cd NEW_REPO_NAME
    ```
2.  **Instal Dependensi NPM**
    ```sh
    npm install
    ```
3.  **Konfigurasi URL Backend**
    - Buka file `src/services/apiService.ts`.
    - Tempelkan URL Web App yang Anda salin dari Google Apps Script ke dalam konstanta `WEB_APP_URL`.
      ```ts
      // src/services/apiService.ts
      const WEB_APP_URL = "URL_WEB_APP_ANDA_DARI_APPS_SCRIPT";
      ```
4.  **Jalankan Aplikasi Secara Lokal**
    ```sh
    npm run dev
    ```
    Buka [http://localhost:5173](http://localhost:5173) (atau port lain yang ditampilkan di terminal) di browser Anda.

---

## Deployment ke GitHub Pages

Proyek ini sudah dikonfigurasi untuk deployment yang mudah ke GitHub Pages.

1.  **Konfigurasi `vite.config.ts`**
    - Buka `vite.config.ts`.
    - Ubah properti `base` agar sesuai dengan nama repositori Anda.
      ```ts
      // vite.config.ts
      export default defineConfig({
        // ...
        base: '/NAMA_REPO_ANDA/', // <-- Ganti dengan nama repo Anda
      })
      ```
2.  **Konfigurasi `package.json`**
    - Buka `package.json`.
    - Tambahkan properti `homepage` di bagian atas file, ganti `USERNAME` dan `NAMA_REPO_ANDA`.
    ```json
    {
      "name": "nama-proyek-anda",
      "homepage": "https://USERNAME.github.io/NAMA_REPO_ANDA/",
      // ...
    }
    ```
3.  **Jalankan Skrip Deploy**
    Perintah ini akan secara otomatis membangun proyek dan mendorongnya ke branch `gh-pages` di repositori Anda.
    ```sh
    npm run deploy
    ```
4.  **Aktifkan GitHub Pages**
    - Di repositori GitHub Anda, buka `Settings` > `Pages`.
    - Di bawah "Build and deployment", pilih `gh-pages` sebagai branch sumber (`Source`).
    - Simpan perubahan. Situs Anda akan tersedia di URL `homepage` yang Anda konfigurasikan setelah beberapa menit.