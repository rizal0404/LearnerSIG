# LearnerSIG MVP

LearnerSIG adalah aplikasi pendamping simulasi pembelajaran korporasi. MVP tahap 1 berfokus pada login portal, membuka course, membaca struktur konten, dan menyimpan hasil discovery ke file JSON.

## Prinsip Penggunaan

- Gunakan hanya pada portal, akun, dan course yang memiliki izin eksplisit untuk simulasi, QA, audit, atau otomasi internal.
- MVP tahap 1 tidak menjawab pre-test atau post-test secara otomatis.
- Kredensial disimpan di `.env` lokal dan tidak masuk ke Git.

## Cara Menjalankan

1. Salin `.env.example` menjadi `.env`.
2. Isi `PORTAL_URL`, `PORTAL_USERNAME`, `PORTAL_PASSWORD`, dan `COURSE_URL`.
3. Install dependency dengan `npm install`.
4. Jalankan discovery dengan `npm run discover`.
5. Lihat output di path `DISCOVERY_OUTPUT`, default `reports/course-discovery.json`.

## Konfigurasi Loading Portal

Portal dapat loading lama setelah login. Gunakan variabel berikut jika perlu:

- `LOGIN_SUCCESS_URL=/erp` untuk menandai redirect login berhasil.
- `LOGIN_TIMEOUT_MS=120000` untuk timeout login 120 detik.
- `PAGE_LOAD_TIMEOUT_MS=120000` untuk timeout navigasi halaman 120 detik.

Jika `PORTAL_PASSWORD` mengandung karakter `#`, bungkus nilainya dengan quote di `.env`, contoh `PORTAL_PASSWORD="abc#123"`.

## Batas MVP Tahap 1

- Login menggunakan selector generik username/password/submit.
- Discovery daftar konten menggunakan selector generik.
- Output mencakup judul course, jumlah item, jenis item, dan progress jika persentase terbaca dari teks halaman.
- Jika portal memakai UI khusus, selector perlu disesuaikan di `src/portal/selectors.ts`.

## Roadmap

- Tahap 2: validasi urutan materi dan watcher progress video sampai 100%.
- Tahap 3: screenshot bukti progres dan laporan sesi.
- Tahap 4: ekstraksi transkrip video dari subtitle/audio.
- Tahap 5: timer assisted mode untuk pre-test dan post-test.

## Troubleshooting

### Discovery kembali ke halaman login

Jika 
pm run discover gagal dengan pesan browser masih berada di halaman login:

- Pastikan PORTAL_USERNAME dan PORTAL_PASSWORD benar.
- Pastikan akun dapat login melalui form username/password, bukan hanya SSO Office 365.
- Jika portal wajib SSO, MVP perlu ditambah mode login SSO atau storage session manual.
- Cek screenshot screenshots/course-discovery-failure.png untuk melihat halaman terakhir.

### Item course tidak terbaca

Jika login berhasil tetapi item course tetap 0, sesuaikan selector di src/portal/selectors.ts.
