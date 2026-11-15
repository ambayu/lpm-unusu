import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { DataTable } from '../components/DataTable';
import { ErrorState } from '../components/ErrorState';
import {
  SSO_ROLE_LABEL,
  fetchRbacPengguna,
  deleteRbacPengguna,
  type RbacPengguna,
} from '../services/api';

export const UsersPage: React.FC = () => {
  // Tombol & aksi ditentukan oleh IZIN, bukan nama peran.
  const { bisa } = useAuth();
  const bolehTambah = bisa('pengguna:create');
  const bolehUbah = bisa('pengguna:update');
  const bolehHapus = bisa('pengguna:delete');

  const [users, setUsers] = useState<RbacPengguna[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchRbacPengguna();
      if (res.data?.success) setUsers(res.data.data);
    } catch (err: any) {
      console.error('Gagal mengambil data pengguna', err);
      setError(
        err?.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat memuat data pengguna.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Yakin ingin menghapus akses pengguna ini dari LPM?')) return;
    try {
      await deleteRbacPengguna(id);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Terjadi kesalahan sistem');
    }
  };

  /** Daftar peran unik untuk dropdown filter (diambil dari data pengguna). */
  const opsiPeran = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => u.peran.forEach((p) => set.add(p)));
    return Array.from(set).sort();
  }, [users]);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      u.nama.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.email ? u.email.toLowerCase().includes(q) : false);
    const matchRole = !roleFilter || u.peran.includes(roleFilter);
    return matchSearch && matchRole;
  });

  const adaAksi = bolehUbah || bolehHapus;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <CardContainer>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-[10px] bg-lpm-blue-50 text-lpm-blue-800 flex items-center justify-center">
                <UsersIcon className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Manajemen Pengguna & Auditor</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Daftar pengguna dengan hak akses terhadap audit, dokumen mutu, dan standar SPMI UNUSU.
            </p>
          </div>
          {bolehTambah && (
            <Link
              to="/admin/pengguna/tambah"
              className="inline-flex items-center gap-2 bg-lpm-blue-900 hover:bg-lpm-blue-800 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition shadow-xs cursor-pointer"
            >
              <UserPlusIcon className="w-4 h-4" />
              Tambah Pengguna
            </Link>
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
              placeholder="Cari nama, username, atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-lpm-blue-800 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <label className="text-xs font-semibold text-slate-500">Filter Peran:</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-slate-200 rounded-xl text-xs px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lpm-blue-800 bg-white"
            >
              <option value="">Semua Peran</option>
              {opsiPeran.map((p) => (
                <option key={p} value={p}>
                  {SSO_ROLE_LABEL[p.toUpperCase()] || p}
                </option>
              ))}
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
            <div className="p-12 text-center text-xs text-slate-500" role="status">
              Memuat data pengguna...
            </div>
          ) : (
            <DataTable
              minTableWidth="min-w-[1100px]"
              rows={filteredUsers}
              rowKey={(u) => u.id}
              emptyMessage="Belum ada data pengguna yang sesuai kriteria."
              columns={[
                {
                  key: 'username',
                  header: 'NIDN / NIM',
                  headerClassName: 'w-40',
                  cellClassName: 'font-mono font-semibold text-slate-800',
                  render: (u) => u.username,
                },
                {
                  key: 'nama',
                  header: 'Nama Lengkap',
                  headerClassName: 'min-w-[200px]',
                  cellClassName: 'font-bold text-slate-900',
                  render: (u) => u.nama,
                },
                {
                  key: 'email',
                  header: 'Email',
                  headerClassName: 'min-w-[220px]',
                  cellClassName: 'text-slate-600 font-mono',
                  render: (u) =>
                    u.email || (u.username.includes('@') ? u.username : `${u.username.toLowerCase()}@unusu.ac.id`),
                },
                {
                  key: 'status',
                  header: 'Status Akun',
                  headerClassName: 'w-36',
                  render: (u) => (
                    <span
                      className={`inline-flex items-center gap-1 font-semibold px-2.5 py-1 rounded-full border ${
                        u.status === 'Aktif'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      <CheckBadgeIcon className="w-3.5 h-3.5" aria-hidden="true" />
                      {u.status || 'Aktif'}
                    </span>
                  ),
                },
                {
                  key: 'peran',
                  header: 'Role Terkait',
                  render: (u) =>
                    u.peran.length === 0 ? (
                      '-'
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {u.peran.map((p) => (
                          <span
                            key={p}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold bg-lpm-blue-50 text-lpm-blue-900 border border-lpm-blue-200"
                          >
                            <ShieldCheckIcon className="w-3.5 h-3.5" aria-hidden="true" />
                            {SSO_ROLE_LABEL[p.toUpperCase()] || p}
                          </span>
                        ))}
                      </div>
                    ),
                },
                ...(adaAksi
                  ? [
                      {
                        key: 'aksi',
                        header: 'Aksi',
                        headerClassName: 'w-28 text-center',
                        cellClassName: 'text-center',
                        render: (u: (typeof filteredUsers)[number]) => {
                          const isSuper =
                            u.ssoRole === 'SUPERADMIN' ||
                            u.peran.includes('SUPERADMIN') ||
                            u.username === 'admin';
                          return (
                            <div className="inline-flex items-center justify-center gap-2">
                              {bolehUbah && (
                                <Link
                                  to={`/admin/pengguna/edit/${u.id}`}
                                  className="inline-flex items-center justify-center w-9 h-9 rounded-[8px] border border-slate-200 text-slate-600 hover:text-lpm-blue-900 hover:bg-lpm-blue-50 transition cursor-pointer"
                                  title="Edit Pengguna"
                                  aria-label={`Edit ${u.nama}`}
                                >
                                  <PencilSquareIcon className="w-4 h-4" />
                                </Link>
                              )}
                              {bolehHapus && !isSuper && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(u.id)}
                                  className="inline-flex items-center justify-center w-9 h-9 rounded-[8px] border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                  title="Hapus Pengguna"
                                  aria-label={`Hapus ${u.nama}`}
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          );
                        },
                      },
                    ]
                  : []),
              ]}
            />
          )}
        </CardContainer>
      )}
    </div>
  );
};
