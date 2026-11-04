# ADR-0001 — Pemisahan Administrator per Aplikasi (App-Scoped Role)

- **Status:** Accepted
- **Tanggal:** 2026-11-04
- **Konteks modul:** Autentikasi SSO ONE UNUSU, seluruh panel `/admin/*`, RBAC
- **Rujukan kode:** `src/server/index.ts` (`resolveAppAccess`, `LPM_APP_ROLES`,
  `FOREIGN_APP_ADMIN_ROLES`, `requireLpmAdmin`, `GET /api/auth/me`),
  `src/client/context/AuthContext.tsx`, `src/client/pages/AccessDenied.tsx`,
  `src/client/App.tsx` (`ProtectedRoute`)

## Konteks

Ekosistem ONE UNUSU memakai **satu tabel pengguna** dengan peran berprefix aplikasi:
`SUPERADMIN`, `ADMIN_SSO`, `ADMIN_LPM`, `ADMIN_LPPM`, `ADMIN_ESURAT`, `ADMIN_SARPRAS`,
`ADMIN_AKREDITASI`, `ADMIN_LMS`, `DOSEN`, `MAHASISWA`. Token SSO yang diterbitkan portal
sah untuk seluruh ekosistem, sehingga tanpa pembatasan, admin LPPM dapat menukar token di
aplikasi LPM dan memperoleh sesi JWT LPM ber-peran `admin`.

Masalah tersebut adalah **pelanggaran batas domain**: administrator satu lembaga tidak
boleh memiliki kewenangan mutasi pada lembaga lain.

## Keputusan

1. Setiap aplikasi mendefinisikan **daftar peran miliknya sendiri**.
   Untuk LPM: `LPM_APP_ROLES = { SUPERADMIN, ADMIN_LPM, DOSEN }`.
2. Peran admin aplikasi lain didefinisikan eksplisit di `FOREIGN_APP_ADMIN_ROLES` dan
   **selalu ditolak**, dengan alasan yang dapat ditampilkan ke pengguna
   (`reason: "foreign_app_admin"`, `foreignApp: { code, name }`).
3. Otorisasi dihitung oleh **satu fungsi server** `resolveAppAccess(ssoRole)` yang
   mengembalikan `{ allowed, reason, ssoRole, role, roleLabel, isAppAdmin, foreignApp,
   message }`. Fungsi ini dipakai pada tiga titik:
   - `POST /api/auth/sso` (tukar token) → `403` + `code: FOREIGN_APP_ADMIN`;
   - middleware `authenticate` (setiap request) → menolak token lama/lintas aplikasi;
   - `GET /api/auth/me` (verifikasi sesi oleh klien).
4. JWT lokal menyertakan `ssoRole` dan `appCode: "lpm-unusu"` agar dapat diverifikasi ulang.
5. Klien **tidak menyimpan keputusan akses sebagai kebenaran**: `AuthContext` memanggil
   `GET /api/auth/me` saat boot, memakai `appAccess` dari server, dan menghapus token bila
   `allowed === false`. Nilai turunan lokal hanya dipakai sebagai fallback saat jaringan
   gagal, dengan aturan identik.
6. Peran di luar cakupan diarahkan ke rute `/akses-ditolak` yang menjelaskan sebabnya,
   bukan redirect senyap ke landing page.
7. Penugasan peran di panel LPM (`POST/PUT /api/users`) divalidasi dengan fungsi yang sama,
   sehingga admin LPM tidak dapat menganugerahkan peran aplikasi lain.

## Konsekuensi

**Positif**
- Batas domain antar lembaga ditegakkan di server, bukan hanya disembunyikan di UI.
- Pesan penolakan spesifik → mengurangi tiket "kenapa saya tidak bisa masuk".
- Satu sumber kebenaran (`resolveAppAccess`) mencegah aturan bercabang antar endpoint.
- Token lama (sebelum perubahan) otomatis tidak berlaku karena divalidasi ulang.

**Negatif / risiko**
- Menambah peran aplikasi baru (mis. `ADMIN_PERPUSTAKAAN`) menuntut pembaruan
  `FOREIGN_APP_ADMIN_ROLES` + `ROLE_LABEL`; bila lupa, peran tersebut jatuh ke
  `role_not_allowed` (tetap ditolak, namun pesannya kurang spesifik).
- Satu request tambahan (`/api/auth/me`) saat aplikasi dimuat.
- Pengguna dengan peran ganda di beberapa aplikasi harus memilih konteks yang benar;
  sampai portal menyediakan pemilih konteks, mereka memakai akun/peran yang sesuai.

## Alternatif yang ditolak

| Alternatif | Alasan ditolak |
|---|---|
| Hanya menyembunyikan menu di klien | Tidak aman; API tetap dapat dipanggil langsung |
| Tabel pengguna terpisah per aplikasi | Duplikasi identitas, melanggar arsitektur SSO tunggal ONE UNUSU |
| Membatasi lewat `client_id` saja | `client_id` menyatakan aplikasi tujuan, bukan hak peran pengguna |
| Menolak semua `ADMIN_*` termasuk `ADMIN_LPM` | Menghilangkan akses administrator sah aplikasi ini |

## Tindak lanjut

- QA: uji matriks peran (`SUPERADMIN`, `ADMIN_LPM`, `DOSEN`, `ADMIN_LPPM`, `MAHASISWA`)
  terhadap `/api/auth/sso`, `/api/auth/me`, dan satu endpoint mutasi (`POST /api/standar`).
- Bila portal ONE UNUSU menambahkan *context switching*, ADR ini perlu ditinjau.
