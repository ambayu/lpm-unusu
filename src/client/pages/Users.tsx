import React, { useEffect, useState } from 'react';
import {
  UsersIcon,
  UserPlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { CardContainer } from '../components/CardContainer';
import { ErrorState } from '../components/ErrorState';
import { LPM_APP_ROLES, SSO_ROLE_LABEL, FOREIGN_APP_ROLES, fetchAppRoles } from '../services/api';

interface UserItem {
  id: number;
  username: string;
  nama: string;
  email: string | null;
  role: string;
  ssoRole: string;
  fakultas: string | null;
  prodi: string | null;
  status: string;
  createdAt: string;
}

export const UsersPage: React.FC = () => {
  const { user: currentUser, isAppAdmin } = useAuth();
  const isAdmin = isAppAdmin || currentUser?.ssoRole === 'SUPERADMIN' || currentUser?.ssoRole === 'ADMIN_LPM';
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  // Peran sah versi server (`GET /api/auth/app-roles`). Fallback ke konstanta
  // lokal agar dropdown tetap berfungsi bila endpoint tidak tersedia.
  const [roleOptions, setRoleOptions] = useState<{ code: string; label: string }[]>(
    LPM_APP_ROLES.map((code) => ({ code, label: SSO_ROLE_LABEL[code] || code }))
  );
  const [deniedRoleLabels, setDeniedRoleLabels] = useState<string[]>(
    FOREIGN_APP_ROLES.map((code) => SSO_ROLE_LABEL[code] || code)
  );
  const [rolesFromServer, setRolesFromServer] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    nama: '',
    email: '',
    role: 'dosen',
    ssoRole: 'DOSEN',
    fakultas: '',
    prodi: '',
    status: 'Aktif',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('lpm_unusu_token') || localStorage.getItem('lpm_token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const [usersRes, rolesRes] = await Promise.all([
        fetch('/api/users', { credentials: 'include', headers }),
        fetch('/api/roles', { credentials: 'include', headers }),
      ]);

      if (usersRes.ok) {
        const uJson = await usersRes.json();
        if (uJson.success) setUsers(uJson.data);
      } else {
        throw new Error('Gagal memuat daftar pengguna.');
      }
      if (rolesRes.ok) {
        const rJson = await rolesRes.json();
        if (rJson.success) setRoles(rJson.data);
      }
    } catch (err: any) {
      console.error('Gagal mengambil data pengguna', err);
      setError(err.message || 'Terjadi kesalahan saat memuat data pengguna.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Ambil cakupan peran dari server agar dropdown tidak pernah menawarkan peran
  // aplikasi lain (satu sumber kebenaran dengan guard `resolveAppAccess`).
  useEffect(() => {
    let active = true;

    fetchAppRoles()
      .then((res) => {
        if (!active || !res.data?.success) return;
        const allowed = res.data.data ?? [];
        const denied = res.data.deniedRoles ?? [];

        if (allowed.length > 0) {
          setRoleOptions(allowed.map((item) => ({ code: item.code, label: item.label })));
          setRolesFromServer(true);
        }
        if (denied.length > 0) {
          setDeniedRoleLabels(denied.map((item) => item.label));
        }
      })
      .catch(() => {
        /* fallback konstanta lokal sudah terpasang pada state awal */
      });

    return () => {
      active = false;
    };
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      nama: '',
      email: '',
      role: 'dosen',
      ssoRole: 'DOSEN',
      fakultas: 'Fakultas Sains dan Teknologi',
      prodi: 'Sistem Informasi',
      status: 'Aktif',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: UserItem) => {
    setEditingUser(item);
    setFormData({
      username: item.username,
      nama: item.nama,
      email: item.email || '',
      role: item.role,
      ssoRole: item.ssoRole || 'DOSEN',
      fakultas: item.fakultas || '',
      prodi: item.prodi || '',
      status: item.status || 'Aktif',
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

      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.message || 'Gagal menyimpan pengguna');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Yakin ingin menghapus akses pengguna ini dari LPM?')) return;
    try {
      const token = localStorage.getItem('lpm_unusu_token') || localStorage.getItem('lpm_token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert(err.message || 'Gagal menghapus pengguna');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.nama.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase()));
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <CardContainer>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-[10px] bg-blue-50 text-blue-800 flex items-center justify-center">
                <UsersIcon className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Manajemen Pengguna & Auditor</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Daftar pengguna dengan hak akses terhadap audit, dokumen mutu, dan standar SPMI UNUSU.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition shadow-xs cursor-pointer"
            >
              <UserPlusIcon className="w-4 h-4" />
              Tambah Pengguna
            </button>
          )}
        </div>
      </CardContainer>

      {/* Filter & Search Bar */}
      <CardContainer>
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari nama, NIDN/NIM, atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <label className="text-xs font-semibold text-slate-500">Filter Peran:</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-slate-200 rounded-xl text-xs px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-800 bg-white"
            >
              <option value="">Semua Peran</option>
              <option value="admin">Admin LPM</option>
              <option value="dosen">Dosen / Auditor</option>
              <option value="mahasiswa">Mahasiswa</option>
            </select>
          </div>
        </div>
      </CardContainer>

      {/* Table Card */}
      {error ? (
        <ErrorState description={error} onRetry={fetchData} />
      ) : (
        <CardContainer title="Daftar Pengguna Aktif & Hak Akses">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Memuat data pengguna...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">Belum ada data pengguna yang sesuai kriteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Pengguna</th>
                    <th className="py-3 px-4 font-semibold">Peran Sistem</th>
                    <th className="py-3 px-4 font-semibold">Fakultas / Prodi</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{u.nama}</div>
                        <div className="text-[11px] text-slate-400">
                          {u.username} • {u.email || 'tanpa email'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            u.ssoRole === 'SUPERADMIN' || u.ssoRole === 'ADMIN_LPM'
                              ? 'bg-blue-50 text-blue-900 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          }`}
                        >
                          <ShieldCheckIcon className="w-3.5 h-3.5" />
                          {SSO_ROLE_LABEL[u.ssoRole] || (u.role === 'admin' ? 'Admin SPMI' : 'Auditor Mutu')}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">{u.ssoRole || '—'}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{u.fakultas || '-'}</div>
                        <div className="text-[11px] text-slate-400">{u.prodi || '-'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <CheckBadgeIcon className="w-3.5 h-3.5" />
                          {u.status || 'Aktif'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isAdmin ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditModal(u)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-900 hover:bg-blue-50 transition cursor-pointer"
                              title="Edit Pengguna"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Hapus Pengguna"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium italic">Hanya Baca</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContainer>
      )}

      {/* Modal Add / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-base font-bold text-slate-900 mb-4">
              {editingUser ? 'Edit Pengguna LPM' : 'Tambah Pengguna Baru'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username / NIDN / NIM</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Contoh: 0102030405"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Dr. H. Ahmad Farhan, M.Kom."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Institusi</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Contoh: dosen@unusu.ac.id"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Peran SSO (Cakupan LPM)</label>
                  <select
                    value={formData.ssoRole}
                    onChange={(e) => {
                      const ssoRole = e.target.value;
                      setFormData({
                        ...formData,
                        ssoRole,
                        role: ssoRole === 'DOSEN' ? 'dosen' : 'admin',
                      });
                    }}
                    className="w-full px-3 py-2 min-h-[44px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800 bg-white"
                  >
                    {roleOptions.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Akun</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 min-h-[44px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800 bg-white"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  <strong>Pemisahan admin per aplikasi.</strong> Panel LPM hanya menerima peran
                  Administrator LPM, Superadmin, dan Dosen/Auditor. Peran admin aplikasi lain
                  ({deniedRoleLabels.join(', ')}) ditolak server bila ditugaskan di sini.
                </p>
                <p className="text-[10px] text-amber-800/80 mt-1.5">
                  {rolesFromServer
                    ? 'Daftar peran tersinkron dengan /api/auth/app-roles.'
                    : 'Daftar peran memakai konstanta lokal (endpoint peran belum merespons).'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fakultas</label>
                  <input
                    type="text"
                    value={formData.fakultas}
                    onChange={(e) => setFormData({ ...formData, fakultas: e.target.value })}
                    placeholder="Fakultas Sains dan Teknologi"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Program Studi</label>
                  <input
                    type="text"
                    value={formData.prodi}
                    onChange={(e) => setFormData({ ...formData, prodi: e.target.value })}
                    placeholder="Sistem Informasi"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>
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
                  {editingUser ? 'Simpan Perubahan' : 'Buat Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
