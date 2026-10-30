import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
    const path = window.location.pathname;
    if (status === 401 && path !== import.meta.env.BASE_URL + 'login' && path !== import.meta.env.BASE_URL + 'sso/callback') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.replace(import.meta.env.BASE_URL + 'login');
    }
    return Promise.reject(error);
  }
);

export const ssoLogin = (client_id: string, token: string) =>
  api.post<{ success: boolean; token: string; user: SessionUser; message?: string }>('/auth/sso', { client_id, token });

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
