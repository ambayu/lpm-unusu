import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheckIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  KeyIcon,
  CheckCircleIcon,
  LockClosedIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import { CardContainer } from '../components/CardContainer';
import { ErrorState } from '../components/ErrorState';
import { fetchAppRoles } from '../services/api';

interface RoleItem {
  id: string;
  name: string;
  label: string;
  description: string;
  permissionsCount: number;
  usersCount: number;
  isSystem: boolean;
}

interface ScopeRoleItem {
  code: string;
  label: string;
  internalRole: string;
  isAppAdmin: boolean;
}

export const RolesPage: React.FC = () => {
  const { user: currentUser, isAppAdmin } = useAuth();
  // Satu sumber kebenaran cakupan aplikasi: `isAppAdmin` dari AuthContext
  // (diturunkan dari `appAccess` server), bukan tebakan dari field role lokal.
  const isAdmin = isAppAdmin;
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    label: '',
    description: '',
  });

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('lpm_unusu_token') || localStorage.getItem('lpm_token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch('/api/roles', { credentials: 'include', headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success) setRoles(json.data);
      } else {
        throw new Error('Gagal memuat daftar peran.');
      }
    } catch (err: any) {
      console.error('Gagal mengambil data peran', err);
      setError(err.message || 'Terjadi kesalahan saat memuat data peran.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Cakupan peran lintas aplikasi (admin LPPM dkk. tidak sah di panel LPM).
  const [scopeRoles, setScopeRoles] = useState<ScopeRoleItem[]>([]);
  const [deniedScopeRoles, setDeniedScopeRoles] = useState<{ code: string; label: string; appName: string }[]>([]);
  const [scopeLoading, setScopeLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetchAppRoles()
      .then((res) => {
        if (!active || !res.data?.success) return;
        setScopeRoles(res.data.data ?? []);
        setDeniedScopeRoles(res.data.deniedRoles ?? []);
      })
      .catch(() => {
        /* panel cakupan bersifat informatif — kegagalan tidak memblokir halaman */
      })
      .finally(() => {
        if (active) setScopeLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const openAddModal = () => {
    setEditingRole(null);
    setFormData({ name: '', label: '', description: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (role: RoleItem) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      label: role.label,
      description: role.description,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('lpm_unusu_token') || localStorage.getItem('lpm_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const url = editingRole ? `/api/roles/${editingRole.id}` : '/api/roles';
      const method = editingRole ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchRoles();
      } else {
        const err = await res.json();
        alert(err.message || 'Gagal menyimpan peran');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem');
    }
  };

  const handleDelete = async (role: RoleItem) => {
    if (role.isSystem) {
      alert('Peran sistem bawaan tidak dapat dihapus.');
      return;
    }
    if (!window.confirm(`Yakin ingin menghapus peran "${role.label}"?`)) return;

    try {
      const token = localStorage.getItem('lpm_unusu_token') || localStorage.getItem('lpm_token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`/api/roles/${role.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        fetchRoles();
      } else {
        const err = await res.json();
        alert(err.message || 'Gagal menghapus peran');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <CardContainer>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-[10px] bg-amber-50 text-amber-800 flex items-center justify-center">
                <ShieldCheckIcon className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Manajemen Peran (Roles)</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Pengelompokan wewenang berbasis peran (Role-Based Access Control) dalam penjaminan mutu LPM UNUSU.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition shadow-xs cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
              Tambah Peran Baru
            </button>
          )}
        </div>
      </CardContainer>

      {/* Grid of Roles */}
      {error ? (
        <ErrorState description={error} onRetry={fetchRoles} />
      ) : loading ? (
        <CardContainer>
          <div className="p-12 text-center text-xs text-slate-500">
            Memuat daftar peran...
          </div>
        </CardContainer>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((role) => (
            <div
              key={role.id}
              className="bg-white rounded-[14px] border border-[#CBD5E1] p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-[10px] bg-blue-50 text-blue-900 flex items-center justify-center font-bold">
                      <ShieldCheckIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">{role.label}</h2>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {role.name}
                      </span>
                    </div>
                  </div>
                  {role.isSystem && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      Sistem
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                  {role.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <span className="text-slate-400 text-[10px] block">Cakupan Izin</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <KeyIcon className="w-3.5 h-3.5 text-blue-700" />
                      {role.permissionsCount} Izin
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <span className="text-slate-400 text-[10px] block">Total Anggota</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                      {role.usersCount} Pengguna
                    </span>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(role)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <PencilSquareIcon className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  {!role.isSystem && (
                    <button
                      onClick={() => handleDelete(role)}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                      Hapus
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit Role */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-base font-bold text-slate-900 mb-4">
              {editingRole ? 'Edit Peran RBAC' : 'Buat Peran Baru'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kode / Identifier Peran</label>
                <input
                  type="text"
                  required
                  disabled={editingRole?.isSystem}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: auditor_fakultas"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Tampilan Label</label>
                <input
                  type="text"
                  required
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Contoh: Auditor Mutu Fakultas"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi & Cakupan Tugas</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Jelaskan batas wewenang pengguna yang memegang peran ini..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-semibold shadow-xs cursor-pointer"
                >
                  Simpan Peran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cakupan peran per aplikasi — sumber: GET /api/auth/app-roles */}
      <CardContainer
        title="Cakupan Peran per Aplikasi"
        subtitle="Peran administrator hanya berlaku pada aplikasi pemiliknya. Server menolak peran di kolom kanan bila ditugaskan ke pengguna LPM."
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700">
            <LockClosedIcon className="w-3.5 h-3.5" />
            App-scoped
          </span>
        }
      >
        {scopeLoading ? (
          <p className="py-8 text-center text-xs font-semibold text-slate-500">
            Memuat cakupan peran dari server...
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-[12px] border border-emerald-200 bg-emerald-50/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheckIcon className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Diizinkan di panel LPM
                </h3>
              </div>
              <ul className="space-y-2">
                {scopeRoles.length === 0 ? (
                  <li className="text-[11px] text-slate-600">
                    Belum ada data peran dari server.
                  </li>
                ) : (
                  scopeRoles.map((role) => {
                    const isCurrent = currentUser?.ssoRole === role.code;
                    return (
                      <li
                        key={role.code}
                        className="flex items-start justify-between gap-2 rounded-[10px] bg-white border border-emerald-200/70 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-slate-900 truncate">
                            {role.label}
                          </p>
                          <code className="text-[10px] font-mono text-slate-500">{role.code}</code>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {role.isAppAdmin ? 'Admin' : 'Pengguna'}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] font-bold text-blue-900">Peran Anda</span>
                          )}
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>

            <div className="rounded-[12px] border border-rose-200 bg-rose-50/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <LockClosedIcon className="w-4 h-4 text-rose-700" aria-hidden="true" />
                <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                  Ditolak — milik aplikasi lain
                </h3>
              </div>
              <ul className="space-y-2">
                {deniedScopeRoles.length === 0 ? (
                  <li className="text-[11px] text-slate-600">
                    Tidak ada peran aplikasi lain yang terdaftar pada konfigurasi server.
                  </li>
                ) : (
                  deniedScopeRoles.map((role) => (
                    <li
                      key={role.code}
                      className="flex items-start justify-between gap-2 rounded-[10px] bg-white border border-rose-200/70 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-900 truncate">{role.label}</p>
                        <code className="text-[10px] font-mono text-slate-500">{role.code}</code>
                      </div>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex-shrink-0">
                        <BuildingOffice2Icon className="w-3 h-3" aria-hidden="true" />
                        {role.appName}
                      </span>
                    </li>
                  ))
                )}
              </ul>
              <p className="mt-3 text-[10px] text-rose-800 leading-relaxed">
                Akun dengan peran ini menerima <code className="font-mono">403 FOREIGN_APP_ADMIN</code>{' '}
                saat mencoba masuk, dan percobaannya tercatat pada panel Jejak Penolakan Akses.
              </p>
            </div>
          </div>
        )}
      </CardContainer>
    </div>
  );
};
