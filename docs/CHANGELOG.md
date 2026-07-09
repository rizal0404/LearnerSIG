# Changelog

Semua perubahan penting dicatat di file ini agar implementasi, perubahan, dan penambahan fitur mudah dimonitor.

Format mengikuti gaya Keep a Changelog sederhana.

## [0.4.0] - 2026-07-09

### Added

- Ekstraksi transkrip per video dari `textTracks`, file subtitle `<track src>`, atau transcript/caption text yang terlihat di halaman.
- Output file `.txt` per video di `TRANSCRIPT_OUTPUT_DIR`.
- Metadata transkrip pada setiap item `completedVideos` di laporan `VIDEO_RUN_OUTPUT`.
- Konfigurasi `TRANSCRIPT_OUTPUT_DIR` di `.env.example`.

## [0.3.0] - 2026-07-09

### Added

- Rekam snapshot progress awal dan akhir pada laporan `VIDEO_RUN_OUTPUT`.
- Screenshot dan teks bukti penyelesaian video di `PROGRESS_EVIDENCE_DIR`.
- Bukti per video untuk item yang baru selesai maupun yang sudah `100%` saat runner dimulai.
- Konfigurasi `PROGRESS_EVIDENCE_DIR` di `.env.example`.

## [0.2.0] - 2026-07-08

### Added

- Perintah `npm run run-videos` dan `npm run run-videos:session` untuk menjalankan video course secara berurutan.
- Runner video yang membuka tiap video, memutar elemen `<video>`, dan polling progress course sampai `100%`.
- Konfigurasi `MAX_VIDEO_MINUTES` dan `VIDEO_RUN_OUTPUT`.
- Laporan JSON hasil video run di `reports/video-run.json` secara default.

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
