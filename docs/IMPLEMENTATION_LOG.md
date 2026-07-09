# Implementation Log

Log ini digunakan untuk mencatat pekerjaan teknis harian secara ringkas.

## 2026-07-08

- Membuat MVP tahap 1 dari repository kosong.
- Menambahkan konfigurasi TypeScript dan script npm.
- Menambahkan modul `config`, `browser`, `portal`, dan `storage`.
- Menambahkan dokumentasi monitoring perubahan: `CHANGELOG.md`, `DECISIONS.md`, dan `IMPLEMENTATION_LOG.md`.

## 2026-07-08 - Fix Discovery Runtime

- Memperbaiki encoding file scaffold menjadi UTF-8 tanpa BOM agar 	sx dapat membaca package.json.
- Mengunduh Chromium Playwright yang sesuai dengan versi dependency.
- Memperluas selector login untuk portal yang memakai field login.
- Menambahkan screenshot debug screenshots/login-failure.png ketika proses login gagal.
- Memvalidasi 
pm run discover berhasil menghasilkan eports/course-discovery.json.

## 2026-07-08 - Discovery Guardrails

- Menambahkan guardrail agar discovery gagal jika browser masih berada di halaman login.
- Menambahkan screenshot debug screenshots/course-discovery-failure.png jika item course tidak terbaca atau redirect login terjadi.
- Hasil validasi portal saat ini: halaman kembali ke login, kemungkinan kredensial form belum diterima atau portal memerlukan SSO Office 365.

## 2026-07-08 - Login Success Timeout dan Parser Course

- Menambahkan `LOGIN_SUCCESS_URL`, `LOGIN_TIMEOUT_MS`, dan `PAGE_LOAD_TIMEOUT_MS` untuk portal yang loading-nya lama.
- Login automation sekarang menunggu redirect sukses ke `/erp` atau keluar dari halaman login hingga 120 detik.
- Discovery course tidak lagi bergantung pada `networkidle` yang sering tertahan request background.
- Parser course dirapikan agar output item unik: pre-test, video berurutan, dan post-test.
- Validasi `npm run discover` berhasil membaca 4 item course Leaders Cafe.
## 2026-07-08 - Save-session load-session
- Menambahkan command save-session dan discover --session.
- Menyimpan Playwright storageState ke .auth/session.json secara default.
- Discovery bisa dijalankan ulang tanpa login manual selama session masih valid.

## 2026-07-08 - MVP Tahap 2 Video Runner

- Menambahkan command `run-videos` dan `run-videos --session`.
- Menambahkan runner untuk menjalankan item video berurutan berdasarkan index discovery.
- Runner memutar video yang ditemukan di halaman utama atau iframe, lalu polling progress course sampai `100%`.
- Menambahkan laporan `VIDEO_RUN_OUTPUT` dan timeout `MAX_VIDEO_MINUTES`.

## 2026-07-09 - MVP Tahap 3 Progress Evidence

- Menambahkan helper screenshot bukti progress dengan output PNG dan body text.
- Laporan video run sekarang menyimpan snapshot progress awal dan akhir course.
- Setiap video yang selesai atau sudah `100%` mendapat evidence path di laporan JSON.
- Menambahkan konfigurasi `PROGRESS_EVIDENCE_DIR` untuk folder bukti penyelesaian.

## 2026-07-09 - MVP Tahap 4 Video Transcript

- Menambahkan extractor transkrip dari text track aktif, file subtitle `<track src>`, dan elemen transcript/caption yang terlihat.
- Runner video menyimpan transkrip sebelum video diputar atau saat video yang sudah selesai dibuka ulang.
- Menambahkan output teks per video di `TRANSCRIPT_OUTPUT_DIR` dan metadata transkrip ke laporan video run.
- Jika subtitle tidak tersedia, laporan tetap mencatat status transkrip `not-found` tanpa menggagalkan sesi.
