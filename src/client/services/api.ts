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
 * Cakupan akses aplikasi (app-scoped role).
 * Dihitung SERVER, bukan klien — klien hanya menampilkan hasilnya.
 */
export type AppAccessReason =
  | 'allowed'
  | 'foreign_app_admin'
  | 'role_not_allowed'
  | 'missing_role';

export interface AppAccessInfo {
  app: string;
  appName: string;
  allowed: boolean;
  reason: AppAccessReason;
  ssoRole: string;
  role: string;
  roleLabel: string;
  isAppAdmin: boolean;
  foreignApp: { code: string; name: string } | null;
  message: string;
}

/** Peran SSO yang sah untuk aplikasi LPM (selaras dengan server). */
export const LPM_APP_ROLES = ['ADMIN_LPM', 'SUPERADMIN', 'DOSEN'] as const;

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

/** Peran admin aplikasi lain — ditolak pada penugasan peran di panel LPM. */
export const FOREIGN_APP_ROLES = [
  'ADMIN_LPPM',
  'ADMIN_ESURAT',
  'ADMIN_SARPRAS',
  'ADMIN_AKREDITASI',
  'ADMIN_LMS',
  'ADMIN_SSO',
] as const;

export const isLpmScopedRole = (ssoRole?: string | null): boolean =>
  !!ssoRole && (LPM_APP_ROLES as readonly string[]).includes(ssoRole.toUpperCase());

const TOKEN_KEY = 'lpm_unusu_token';
const USER_KEY = 'lpm_unusu_user';

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;
    const path = window.location.pathname;
    if (status === 401 && path !== import.meta.env.BASE_URL + 'login' && path !== import.meta.env.BASE_URL + 'sso/callback') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.replace(import.meta.env.BASE_URL + 'login');
    }
    // Peran di luar cakupan aplikasi (mis. admin LPPM): sesi lokal dibersihkan
    // agar tidak ada sisa kredensial lintas aplikasi di peramban.
    if (status === 403 && (code === 'FOREIGN_APP_ADMIN' || code === 'APP_ACCESS_DENIED')) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    return Promise.reject(error);
  }
);

export const ssoLogin = (client_id: string, token: string) =>
  api.post<{
    success: boolean;
    token: string;
    user: SessionUser;
    appAccess?: AppAccessInfo;
    code?: string;
    message?: string;
  }>('/auth/sso', { client_id, token });

/** Verifikasi ulang sesi ke server + ambil cakupan akses aplikasi. */
export const fetchSession = () =>
  api.get<{ success: boolean; user: SessionUser; appAccess: AppAccessInfo }>('/auth/me');

/** Daftar peran yang sah untuk aplikasi LPM (dropdown penugasan peran). */
export const fetchAppRoles = () =>
  api.get<{
    success: boolean;
    app: string;
    appName: string;
    data: { code: string; label: string; internalRole: string; isAppAdmin: boolean }[];
    deniedRoles: { code: string; label: string; appName: string }[];
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

export default api;
