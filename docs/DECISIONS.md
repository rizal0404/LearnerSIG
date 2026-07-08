# Architecture Decisions

## ADR-001: Playwright sebagai browser automation layer

- Status: Accepted
- Tanggal: 2026-07-08

### Konteks

Portal pembelajaran kemungkinan berbasis web modern dengan video, progress bar, dan konten dinamis.

### Keputusan

Gunakan Playwright karena mendukung browser automation modern, selector kuat, mode headed/headless, dan API stabil untuk observasi DOM serta elemen video.

### Konsekuensi

- Dependency browser perlu diinstall sebelum menjalankan automation.
- Selector portal perlu dipelihara jika UI berubah.

## ADR-002: `.env` lokal untuk kredensial

- Status: Accepted
- Tanggal: 2026-07-08

### Konteks

User akan menyediakan alamat portal dan kredensial dalam file environment.

### Keputusan

Gunakan `dotenv` dan validasi `zod`. File `.env` diabaikan oleh Git.

### Konsekuensi

- Konfigurasi gagal cepat jika variabel wajib belum ada.
- Rahasia tidak tercatat di repository.
