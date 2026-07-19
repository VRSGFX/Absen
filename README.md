<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/2fe93737-d74a-47ec-9e08-fc8bbb13124c

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

---

## Backend: Firebase (Auth) + Supabase (Database)

Aplikasi ini memakai:
- **Firebase Authentication** — login/register siswa & guru (NISN/NIP dipetakan ke email sintetis `<nisn>@edutrack.local` secara internal).
- **Supabase (Postgres)** — semua data: profil pengguna, absensi, pengumuman, nilai, kalender sekolah, dan kode QR.

### Setup

1. **Firebase** — buka [Firebase Console](https://console.firebase.google.com) → project kamu → Authentication → Sign-in method → aktifkan **Email/Password**. Kredensial project sudah diisi di `.env.local`.
2. **Supabase** — buka Supabase Dashboard → project kamu → **SQL Editor**, jalankan isi file [`supabase-schema.sql`](./supabase-schema.sql). Kredensial project sudah diisi di `.env.local`.
3. Install & jalankan:
   ```bash
   npm install
   npm run dev
   ```

### Alur pendaftaran siswa (mandiri + persetujuan admin)

1. Siswa daftar sendiri di halaman **Siswa** dengan NISN, email, password, nama, jurusan, kelas (X/XI/XII), dan tipe kelas (A/B/C/Tidak ada).
2. Akun baru otomatis berstatus **"Menunggu Persetujuan"** — belum bisa dipakai untuk absen/lihat dashboard.
3. Admin membuka tab **Data Siswa & Nilai** di Admin Panel → menyetujui atau menolak pendaftaran.
4. Setelah disetujui, siswa bisa langsung masuk dan pakai dashboard secara penuh.
5. Guru yang daftar lewat portal Guru **tidak** melalui proses persetujuan ini (langsung aktif).

### Alur QR absensi per kelas

1. Admin membuka tab **QR Settings** → klik **"Buat QR"** untuk membuat satu kode QR baru (belum terikat kelas).
2. Admin mengirim teks kode tersebut ke guru wali kelas (lewat WhatsApp/chat, dsb).
3. Guru login ke portal Guru/Admin, buka tab **QR Settings**, klik **"Register QR"** pada kode yang diterima, lalu pilih kelas, jurusan, dan tipe kelas untuk mengikat kode tersebut ke kelasnya.
4. QR yang sudah terdaftar bisa diunduh sebagai gambar dan ditampilkan di kelas.
5. Siswa memasukkan/memindai teks kode tersebut saat proses absensi (Scanner) — sistem menolak kode yang belum terdaftar atau sedang dinonaktifkan.
6. Admin/guru bisa menonaktifkan atau menghapus kode QR kapan saja dari tab yang sama.

### Data Siswa & Export Excel

Tab **Data Siswa & Nilai** menampilkan seluruh data siswa sesuai database (NISN, nama, kelas, jurusan, tipe, credit score, status) dalam bentuk tabel, lengkap dengan tombol **Export Excel** untuk mengunduh sebagai file `.xlsx`.

### Catatan penting

- **Akun admin pertama**: form registrasi hanya membuat akun `student` atau `teacher`. Untuk membuat akun admin, daftar dulu sebagai guru lewat portal Guru/Admin, lalu di Supabase Table Editor ubah kolom `role` pada baris tersebut di tabel `profiles` menjadi `admin`.
- **Keamanan RLS**: karena login memakai Firebase Auth (bukan Supabase Auth), Supabase tidak bisa membaca `auth.uid()` milik Firebase. Policy RLS di `supabase-schema.sql` dibuat terbuka (read/write via anon key) supaya app tetap berfungsi penuh dari client. Untuk produksi yang lebih ketat, pertimbangkan menambahkan Supabase Edge Function yang memverifikasi Firebase ID token sebelum melakukan write sensitif (mis. ubah `credit_score`, `role`, atau approval status).
- **Data lama**: versi sebelumnya menyimpan data di `localStorage` (mock). Setelah update ini, semua data baru tersimpan permanen di Supabase — data mock lama tidak otomatis dipindahkan.
