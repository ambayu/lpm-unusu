import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==========================================
// SESI SSO ONE UNUSU
// ==========================================
export interface SessionUser {
  id: number;
  username: string;
  nama: string;
  email: string | null;
  role: string;
  ssoRole: string;
  nim?: string | null;
  nidn?: string | null;
  prodi?: string | null;
  fakultas?: string | null;
}

/**
 * Cakupan akses aplikasi.
 *
 * Dihitung SERVER dari KEANGGOTAAN pengguna di tabel pengguna LPM, bukan dari
 * nama peran SSO. Pengguna yang belum didaftarkan Admin LPM tidak punya baris
 * keanggotaan sama sekali, sehingga masuk ke kategori `not_registered`.
 */
export type AppAccessReason =
  | 'allowed'
  | 'not_registered'
  | 'inactive_account'
  | 'no_role'
  | 'superadmin_bypass';

/** Tingkat masuk panel: ditentukan oleh izin masuk yang dimiliki. */
export type TingkatMasuk = 'admin' | 'dosen' | 'mahasiswa';

export interface AppAccessInfo {
  app: string;
  appName: string;
  allowed: boolean;
  reason: AppAccessReason;
  ssoRole: string;
  ssoRoleLabel: string;
  /** Tingkat masuk efektif (null bila belum ditetapkan peran di LPM). */
  tingkat: TingkatMasuk | null;
  roleLabel: string;
  isAppAdmin: boolean;
  /** Seluruh kunci izin milik pengguna (turunan dari peran LPM). */
  izin: string[];
  message: string;
}

/** Label tingkat akses panel LPM. */
export const LABEL_TINGKAT: Record<TingkatMasuk, string> = {
  admin: 'Administrator LPM',
  dosen: 'Dosen / Auditor Mutu',
  mahasiswa: 'Mahasiswa / Observer',
};

export const SSO_ROLE_LABEL: Record<string, string> = {
  SUPERADMIN: 'Superadmin Ekosistem',
  ADMIN_LPM: 'Administrator LPM',
  ADMIN_LPPM: 'Administrator LPPM',
  ADMIN_ESURAT: 'Administrator E-Surat',
  ADMIN_SARPRAS: 'Administrator Sarpras',
  ADMIN_AKREDITASI: 'Administrator Akreditasi',
  ADMIN_LMS: 'Administrator LMS',
  ADMIN_SSO: 'Administrator ONE UNUSU',
  DOSEN: 'Dosen / Auditor Mutu',
  MAHASISWA: 'Mahasiswa / Observer',
};

/** Peran admin aplikasi lain — hanya untuk pesan penolakan yang informatif. */
export const FOREIGN_APP_ROLES = [
  'ADMIN_LPPM',
  'ADMIN_ESURAT',
  'ADMIN_SARPRAS',
  'ADMIN_AKREDITASI',
  'ADMIN_LMS',
  'ADMIN_SSO',
] as const;

const TOKEN_KEY = 'lpm_unusu_token';
const USER_KEY = 'lpm_unusu_user';

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Rute publik yang boleh dibuka tanpa sesi. Respons 401 TIDAK boleh melempar
 * pengguna ke /login dari halaman-halaman ini.
 *
 * Cara lama membandingkan `window.location.pathname` dengan `BASE_URL + 'login'`.
 * Perbandingan itu rapuh: bila BASE_URL bukan '/' atau pathname berakhir garis
 * miring, hasilnya tidak cocok sehingga halaman publik seperti '/' ikut
 * terlempar ke /login. Sekarang pathname dinormalisasi lalu dicocokkan ke
 * daftar rute publik yang eksplisit.
 */
const PUBLIC_PATHS = ['/', '/login', '/sso/callback', '/akses-ditolak'];

const isPublicPath = (pathname: string) => {
  const path = pathname.replace(/\/+$/, '').replace(/\/index\.html$/, '');
  return PUBLIC_PATHS.includes(path || '/');
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;
    const path = window.location.pathname;
    if (status === 401 && !isPublicPath(path)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.replace('/login');
    }
    // Keanggotaan di luar cakupan aplikasi (belum terdaftar / nonaktif / tanpa
    // peran): sesi lokal dibersihkan agar tidak ada sisa kredensial lintas
    // aplikasi di peramban.
    if (
      status === 403 &&
      (code === 'NOT_REGISTERED' || code === 'INACTIVE' || code === 'NO_ROLE' || code === 'APP_ACCESS_DENIED')
    ) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    return Promise.reject(error);
  }
);

export const ssoLogin = (token: string) =>
  api.post<{
    success: boolean;
    token: string;
    user: SessionUser;
    appAccess?: AppAccessInfo;
    code?: string;
    message?: string;
  }>('/auth/sso', { token });

/** Verifikasi ulang sesi ke server + ambil cakupan akses & izin pengguna. */
export const fetchSession = () =>
  api.get<{ success: boolean; user: SessionUser; appAccess: AppAccessInfo; izin: string[] }>('/auth/me');

/**
 * Periksa status sesi terpusat di Identity Provider (ONE UNUSU).
 * - authenticated: true -> sesi ONE UNUSU aktif.
 * - authenticated: false -> pengguna telah logout dari ONE UNUSU.
 * - authenticated: null -> gagal menghubungi server SSO (offline/network error).
 *
 * Alamat memakai jalur relatif `/api` agar diteruskan server aplikasi ini
 * sendiri (lihat `GET /api/sso/session-check` di src/server/index.ts).
 * Sebelumnya di sini tertulis `http://localhost:5000/api`, yaitu alamat
 * komputer pengunjung — pemeriksaan selalu gagal di produksi sehingga
 * pengguna terlempar ke halaman masuk.
 */
export const checkOneUnusuSession = async () => {
  const ssoApiUrl = import.meta.env.VITE_SSO_API_URL || '/api';
  try {
    const res = await axios.get<{
      status: boolean;
      authenticated: boolean;
      user?: { username: string; nama: string; role: string };
      message?: string;
    }>(`${ssoApiUrl}/sso/session-check`, {
      withCredentials: true,
      timeout: 3500,
    });
    return res.data;
  } catch (err: any) {
    /*
     * Kegagalan menghubungi pemeriksa sesi BUKAN bukti sesi berakhir. Nilai
     * `authenticated: null` membuat pemanggil mempertahankan sesi lokal.
     */
    return {
      status: false,
      authenticated: null,
      message: err.message,
    };
  }
};

/** Tingkat masuk & seluruh kunci izin yang dikenali panel LPM. */
export const fetchAppRoles = () =>
  api.get<{
    success: boolean;
    app: string;
    appName: string;
    tingkatMasuk: { tingkat: TingkatMasuk; kunci: string; label: string }[];
    izinMasukDimiliki: string[];
    izin: { kunci: string; nama: string; grup: string }[];
  }>('/auth/app-roles');

export interface AccessDenialItem {
  id: string;
  at: string;
  source: 'sso_exchange' | 'api_request';
  ssoRole: string;
  reason: AppAccessReason;
  username: string;
  nama: string;
  foreignApp: string | null;
  path: string;
  ip: string;
}

/** Jejak penolakan akses lintas aplikasi (khusus Administrator LPM). */
export const fetchAccessDenials = (limit = 25) =>
  api.get<{
    success: boolean;
    app: string;
    data: AccessDenialItem[];
    total: number;
    summary: { foreignAdmin: number; other: number };
  }>('/security/access-denials', { params: { limit } });

export interface StandarItem {
  id: number;
  kode: string;
  nama: string;
  kategori: string;
  pernyataan: string;
  indikator?: string;
  target?: string;
  tahun: number;
  author?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DokumenMutuItem {
  id: number;
  standarId?: number | null;
  kodeDokumen: string;
  judul: string;
  jenis: string;
  revisi: number;
  filePath?: string | null;
  tahun: number;
  author?: string | null;
  createdAt?: string;
  updatedAt?: string;
  standar?: { nama: string; kode: string };
}

export interface AuditItem {
  id: number;
  periodeId: number;
  standarId: number;
  auditee: string;
  auditor: string;
  hasil: string;
  deskripsi?: string | null;
  rekomendasi?: string | null;
  author?: string | null;
  createdAt?: string;
  updatedAt?: string;
  periode?: { nama: string };
  standar?: { nama: string; kode: string };
}

export const fetchStandar = () => api.get<{ success: boolean; data: StandarItem[] }>('/standar');
export const fetchStandarDetail = (id: number | string) => api.get<{ success: boolean; data: StandarItem }>(`/standar/${id}`);
export const createStandar = (data: Partial<StandarItem>) => api.post<{ success: boolean; data: StandarItem }>('/standar', data);
export const updateStandar = (id: number | string, data: Partial<StandarItem>) => api.put<{ success: boolean; data: StandarItem }>(`/standar/${id}`, data);
export const deleteStandar = (id: number | string) => api.delete<{ success: boolean; message: string }>(`/standar/${id}`);

export const fetchDokumenMutu = () => api.get<{ success: boolean; data: DokumenMutuItem[] }>('/dokumen-mutu');
export const fetchDokumenMutuDetail = (id: number | string) => api.get<{ success: boolean; data: DokumenMutuItem }>(`/dokumen-mutu/${id}`);
export const createDokumenMutu = (data: Partial<DokumenMutuItem>) => api.post<{ success: boolean; data: DokumenMutuItem }>('/dokumen-mutu', data);
export const updateDokumenMutu = (id: number | string, data: Partial<DokumenMutuItem>) => api.put<{ success: boolean; data: DokumenMutuItem }>(`/dokumen-mutu/${id}`, data);
export const deleteDokumenMutu = (id: number | string) => api.delete<{ success: boolean; message: string }>(`/dokumen-mutu/${id}`);

export const fetchAudit = () => api.get<{ success: boolean; data: AuditItem[] }>('/audit');
export const fetchAuditDetail = (id: number | string) => api.get<{ success: boolean; data: AuditItem }>(`/audit/${id}`);
export const createAudit = (data: Partial<AuditItem>) => api.post<{ success: boolean; data: AuditItem }>('/audit', data);
export const updateAudit = (id: number | string, data: Partial<AuditItem>) => api.put<{ success: boolean; data: AuditItem }>(`/audit/${id}`, data);
export const deleteAudit = (id: number | string) => api.delete<{ success: boolean; message: string }>(`/audit/${id}`);

// ==========================================
// RINGKASAN DASHBOARD (`GET /api/dashboard/stats`)
// ==========================================
export interface DashboardStats {
  totalStandar: number;
  totalDokumen: number;
  totalAudit: number;
  totalUsers: number;
  totalRoles: number;
  totalPermissions: number;
  auditMayor: number;
  auditMinor: number;
  auditSesuai: number;
  /** Modul PPEPP — dihitung server (GROUP BY status indikator). */
  indikatorTotal: number;
  indikatorTercapai: number;
  tindakLanjutTerbuka: number;
  /** Rincian jumlah indikator per status ketercapaian. */
  indikatorStatus: { status: string; jumlah: number }[];
  /** Rincian jumlah tindak lanjut per status. */
  tindakLanjutStatus: { status: string; jumlah: number }[];
}

export interface DashboardPayload {
  stats: DashboardStats;
  /** 5 butir audit terakhir (include periode & standar). */
  recentAudits: AuditItem[];
  /** 5 standar SPMI terbaru. */
  recentStandar: StandarItem[];
  /** 5 dokumen mutu terbaru. */
  recentDokumen: DokumenMutuItem[];
}

export const fetchDashboardStats = () =>
  api.get<{ success: boolean; data: DashboardPayload }>('/dashboard/stats');

// ==========================================
// BANNER SLIDER HERO (`/api/sliders`, `/api/admin/sliders`)
// ==========================================
export interface LpmBannerSliderItem {
  id: number;
  judul: string;
  subjudul?: string | null;
  gambarUrl: string;
  gambarMobileUrl?: string | null;
  linkUrl?: string | null;
  urutan: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const fetchPublicSliders = () =>
  api.get<{ success: boolean; data: LpmBannerSliderItem[] }>('/sliders');

export const fetchAdminSliders = () =>
  api.get<{ success: boolean; data: LpmBannerSliderItem[] }>('/admin/sliders');

export interface SliderKiriman {
  judul?: string;
  subjudul?: string | null;
  linkUrl?: string | null;
  urutan?: number;
  active?: boolean;
  /** Berkas gambar atau video baru pengganti media lama. */
  berkas?: File | null;
}

/**
 * Media slider dikirim sebagai multipart/form-data, bukan JSON base64.
 *
 * Content-Type sengaja dihapus agar peramban menuliskannya sendiri lengkap
 * dengan boundary; tanpa itu multer menolak body dan berkas tidak terbaca.
 * Berkas hanya disertakan bila benar-benar ada, sehingga penyuntingan teks
 * saja tidak mengirim field kosong yang dianggap galat oleh server.
 */
const buatFormSlider = ({ berkas, ...teks }: SliderKiriman): FormData => {
  const form = new FormData();
  Object.entries(teks).forEach(([kunci, nilai]) => {
    if (nilai !== undefined && nilai !== null) form.append(kunci, String(nilai));
  });
  if (berkas) form.append("berkas", berkas);
  return form;
};

const KONFIG_MULTIPART = { headers: { "Content-Type": undefined } };

export const createAdminSlider = (data: SliderKiriman) =>
  api.post<{ success: boolean; message: string; data: LpmBannerSliderItem }>(
    "/admin/sliders",
    buatFormSlider(data),
    KONFIG_MULTIPART,
  );

export const updateAdminSlider = (id: number, data: SliderKiriman) =>
  api.put<{ success: boolean; message: string; data: LpmBannerSliderItem }>(
    "/admin/sliders/" + id,
    buatFormSlider(data),
    KONFIG_MULTIPART,
  );

export const deleteAdminSlider = (id: number) =>
  api.delete<{ success: boolean; message: string }>(`/admin/sliders/${id}`);

// ==========================================
// RBAC — PENGGUNA, PERAN, IZIN (DARI DATABASE)
// ==========================================

export interface RbacPengguna {
  id: number;
  userId: number;
  username: string;
  nama: string;
  email: string | null;
  ssoRole: string | null;
  status: string;
  role: string | null;
  peran: string[];
  createdAt?: string;
}

export interface RbacPeran {
  id: string;
  roleId?: number;
  name: string;
  kode: string;
  label: string;
  nama: string;
  description: string;
  deskripsi: string;
  permissionsCount: number;
  usersCount: number;
  isSystem: boolean;
  izin: string[];
}

export interface RbacIzin {
  id?: number;
  kunci: string;
  nama: string;
  grup: string;
  keterangan?: string;
}

/** Pengguna ONE UNUSU yang bisa dipilih dari direktori (tabel tambah pengguna). */
export interface KandidatPenggunaOne {
  id: number;
  username: string;
  nama: string;
  email: string | null;
  noHp?: string | null;
  nim?: string | null;
  nidn?: string | null;
  nip?: string | null;
  fakultas?: string | null;
  prodi?: string | null;
  jenisKelamin?: string | null;
  avatar?: string | null;
  isActive?: boolean;
  /** Kode peran kampus dari ONE UNUSU, mis. `DOSEN` atau `MAHASISWA`. */
  role?: string | null;
  roles?: string[];
  sudahTerdaftar: boolean;
}

export const fetchRbacPengguna = () =>
  api.get<{ success: boolean; data: RbacPengguna[] }>('/users');

/** Kriteria penelusuran direktori ONE UNUSU untuk halaman Tambah Pengguna. */
export interface KriteriaKandidat {
  search?: string;
  role?: string;
  fakultas?: string;
  prodi?: string;
}

/**
 * Menelusuri pengguna direktori ONE UNUSU lewat server LPM.
 *
 * Panel LPM tidak punya daftar pengguna kampus sendiri — Admin LPM hanya
 * memilih dari direktori SSO. Penelusuran diteruskan server memakai API key
 * yang tersimpan di sisi server, jadi key tidak pernah sampai ke browser.
 *
 * Seluruh kriteria bersifat opsional: tanpa kriteria sama sekali server tetap
 * mengembalikan maksimal 20 pengguna aktif agar tabel langsung terisi.
 */
export const cariKandidatPengguna = (kriteria: KriteriaKandidat | string = {}) => {
  const params: Record<string, string> = {};
  if (typeof kriteria === 'string') {
    if (kriteria) params.search = kriteria;
  } else {
    if (kriteria.search) params.search = kriteria.search;
    if (kriteria.role) params.role = kriteria.role;
    if (kriteria.fakultas) params.fakultas = kriteria.fakultas;
    if (kriteria.prodi) params.prodi = kriteria.prodi;
  }

  return api.get<{
    success: boolean;
    data: KandidatPenggunaOne[];
    meta: { total: number; search: string; role: string; fakultas: string; prodi: string };
  }>('/users/kandidat', { params });
};

/**
 * Mendaftarkan pengguna ONE UNUSU ke LPM.
 *
 * `peran` bersifat opsional: pendaftaran dan penugasan peran sengaja dipisah.
 * Pengguna disimpan lebih dulu tanpa peran, lalu Admin menetapkannya satu per
 * satu lewat modal "Atur Peran" pada daftar pengguna.
 *
 * `kandidat` tidak lagi dipakai untuk pencarian; server memverifikasi pilihan
 * berdasarkan `userIds` langsung ke ONE UNUSU lewat endpoint by-ids.
 */
export const createRbacPengguna = (data: {
  userIds: number[];
  peran?: string[];
  kandidat?: Array<{ id: number; nama?: string; username?: string }>;
}) => api.post<{ success: boolean; data: RbacPengguna[]; message: string }>('/users', data);
export const updateRbacPengguna = (
  id: number | string,
  data: Partial<{ nama: string; email: string | null; ssoRole: string | null; status: string; peran: string[] }>
) => api.put<{ success: boolean; data: RbacPengguna; message: string }>(`/users/${id}`, data);
export const deleteRbacPengguna = (id: number | string) =>
  api.delete<{ success: boolean; message: string }>(`/users/${id}`);

export const fetchRbacPeran = () =>
  api.get<{ success: boolean; data: RbacPeran[] }>('/roles');
export const createRbacPeran = (data: { kode: string; nama: string; deskripsi?: string; izin: string[] }) =>
  api.post<{ success: boolean; data: RbacPeran; message: string }>('/roles', data);
export const updateRbacPeran = (
  id: string,
  data: Partial<{ nama: string; deskripsi: string; izin: string[] }>
) => api.put<{ success: boolean; data: RbacPeran; message: string }>(`/roles/${id}`, data);
export const deleteRbacPeran = (id: string) =>
  api.delete<{ success: boolean; message: string }>(`/roles/${id}`);

export const fetchRbacIzin = () =>
  api.get<{ success: boolean; data: RbacIzin[] }>('/permissions');

export const fetchRbacMatriks = () =>
  api.get<{
    success: boolean;
    peran: RbacPeran[];
    izin: { kunci: string; nama: string; grup: string }[];
    izinMasuk: { tingkat: TingkatMasuk; kunci: string; label: string }[];
  }>('/rbac/matriks');

export const fetchRbacSummary = () =>
  api.get<{ success: boolean; data: { jumlahPeran: number; jumlahPengguna: number; jumlahIzin: number } }>(
    '/rbac/summary'
  );

// ==========================================
// DOKUMEN & KATEGORI (MODUL TERBARU)
// ==========================================

export interface KategoriItem {
  id: number;
  nama: string;
  deskripsi?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProdiOption {
  id: number;
  code: string;
  name: string;
  degree?: string;
  facultyName?: string;
}

export interface DokumenRecord {
  id: number;
  judul: string;
  nomor?: string | null;
  kategoriId: number;
  kategori?: KategoriItem;
  tahun: number;
  tanggalDokumen?: string | null;
  tanggalMulaiBerlaku?: string | null;
  tanggalBerakhir?: string | null;
  keterangan?: string | null;
  filePdfUrl?: string | null;
  fileSize?: number | null;
  status: string;
  tujuanPublish?: 'lpm' | 'prodi' | string;
  prodiCode?: string | null;
  prodiName?: string | null;
  createdBy?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export const fetchProdiList = () =>
  api.get<{ success: boolean; data: ProdiOption[] }>('/prodi');

export const fetchKategori = () =>
  api.get<{ success: boolean; data: KategoriItem[] }>('/kategori');

export const fetchKategoriDetail = (id: number | string) =>
  api.get<{ success: boolean; data: KategoriItem }>(`/kategori/${id}`);

export const createKategori = (data: { nama: string; deskripsi?: string | null }) =>
  api.post<{ success: boolean; data: KategoriItem; message: string }>('/kategori', data);

export const updateKategori = (id: number | string, data: { nama?: string; deskripsi?: string | null }) =>
  api.put<{ success: boolean; data: KategoriItem; message: string }>(`/kategori/${id}`, data);

export const deleteKategori = (id: number | string) =>
  api.delete<{ success: boolean; message: string }>(`/kategori/${id}`);

export const fetchDokumen = (params?: { search?: string; status?: string; tahun?: number; skip?: number; take?: number }) =>
  api.get<{ success: boolean; data: DokumenRecord[]; meta: { total: number; skip: number; take: number; pages: number } }>('/dokumen', { params });

export const fetchDokumenDetail = (id: number | string) =>
  api.get<{ success: boolean; data: DokumenRecord }>(`/dokumen/${id}`);

export const createDokumen = (data: Partial<DokumenRecord>) =>
  api.post<{ success: boolean; data: DokumenRecord; message: string }>('/dokumen', data);

/**
 * Mengunggah berkas PDF dokumen ke penyimpanan arsip.
 *
 * Body dikirim sebagai JSON `{ nama, data }` dengan `data` berupa base64.
 * Base64 hanya dipakai sebagai alat transportasi sekali jalan — server
 * menyimpannya sebagai berkas dan mengembalikan URL bertanda tangan yang
 * kemudian diisi ke kolom `filePdfUrl`. Jadi tidak ada lagi PDF base64 yang
 * tersimpan di database.
 */
export const uploadBerkasDokumen = async (file: File) => {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Peramban gagal membaca isi berkas PDF.'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  // Buang awalan `data:application/pdf;base64,` — hanya isi base64 yang dikirim.
  const data = dataUrl.slice(dataUrl.indexOf(',') + 1);
  return api.post<{ success: boolean; data: { url: string; ukuran: number; nama: string | null }; message: string }>(
    '/dokumen/berkas',
    { nama: file.name, data },
  );
};

export const updateDokumen = (id: number | string, data: Partial<DokumenRecord>) =>
  api.put<{ success: boolean; data: DokumenRecord; message: string }>(`/dokumen/${id}`, data);

export const deleteDokumen = (id: number | string) =>
  api.delete<{ success: boolean; message: string }>(`/dokumen/${id}`);

export default api;
