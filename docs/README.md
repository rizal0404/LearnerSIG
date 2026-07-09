# LearnerSIG MVP

LearnerSIG adalah aplikasi pendamping simulasi pembelajaran korporasi. MVP tahap 1 berfokus pada login portal, membuka course, membaca struktur konten, dan menyimpan hasil discovery ke file JSON.

## Prinsip Penggunaan

- Gunakan hanya pada portal, akun, dan course yang memiliki izin eksplisit untuk simulasi, QA, audit, atau otomasi internal.
- MVP tahap 1 tidak menjawab pre-test atau post-test secara otomatis.
- Kredensial disimpan di `.env` lokal dan tidak masuk ke Git.
- Session browser disimpan di `.auth/session.json` dan tidak masuk ke Git.

## Cara Menjalankan Discovery Normal

1. Salin `.env.example` menjadi `.env`.
2. Isi `PORTAL_URL`, `PORTAL_USERNAME`, `PORTAL_PASSWORD`, dan `COURSE_URL`.
3. Install dependency dengan `npm install`.
4. Jalankan discovery dengan `npm run discover`.
5. Lihat output di path `DISCOVERY_OUTPUT`, default `reports/course-discovery.json`.

## Cara Menjalankan Dengan Session Tersimpan

Gunakan mode ini jika portal lambat, login perlu stabilisasi, atau ingin menghindari login ulang setiap run.

1. Jalankan `npm run save-session`.
2. Browser headed akan terbuka dan login menggunakan kredensial `.env`.
3. Setelah login sukses, session tersimpan ke `SESSION_STATE_PATH`, default `.auth/session.json`.
4. Jalankan discovery berikutnya dengan `npm run discover:session`.

Jika session expired, jalankan ulang `npm run save-session`.



## Cara Menjalankan Video Berurutan

Tahap 2 menjalankan semua item video secara berurutan berdasarkan hasil discovery halaman course sampai progress terbaca `100%`.
Tahap 3 menambahkan rekam progress sesi dan screenshot bukti penyelesaian otomatis.
Tahap 4 mengekstrak transkrip jika video menyediakan subtitle, caption, atau transcript text di halaman.

1. Pastikan discovery sudah bisa membaca item video dengan `npm run discover:session`.
2. Jalankan `npm run run-videos:session` untuk memakai session tersimpan, atau `npm run run-videos` untuk login ulang.
3. Runner akan membuka video sesuai urutan, memutar elemen `<video>`, lalu kembali ke halaman course untuk polling progress.
4. Lihat laporan di `VIDEO_RUN_OUTPUT`, default `reports/video-run.json`.
5. Lihat screenshot bukti progress di `PROGRESS_EVIDENCE_DIR`, default `screenshots/progress-evidence`.
6. Lihat transkrip video di `TRANSCRIPT_OUTPUT_DIR`, default `reports/transcripts`.

Jika video panjang, naikkan `MAX_VIDEO_MINUTES` di `.env`.

## Konfigurasi `.env`

- `PORTAL_URL`: URL halaman login portal.
- `PORTAL_USERNAME`: username portal.
- `PORTAL_PASSWORD`: password portal.
- `COURSE_URL`: URL course target.
- `HEADLESS`: `true` atau `false` untuk discovery normal.
- `SLOW_MO_MS`: delay Playwright per aksi.
- `MAX_TEST_MINUTES`: batas waktu pre/post-test untuk tahap berikutnya.
- `MAX_VIDEO_MINUTES`: batas waktu maksimal per video, default `60` menit.
- `DISCOVERY_OUTPUT`: path output JSON discovery.
- `VIDEO_RUN_OUTPUT`: path output JSON hasil runner video.
- `PROGRESS_EVIDENCE_DIR`: folder screenshot dan teks bukti progress Tahap 3, default `screenshots/progress-evidence`.
- `TRANSCRIPT_OUTPUT_DIR`: folder output transkrip Tahap 4, default `reports/transcripts`.
- `SESSION_STATE_PATH`: path file session Playwright.
- `LOGIN_SUCCESS_URL`: penanda URL login berhasil, default `/erp`.
- `LOGIN_TIMEOUT_MS`: timeout login, default `120000`.
- `PAGE_LOAD_TIMEOUT_MS`: timeout navigasi halaman, default `120000`.

Jika `PORTAL_PASSWORD` mengandung karakter `#`, bungkus nilainya dengan quote di `.env`, contoh `PORTAL_PASSWORD="abc#123"`.

## Batas MVP Tahap 1

- Login menggunakan selector generik username/password/submit.
- Discovery daftar konten menggunakan selector generik dan parser teks halaman.
- Output mencakup judul course, jumlah item, jenis item, dan progress jika persentase terbaca.
- Jika portal memakai UI khusus, selector perlu disesuaikan di `src/portal/selectors.ts`.

## Troubleshooting

### Discovery kembali ke halaman login

- Pastikan `.env` benar dan password dengan `#` sudah di-quote.
- Jika memakai session, jalankan ulang `npm run save-session`.
- Cek debug di `screenshots/course-discovery-failure.*`.

### Portal loading lama

- Naikkan `LOGIN_TIMEOUT_MS` dan `PAGE_LOAD_TIMEOUT_MS`.
- Gunakan `npm run discover:session` setelah session disimpan.

### Item course tidak terbaca

Jika login berhasil tetapi item course tetap 0, sesuaikan selector di `src/portal/selectors.ts` atau parser di `src/portal/course.ts`.

## Roadmap

- Tahap 2: validasi urutan materi dan watcher progress video sampai 100%. (implemented)
- Tahap 3: screenshot bukti progres dan laporan sesi. (implemented)
- Tahap 4: ekstraksi transkrip video dari subtitle/caption/transcript text. (implemented)
- Tahap 5: timer assisted mode untuk pre-test dan post-test.
