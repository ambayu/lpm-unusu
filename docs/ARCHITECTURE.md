# Architecture — LPM UNUSU

## 1. Arsitektur Umum
LPM UNUSU dibangun dengan pola **Fullstack Monolith** terpisah secara modular:
- **Frontend**: Vite + React 18 SPA (`src/client`) dengan Tailwind CSS dan Heroicons.
- **Backend API**: Node.js Express (`src/server/index.ts`) melayani REST API di port 5004.
- **Database**: MySQL dengan Prisma ORM (`prisma/schema.prisma`).

## 2. Diagram Alur Autentikasi SSO Single-Use Token
```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna / Auditor
    participant Portal as ONE UNUSU Gateway (Port 5000 / 5173)
    participant Client as LPM Frontend (Vite)
    participant Server as LPM Backend (Port 5004)
    participant DB as MySQL (Prisma)

    User->>Client: Buka aplikasi LPM UNUSU
    Client->>Client: Cek sesi lokal (JWT di localStorage)
    alt Sesi tidak ada
        Client->>Portal: Redirect ke /authorize?client_id=lpm-unusu
        User->>Portal: Login dengan akun ONE UNUSU
        Portal->>Portal: Verifikasi kredensial & otorisasi role
        Portal->>Client: Redirect ke /sso/callback?token={SINGLE_USE_TOKEN}
        Client->>Server: POST /api/auth/sso { client_id, token }
        Server->>Portal: POST /api/v2/website/verify-token { client_id, client_key, token }
        Portal-->>Server: Token valid, data user & roles
        Server->>Server: Buat sesi lokal JWT
        Server-->>Client: Kembalikan session token & profil user
        Client->>Client: Simpan sesi & arahkan ke halaman utama
    else Sesi valid
        Client->>Server: Request data dengan Bearer Token
        Server->>DB: Query data SPMI / Dokumen / AMI
        DB-->>Server: Data hasil query
        Server-->>Client: JSON Response
    end
```

## 3. Skema Data (Prisma ORM)
1. **`StandarSpmi` (`lpm_standar_spmi`)**:
   - `id`, `kode`, `nama`, `kategori`, `pernyataan`, `indikator`, `target`, `tahun`
   - Relasi: One-to-Many ke `DokumenMutu` dan `AuditButir`.
2. **`DokumenMutu` (`lpm_dokumen_mutu`)**:
   - `id`, `standarId`, `kode`, `judul`, `tipe` (Kebijakan, Manual, Standar, SOP/Formulir), `nomorSk`, `tahun`, `fileUrl`
3. **`PeriodeAmi` (`lpm_periode_ami`)**:
   - `id`, `tahun`, `semester` (Ganjil/Genap), `nama`, `status` (DRAFT, BERJALAN, SELESAI), `tglMulai`, `tglSelesai`
   - Relasi: One-to-Many ke `AuditButir`.
4. **`AuditButir` (`lpm_audit_butir`)**:
   - `id`, `periodeId`, `standarId`, `auditee` (Prodi/Unit Kerja), `auditor`, `hasil` (TERLAMPAUI, SESUAI, KTS_MINOR, KTS_MAYOR, OBSERVASI), `deskripsi`, `rekomendasi`
