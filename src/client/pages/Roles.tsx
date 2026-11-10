import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheckIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  KeyIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { CardContainer } from '../components/CardContainer';
import { ErrorState } from '../components/ErrorState';
import {
  fetchRbacPeran,
  deleteRbacPeran,
  type RbacPeran,
} from '../services/api';

export const RolesPage: React.FC = () => {
  // Semua aksi ditentukan IZIN, bukan nama peran.
  const { bisa } = useAuth();
  const bolehTambah = bisa('peran:create');
  const bolehUbah = bisa('peran:update');
  const bolehHapus = bisa('peran:delete');

  const [roles, setRoles] = useState<RbacPeran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchRbacPeran();
      if (res.data?.success) setRoles(res.data.data);
    } catch (err: any) {
      console.error('Gagal mengambil data peran', err);
      setError(
        err?.response?.data?.message || err.message || 'Terjadi kesalahan saat memuat data peran.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleDelete = async (role: RbacPeran) => {
    if (role.isSystem) {
      alert('Peran sistem bawaan tidak dapat dihapus.');
      return;
    }
    if (!window.confirm(`Yakin ingin menghapus peran "${role.label}"?`)) return;

    try {
      await deleteRbacPeran(role.kode || role.id);
      fetchRoles();
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Gagal menghapus peran');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <CardContainer>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-[10px] bg-lpm-yellow-400 text-lpm-blue-900 flex items-center justify-center">
                <ShieldCheckIcon className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Manajemen Peran (Roles)</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Pengelompokan wewenang berbasis peran. Izin pengguna diturunkan dari peran yang dipilih.
            </p>
          </div>
          {bolehTambah && (
            <Link
              to="/admin/peran/tambah"
              className="inline-flex items-center gap-2 bg-lpm-blue-900 hover:bg-lpm-blue-800 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition shadow-xs cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
              Tambah Peran Baru
            </Link>
          )}
        </div>
      </CardContainer>

      {/* Grid of Roles */}
      {error ? (
        <ErrorState description={error} onRetry={fetchRoles} />
      ) : loading ? (
        <CardContainer>
          <div className="p-12 text-center text-xs text-slate-500">Memuat daftar peran...</div>
        </CardContainer>
      ) : roles.length === 0 ? (
        <CardContainer>
          <div className="p-12 text-center text-xs text-slate-400">
            Belum ada peran. Jalankan seeder RBAC lalu muat ulang halaman.
          </div>
        </CardContainer>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((role) => (
            <div
              key={role.kode}
              className="bg-white rounded-[14px] border border-[#CBD5E1] p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-[10px] bg-lpm-blue-50 text-lpm-blue-900 flex items-center justify-center font-bold">
                      <ShieldCheckIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">{role.nama || role.label}</h2>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {role.kode}
                      </span>
                    </div>
                  </div>
                  {role.isSystem && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-lpm-yellow-400 text-lpm-blue-900 border border-lpm-yellow-400">
                      Sistem
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                  {role.deskripsi || role.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <span className="text-slate-400 text-[10px] block">Cakupan Izin</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <KeyIcon className="w-3.5 h-3.5 text-lpm-blue-700" />
                      {role.permissionsCount} Izin
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <span className="text-slate-400 text-[10px] block">Total Anggota</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <CheckCircleIcon className="w-3.5 h-3.5 text-lpm-blue-700" />
                      {role.usersCount} Pengguna
                    </span>
                  </div>
                </div>
              </div>

              {(bolehUbah || bolehHapus) && (
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  {bolehUbah && (
                    <Link
                      to={`/admin/peran/edit/${role.kode}`}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <PencilSquareIcon className="w-3.5 h-3.5" />
                      Edit
                    </Link>
                  )}
                  {bolehHapus && !role.isSystem && (
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
    </div>
  );
};
