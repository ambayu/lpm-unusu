import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface StandarItem {
  id: number;
  kode: string;
  nama: string;
  kategori: string;
  pernyataan: string;
  indikator?: string;
  target?: string;
  tahun: number;
}

export interface DokumenMutuItem {
  id: number;
  kodeDokumen: string;
  judul: string;
  jenis: string;
  revisi: number;
  standar?: { nama: string; kode: string };
}

export interface AuditItem {
  id: number;
  auditee: string;
  auditor: string;
  hasil: string;
  deskripsi?: string;
  rekomendasi?: string;
  periode?: { nama: string };
  standar?: { nama: string; kode: string };
}

export const fetchStandar = () => api.get<{ success: boolean; data: StandarItem[] }>('/standar');
export const fetchDokumenMutu = () => api.get<{ success: boolean; data: DokumenMutuItem[] }>('/dokumen-mutu');
export const fetchAudit = () => api.get<{ success: boolean; data: AuditItem[] }>('/audit');

export default api;
