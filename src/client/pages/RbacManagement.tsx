import React, { useState } from 'react';
import { 
  UsersIcon, 
  ShieldCheckIcon, 
  KeyIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface RbacPageProps {
  moduleName: string;
  moduleKey: 'lpm' | 'lppm' | 'esurat' | 'lms';
  type: 'users' | 'roles' | 'permissions';
}

export function RbacManagementPage({ moduleName, moduleKey, type }: RbacPageProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const titles = {
    users: {
      title: 'Pengguna',
      subtitle: `Kelola data pengguna terdaftar dan penetapan peran pada modul ${moduleName}`,
      icon: UsersIcon,
      colHeader: ['Nama Pengguna & Email', 'Peran Modul', 'Status', 'Terakhir Aktif', 'Aksi']
    },
    roles: {
      title: 'Peran',
      subtitle: `Definisikan peran, hak akses, dan level wewenang pengguna pada modul ${moduleName}`,
      icon: ShieldCheckIcon,
      colHeader: ['Nama Peran', 'Kode Modul', 'Total Pengguna', 'Deskripsi Wewenang', 'Aksi']
    },
    permissions: {
      title: 'Izin',
      subtitle: `Daftar matriks perizinan aksi dan fungsionalitas sistem pada modul ${moduleName}`,
      icon: KeyIcon,
      colHeader: ['Nama Izin', 'Aksi (Action)', 'Lingkup Resource', 'Status Guard', 'Aksi']
    }
  };

  const current = titles[type];
  const IconComponent = current.icon;

  // Mock data sesuai modul
  const usersData = [
    { id: '1', name: 'Dr. Ahmad Fauzi, M.Kom', email: 'ahmad.fauzi@unusu.ac.id', role: `Admin ${moduleName}`, status: 'Aktif', lastActive: '10 menit yang lalu' },
    { id: '2', name: 'Siti Nurhaliza, M.Pd', email: 'siti.nurhaliza@unusu.ac.id', role: `Operator ${moduleName}`, status: 'Aktif', lastActive: '1 jam yang lalu' },
    { id: '3', name: 'Hendra Gunawan, S.T', email: 'hendra.gunawan@unusu.ac.id', role: 'Auditor / Reviewer', status: 'Non-Aktif', lastActive: '3 hari yang lalu' }
  ];

  const rolesData = [
    { id: 'r1', name: `Super Admin ${moduleName}`, code: `${moduleKey.toUpperCase()}_SUPERADMIN`, count: 2, desc: 'Akses penuh seluruh konfigurasi, data master, dan verifikasi' },
    { id: 'r2', name: `Operator / Pengelola ${moduleName}`, code: `${moduleKey.toUpperCase()}_OPERATOR`, count: 5, desc: 'Input data operasional, pengajuan berkas, dan monitoring' },
    { id: 'r3', name: `Auditor & Reviewer`, code: `${moduleKey.toUpperCase()}_AUDITOR`, count: 4, desc: 'Akses tinjauan dokumen, evaluasi, dan audit skor capaian' }
  ];

  const permissionsData = [
    { id: 'p1', name: `${moduleKey}:view_dashboard`, action: 'READ', resource: 'Dashboard & Analitik', guard: 'Active' },
    { id: 'p2', name: `${moduleKey}:manage_data`, action: 'WRITE / UPDATE', resource: 'Master Data Modul', guard: 'Active' },
    { id: 'p3', name: `${moduleKey}:approve_submission`, action: 'VERIFY', resource: 'Verifikasi & Audit Dokumen', guard: 'Active' },
    { id: 'p4', name: `${moduleKey}:delete_record`, action: 'DELETE', resource: 'Penghapusan Arsip', guard: 'SuperAdmin Only' }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
              {moduleName}
            </span>
            <span className="text-xs text-slate-400 font-medium">Manajemen Akses (RBAC)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mt-1 flex items-center gap-2">
            <IconComponent className="w-7 h-7 text-emerald-700" />
            {current.title}
          </h1>
          <p className="text-xs text-slate-500 mt-1">{current.subtitle}</p>
        </div>

        <div>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors">
            <PlusIcon className="w-4 h-4" />
            Tambah {current.title}
          </button>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Cari data ${current.title.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-slate-700"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500">Lingkup Modul:</span>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
              {moduleName} RBAC Matrix
            </span>
          </div>
        </div>
      </div>

      {/* Main Card Container Pattern */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">
            Daftar {current.title} — {moduleName}
          </h2>
          <span className="text-xs font-medium text-slate-500">
            Total {type === 'users' ? usersData.length : type === 'roles' ? rolesData.length : permissionsData.length} entitas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                {current.colHeader.map((head, idx) => (
                  <th key={idx} className="px-6 py-3.5">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {type === 'users' && usersData.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{u.name}</div>
                    <div className="text-[11px] text-slate-400">{u.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 font-medium ${u.status === 'Aktif' ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <CheckCircleIcon className="w-3.5 h-3.5" />
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{u.lastActive}</td>
                  <td className="px-6 py-4">
                    <button className="text-emerald-700 hover:text-emerald-900 font-medium mr-3">Ubah</button>
                    <button className="text-rose-600 hover:text-rose-800 font-medium">Reset</button>
                  </td>
                </tr>
              ))}

              {type === 'roles' && rolesData.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{r.name}</td>
                  <td className="px-6 py-4">
                    <code className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                      {r.code}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-medium">{r.count} Pengguna</td>
                  <td className="px-6 py-4 text-slate-500 max-w-xs">{r.desc}</td>
                  <td className="px-6 py-4">
                    <button className="text-emerald-700 hover:text-emerald-900 font-medium mr-3">Ubah Hak</button>
                    <button className="text-slate-500 hover:text-slate-700 font-medium">Salin</button>
                  </td>
                </tr>
              ))}

              {type === 'permissions' && permissionsData.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-emerald-800">{p.name}</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">
                      {p.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{p.resource}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                      <CheckCircleIcon className="w-3.5 h-3.5" />
                      {p.guard}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-emerald-700 hover:text-emerald-900 font-medium">Konfigurasi</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
