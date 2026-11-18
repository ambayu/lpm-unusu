import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  UserPlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { ListPageTemplate, ListActionButton } from '../components/ListPageTemplate';
import { ModalAturPeran } from '../components/ModalAturPeran';
import {
  SSO_ROLE_LABEL,
  fetchRbacPengguna,
  fetchRbacPeran,
  updateRbacPengguna,
  deleteRbacPengguna,
  type RbacPeran,
  type RbacPengguna,
} from '../services/api';

export const UsersPage: React.FC = () => {
  const { bisa, pengguna: userSekarang } = useAuth();
  const bolehTambah = bisa('pengguna:create');
  const bolehUbah = bisa('pengguna:update');
  const bolehHapus = bisa('pengguna:delete');

  const location = useLocation();
  const navigate = useNavigate();

  const [users, setUsers] = useState<RbacPengguna[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [opsiPeranKode, setOpsiPeranKode] = useState<RbacPeran[]>([]);
  const [menyimpanPeran, setMenyimpanPeran] = useState(false);
  const [memprosesStatusId, setMemprosesStatusId] = useState<number | null>(null);

  // Modal atur peran
  const [penggunaModal, setPenggunaModal] = useState<RbacPengguna | null>(null);
  const [galatModal, setGalatModal] = useState<string | null>(null);

  // Modal konfirmasi hapus
  const [targetHapus, setTargetHapus] = useState<RbacPengguna | null>(null);
  const [menghapus, setMenghapus] = useState(false);

  // Pesan sukses dari rute form
  const [pesanSukses, setPesanSukses] = useState<string | null>(
    (location.state as { pesan?: string } | null)?.pesan ?? null
  );

  useEffect(() => {
    if (!pesanSukses) return;
    navigate(location.pathname, { replace: true, state: null });
    const jeda = setTimeout(() => setPesanSukses(null), 6000);
    return () => clearTimeout(jeda);
  }, [pesanSukses, location.pathname, navigate]);

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
    void fetchData();
  }, []);

  useEffect(() => {
    let aktif = true;
    fetchRbacPeran()
      .then((res) => {
        if (aktif && res.data?.success) setOpsiPeranKode(res.data.data);
      })
      .catch(() => {});
    return () => {
      aktif = false;
    };
  }, []);

  const isSuperadmin = (u: RbacPengguna) =>
    (u.ssoRole || '').toUpperCase() === 'SUPERADMIN' ||
    u.peran.some((p) => p.toUpperCase() === 'SUPERADMIN') ||
    u.username === 'admin';

  const gantiStatus = async (u: RbacPengguna, statusBaru: string) => {
    if (isSuperadmin(u)) {
      alert('Status akun Super Administrator tidak dapat diubah.');
      return;
    }

    try {
      setMemprosesStatusId(u.id);
      await updateRbacPengguna(u.id, {
        status: statusBaru,
        peran: u.peran,
      });
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, status: statusBaru } : item))
      );
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal memperbarui status akun.');
    } finally {
      setMemprosesStatusId(null);
    }
  };

  const simpanPeran = async (kode: string) => {
    if (!penggunaModal) return;
    setGalatModal(null);
    setMenyimpanPeran(true);
    try {
      await updateRbacPengguna(penggunaModal.id, {
        peran: kode ? [kode] : [],
        status: penggunaModal.status || 'Aktif',
      });
      setPenggunaModal(null);
      await fetchData();
    } catch (err: any) {
      setGalatModal(err?.response?.data?.message || err.message || 'Gagal mengubah peran pengguna.');
    } finally {
      setMenyimpanPeran(false);
    }
  };

  const handleKonfirmasiHapus = async () => {
    if (!targetHapus || menghapus) return;
    try {
      setMenghapus(true);
      await deleteRbacPengguna(targetHapus.id);
      setTargetHapus(null);
      await fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Gagal menghapus pengguna.');
    } finally {
      setMenghapus(false);
    }
  };

  const opsiPeran = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => u.peran.forEach((p) => set.add(p)));
    return Array.from(set).sort();
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter((u) => {
      const matchSearch =
        !q ||
        u.nama.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.email ? u.email.toLowerCase().includes(q) : false);
      const matchRole = !roleFilter || u.peran.includes(roleFilter);
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const columns = [
    {
      key: 'no',
      header: 'NO',
      headerClassName: 'w-12 text-center',
      cellClassName: 'text-center font-mono text-slate-400 text-xs',
      render: (_u: RbacPengguna, index?: number) => (index !== undefined ? index + 1 : '-'),
    },
    {
      key: 'username',
      header: 'NIDN / NIM',
      headerClassName: 'w-40',
      cellClassName: 'font-mono font-semibold text-slate-800',
      render: (u: RbacPengguna) => u.username,
    },
    {
      key: 'nama',
      header: 'Nama Lengkap',
      headerClassName: 'min-w-[200px]',
      cellClassName: 'font-bold text-slate-900',
      render: (u: RbacPengguna) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-lpm-blue-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
            {u.nama ? u.nama.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="truncate">{u.nama}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email SSO',
      headerClassName: 'min-w-[200px]',
      cellClassName: 'text-slate-600 font-mono text-xs',
      render: (u: RbacPengguna) =>
        u.email || (u.username.includes('@') ? u.username : `${u.username.toLowerCase()}@unusu.ac.id`),
    },
    {
      key: 'peran',
      header: 'Peran LPM',
      headerClassName: 'min-w-[180px]',
      render: (u: RbacPengguna) => {
        const isSuper = isSuperadmin(u);
        const label =
          u.peran.length === 0
            ? 'Tanpa peran'
            : u.peran.map((p) => SSO_ROLE_LABEL[p.toUpperCase()] || p).join(', ');

        if (!bolehUbah) {
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] border text-xs font-semibold ${
                isSuper
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <ShieldCheckIcon className="w-3.5 h-3.5 text-lpm-blue-700" />
              <span>{label}</span>
            </span>
          );
        }

        return (
          <button
            type="button"
            onClick={() => {
              setGalatModal(null);
              setPenggunaModal(u);
            }}
            disabled={isSuper}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] rounded-[8px] border text-xs font-semibold transition ${
              isSuper
                ? 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed'
                : 'border-slate-200 bg-white text-slate-900 hover:bg-lpm-blue-50 hover:border-lpm-blue-700 cursor-pointer'
            }`}
            title={isSuper ? 'Peran Superadmin tidak dapat diubah' : 'Atur peran'}
            aria-label={`Atur peran ${u.nama}`}
          >
            <ShieldCheckIcon className="w-3.5 h-3.5 text-lpm-blue-700 flex-shrink-0" />
            <span className="truncate max-w-[150px]">{label}</span>
          </button>
        );
      },
    },
    {
      key: 'status',
      header: 'Status Akun',
      headerClassName: 'w-36 text-center',
      cellClassName: 'text-center',
      render: (u: RbacPengguna) => {
        const isSuper = isSuperadmin(u);
        if (!bolehUbah || isSuper) {
          const aktif = u.status === 'Aktif';
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                aktif
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${aktif ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span>{u.status || 'Aktif'}</span>
            </span>
          );
        }

        return (
          <select
            value={u.status || 'Aktif'}
            disabled={memprosesStatusId === u.id}
            onChange={(e) => gantiStatus(u, e.target.value)}
            className="px-2.5 py-1 min-h-[32px] text-xs font-semibold rounded-[8px] border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-lpm-blue-700/30 cursor-pointer disabled:opacity-60"
            aria-label={`Status akun ${u.nama}`}
          >
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
        );
      },
    },
    {
      key: 'aksi',
      header: 'Aksi',
      headerClassName: 'w-24 text-right',
      cellClassName: 'text-right',
      render: (u: RbacPengguna) => {
        const isSuper = isSuperadmin(u);
        return (
          <div className="inline-flex items-center justify-end gap-1.5">
            {bolehUbah && (
              <Link
                to={`/admin/pengguna/edit/${u.id}`}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-lpm-blue-50 hover:text-lpm-blue-800 transition cursor-pointer"
                title={`Ubah pengguna ${u.nama}`}
              >
                <PencilSquareIcon className="w-4 h-4" />
              </Link>
            )}
            {bolehHapus && !isSuper && u.id !== userSekarang?.id && (
              <button
                type="button"
                onClick={() => setTargetHapus(u)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                title={`Hapus pengguna ${u.nama}`}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <ListPageTemplate<RbacPengguna>
        title="Manajemen Pengguna & Auditor"
        description="Pengguna panel LPM dipilih dari direktori ONE UNUSU dan diatur peran serta status penugasannya secara terpusat."
        actions={
          bolehTambah ? (
            <ListActionButton
              to="/admin/pengguna/tambah"
              icon={<UserPlusIcon className="w-4 h-4" />}
            >
              Pilih Pengguna ONE UNUSU
            </ListActionButton>
          ) : undefined
        }
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari pengguna berdasarkan nama, NIDN, atau email..."
        filters={
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 min-h-[44px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-lpm-blue-700/30"
          >
            <option value="">Semua Peran</option>
            {opsiPeran.map((p) => (
              <option key={p} value={p}>
                {SSO_ROLE_LABEL[p.toUpperCase()] || p}
              </option>
            ))}
          </select>
        }
        tableTitle="Daftar Pengguna & Auditor LPM"
        tableSubtitle={`Total ${filteredUsers.length} pengguna terdaftar`}
        columns={columns}
        rows={filteredUsers}
        rowKey={(u) => u.id}
        loading={loading}
        error={error}
        onRetry={fetchData}
        emptyMessage="Belum ada pengguna panel LPM yang terdaftar."
      />

      {/* Modal Atur Peran */}
      <ModalAturPeran
        terbuka={penggunaModal !== null}
        pengguna={penggunaModal}
        opsiPeran={opsiPeranKode}
        sedangMenyimpan={menyimpanPeran}
        pesanGalat={galatModal}
        onTutup={() => {
          setPenggunaModal(null);
          setGalatModal(null);
        }}
        onSimpan={simpanPeran}
      />

      {/* Modal Konfirmasi Hapus */}
      {targetHapus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-[16px] max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <TrashIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Hapus Akses Pengguna LPM?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus akses panel LPM untuk{' '}
                  <strong className="text-slate-800">{targetHapus.nama}</strong> ({targetHapus.username})? Pengguna ini tidak akan bisa login ke panel LPM lagi.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={menghapus}
                onClick={() => setTargetHapus(null)}
                className="px-4 py-2 text-xs font-semibold rounded-[10px] border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={menghapus}
                onClick={handleKonfirmasiHapus}
                className="px-4 py-2 text-xs font-bold rounded-[10px] bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition disabled:opacity-50"
              >
                {menghapus ? 'Menghapus...' : 'Ya, Hapus Akses'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
