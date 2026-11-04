# Architecture Decision Records (ADR)

Catatan keputusan arsitektural LPM UNUSU. Satu keputusan = satu berkas, tidak dihapus
(walaupun kemudian digantikan — tandai `Superseded by ADR-XXXX`).

## Kapan menulis ADR

Tulis ADR bila keputusan:
- mengikat lebih dari satu modul/halaman,
- mengubah kontrak keamanan (auth, otorisasi, penyimpanan sesi),
- memilih pola teknis yang akan ditiru pekerjaan berikutnya,
- sulit dibalik (skema data, format token, pemisahan aplikasi).

## Format berkas

`ADR-XXXX-judul-singkat.md`, dengan bagian:

```md
# ADR-XXXX — Judul

- Status: Proposed | Accepted | Superseded by ADR-YYYY
- Tanggal: YYYY-MM-DD
- Konteks modul: ...

## Konteks
## Keputusan
## Konsekuensi (positif / negatif / risiko)
## Alternatif yang ditolak
## Rujukan kode
```

## Indeks

| ADR | Judul | Status | Tanggal |
|---|---|---|---|
| [ADR-0001](./ADR-0001-app-scoped-admin.md) | Pemisahan administrator per aplikasi (app-scoped role) | Accepted | 2026-11-04 |
