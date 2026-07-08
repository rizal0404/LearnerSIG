# Changelog

Semua perubahan penting dicatat di file ini agar implementasi, perubahan, dan penambahan fitur mudah dimonitor.

Format mengikuti gaya Keep a Changelog sederhana.

## [0.1.0] - 2026-07-08

### Changed

- Login automation menunggu `LOGIN_SUCCESS_URL` dengan timeout yang dapat dikonfigurasi.
- Discovery course menggunakan parser item unik dari teks halaman untuk mengurangi duplikasi selector.
- Dokumentasi `.env` menjelaskan password dengan karakter `#` harus di-quote.

- File scaffold dinormalisasi ke UTF-8 tanpa BOM untuk kompatibilitas 	sx.
- Selector login diperluas untuk field login pada portal SIG.
- Login failure sekarang menghasilkan screenshot debug di screenshots/login-failure.png.

### Added

- Scaffold Node.js/TypeScript untuk LearnerSIG.
- Konfigurasi `.env.example` untuk portal, akun, course, browser, dan output discovery.
- Browser automation dasar menggunakan Playwright.
- Login portal dengan selector generik.
- Discovery struktur course dan klasifikasi item pre-test, post-test, video, dokumen, atau unknown.
- Writer laporan JSON untuk hasil discovery.
- Dokumentasi MVP, prinsip penggunaan, cara menjalankan, batasan, dan roadmap.
