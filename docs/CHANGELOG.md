# Changelog

Semua perubahan penting dicatat di file ini agar implementasi, perubahan, dan penambahan fitur mudah dimonitor.

Format mengikuti gaya Keep a Changelog sederhana.

## [0.1.1] - 2026-07-08

### Added

- Perintah `npm run save-session` untuk menyimpan state browser Playwright ke `.auth/session.json`.
- Perintah `npm run discover:session` untuk discovery pakai session tersimpan.
- Opsi config `SESSION_STATE_PATH` di `.env.example`.
- Helper `src/browser/session-store.ts` untuk menyimpan storageState.

### Changed

- Browser session menggunakan launch mode khusus saat menyimpan session manual.

## [0.1.0] - 2026-07-08

### Added

- Scaffold Node.js/TypeScript untuk LearnerSIG.
- Konfigurasi `.env.example` untuk portal, akun, course, browser, dan output discovery.
- Browser automation dasar menggunakan Playwright.
- Login portal dengan selector generik.
- Discovery struktur course dan klasifikasi item pre-test, post-test, video, dokumen, atau unknown.
- Writer laporan JSON untuk hasil discovery.
- Dokumentasi MVP, prinsip penggunaan, cara menjalankan, batasan, dan roadmap.