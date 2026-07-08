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