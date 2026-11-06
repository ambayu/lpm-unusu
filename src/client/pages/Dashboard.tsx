import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  UsersIcon,
  ShieldCheckIcon,
  KeyIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  DocumentArrowUpIcon,
  DocumentCheckIcon,
  LockClosedIcon,
  ClipboardDocumentListIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { CardContainer } from '../components/CardContainer';
import {
  ReportCard,
  DonutChart,
  BarChart,
  StackedBar,
  GaugeRing,
  type IconComponent,
} from '../components/LaporanCharts';
import { useAuth } from '../context/AuthContext';
import {
  fetchDashboardStats,
  type AuditItem,
  type DashboardStats,
  type DokumenMutuItem,
  type StandarItem,
} from '../services/api';

/* -------------------------------------------------------------------------- */
/* Utilitas tampilan                                                           */
/* -------------------------------------------------------------------------- */

const EMPTY_STATS: DashboardStats = {
  totalStandar: 0,
  totalDokumen: 0,
  totalAudit: 0,
  totalUsers: 0,
  totalRoles: 0,
  totalPermissions: 0,
  auditMayor: 0,
  auditMinor: 0,
  auditSesuai: 0,
  indikatorTotal: 0,
  indikatorTercapai: 0,
  tindakLanjutTerbuka: 0,
  indikatorStatus: [],
  tindakLanjutStatus: [],
};

const formatTanggal = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Normalisasi label hasil audit (data bisa tersimpan "KTS_MAYOR" atau "Temuan Mayor"). */
const hasilLabel = (hasil?: string | null) => {
  const key = (hasil || '').toUpperCase().replace(/[\s-]+/g, '_');
  const map: Record<string, string> = {
    SESUAI: 'Sesuai',
    OBSERVASI: 'Observasi',
    KTS_MINOR: 'Temuan Minor',
    TEMUAN_MINOR: 'Temuan Minor',
    KTS_MAYOR: 'Temuan Mayor',
    TEMUAN_MAYOR: 'Temuan Mayor',
    TERLAMPAUI: 'Terlampaui',
  };
  return map[key] || hasil || 'Belum Dinilai';
};

const hasilBadgeClass = (hasil?: string | null) => {
  const label = hasilLabel(hasil);
  if (label === 'Sesuai') return 'bg-lpm-blue-50 text-lpm-blue-800 border-lpm-blue-200';
  if (label === 'Terlampaui') return 'bg-lpm-blue-50 text-lpm-blue-900 border-lpm-blue-200';
  if (label === 'Temuan Mayor') return 'bg-rose-50 text-rose-800 border-rose-200';
  if (label === 'Temuan Minor') return 'bg-lpm-yellow-400 text-lpm-blue-900 border-lpm-yellow-400';
  return 'bg-slate-50 text-slate-700 border-slate-200';
};

/** Sapaan dinamis mengikuti jam perangkat pengguna. */
const salamWaktu = () => {
  const jam = new Date().getHours();
  if (jam < 11) return 'Selamat pagi';
  if (jam < 15) return 'Selamat siang';
  if (jam < 19) return 'Selamat sore';
  return 'Selamat malam';
};

/* -------------------------------------------------------------------------- */
/* Kartu metrik                                                                */
/* -------------------------------------------------------------------------- */

interface MetricCardProps {
  label: string;
  value: number;
  hint: string;
  icon: IconComponent;
  accent: string;
  to: string;
  linkLabel: string;
  linkClass: string;
  valueClass?: string;
}

/**
 * Kartu metrik baku dashboard: label uppercase + ikon kotak warna lembut,
 * angka besar, subteks kecil, lalu footer tautan "Daftar →" ke modul terkait.
 */
const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  to,
  linkLabel,
  linkClass,
  valueClass = 'text-slate-900',
}) => (
  <div className="bg-white border border-[#CBD5E1] rounded-[14px] p-5 shadow-xs hover:border-lpm-blue-400 transition-all flex flex-col justify-between">
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="w-4 h-4" aria-hidden="true" />
      </div>
    </div>
    <div className="mt-3">
      <div className={`text-3xl font-black tabular-nums leading-none ${valueClass}`}>{value}</div>
      <p className="text-[11px] text-slate-400 mt-1 truncate">{hint}</p>
    </div>
    <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs font-bold">
      <Link
        to={to}
        className={`min-h-[44px] inline-flex items-center gap-1 hover:underline ${linkClass}`}
      >
        {linkLabel} <ArrowRightIcon className="w-3 h-3" aria-hidden="true" />
      </Link>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/* Halaman dashboard                                                           */
/* -------------------------------------------------------------------------- */

export const DashboardPage: React.FC = () => {
  const { user, roleLabel } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAudits, setRecentAudits] = useState<AuditItem[]>([]);
  const [recentStandar, setRecentStandar] = useState<StandarItem[]>([]);
  const [recentDokumen, setRecentDokumen] = useState<DokumenMutuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Satu jalur muat data untuk pemuatan awal, tombol "Segarkan", dan
   * tombol "Coba lagi" pada keadaan galat. `finally` memastikan spinner
   * tidak pernah tertinggal aktif saat permintaan gagal.
   */
  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);

    fetchDashboardStats()
      .then((res) => {
        if (!res.data?.success || !res.data.data) {
          setError('Server tidak mengirimkan ringkasan statistik LPM.');
          return;
        }
        const payload = res.data.data;
        setStats({ ...EMPTY_STATS, ...payload.stats });
        setRecentAudits(payload.recentAudits || []);
        setRecentStandar(payload.recentStandar || []);
        setRecentDokumen(payload.recentDokumen || []);
      })
      .catch((err) => {
        setError(
          err?.response?.data?.message ||
            'Terjadi kesalahan jaringan saat memuat statistik penjaminan mutu.'
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const data = stats ?? EMPTY_STATS;
  const namaDepan = user?.nama?.trim().split(' ')[0] || 'Pengguna';
  const persenIndikator =
    data.indikatorTotal > 0 ? Math.round((data.indikatorTercapai / data.indikatorTotal) * 100) : 0;

  /** Proporsi ketercapaian indikator per status (data nyata dari server). */
  const indikatorChart = data.indikatorStatus
    .map((row) => {
      const status = row.status || 'Belum Dinilai';
      const color =
        status === 'Melebihi Target'
          ? '#1D4ED8'
          : status === 'Tercapai'
          ? '#059669'
          : status === 'Belum Tercapai'
          ? '#D97706'
          : '#94A3B8';
      return { label: status, value: row.jumlah, color };
    })
    .filter((row) => row.value > 0);

  /** Komposisi status tindak lanjut (RTL). */
  const tindakLanjutChart = data.tindakLanjutStatus
    .map((row) => {
      const status = row.status || 'Terbuka';
      const color =
        status === 'Selesai'
          ? '#059669'
          : status === 'Dikerjakan'
          ? '#2563EB'
          : status === 'Dibatalkan'
          ? '#94A3B8'
          : '#D97706';
      return { label: status, value: row.jumlah, color };
    })
    .filter((row) => row.value > 0);

  return (
    <div className="space-y-6">
      {/* 1. BANNER SAMBUTAN */}
      <section
        aria-label="Sambutan panel LPM UNUSU"
        className="relative overflow-hidden rounded-[16px] border border-lpm-blue-dark bg-lpm-blue text-white"
      >
        <div className="px-5 py-6 sm:px-7 sm:py-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-lpm-yellow-400">
                <ShieldCheckIcon className="w-3.5 h-3.5" aria-hidden="true" />
                Portal Penjaminan Mutu Internal
              </span>
              <h1 className="mt-2.5 text-xl sm:text-2xl font-bold leading-snug">
                {salamWaktu()}, {namaDepan}
              </h1>
              <p className="mt-1.5 max-w-xl text-xs sm:text-sm text-white/80 leading-relaxed">
                Pusat kendali Siklus PPEPP LPM UNUSU. Pantau pangkalan Standar SPMI, arsip Dokumen
                Mutu, dan hasil Audit Mutu Internal (AMI) beserta tindak lanjutnya dalam satu tempat.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-white/10 border border-white/20 text-[11px] font-semibold text-white">
                  <LockClosedIcon className="w-3.5 h-3.5 text-lpm-yellow-400" aria-hidden="true" />
                  {roleLabel}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-white/10 border border-white/20 text-[11px] font-semibold text-white">
                  Cakupan akses: Panel LPM UNUSU
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link
                to="/admin/standar/tambah"
                className="min-h-[44px] inline-flex items-center gap-1.5 rounded-[8px] bg-white px-3.5 text-xs font-bold text-lpm-blue-900 hover:bg-lpm-blue-50 transition-colors"
              >
                <AcademicCapIcon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Tambah Standar SPMI</span>
              </Link>
              <Link
                to="/admin/ami/tambah"
                className="min-h-[44px] inline-flex items-center gap-1.5 rounded-[8px] bg-lpm-yellow-400 px-3.5 text-xs font-bold text-slate-950 hover:bg-lpm-yellow-400 transition-colors"
              >
                <ClipboardDocumentCheckIcon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Catat Temuan AMI</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. KARTU RINGKASAN */}
      <div className="w-full min-w-0 bg-white border border-[#CBD5E1] rounded-[16px] shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                Ringkasan Mutu LPM UNUSU
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-lpm-blue-50 border border-lpm-blue-200 text-[11px] font-bold text-lpm-blue-900">
                <Squares2X2Icon className="w-3.5 h-3.5" aria-hidden="true" />
                Siklus PPEPP
              </span>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
              Rekap Standar SPMI, Dokumen Mutu, temuan AMI, dan tata kelola akses panel LPM UNUSU.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              aria-label="Segarkan data statistik LPM"
              title="Muat ulang data"
              className="inline-flex items-center px-3.5 py-2.5 rounded-[12px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-lpm-blue-700 disabled:opacity-60 cursor-pointer"
            >
              <ArrowPathIcon
                className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>Segarkan</span>
            </button>
            <Link
              to="/admin/standar"
              aria-label="Buka pangkalan Standar SPMI"
              className="inline-flex items-center px-4 py-2.5 rounded-[12px] bg-lpm-blue-900 hover:bg-lpm-blue-950 text-white font-bold text-xs shadow-xs transition min-h-[44px] focus:outline-none focus:ring-2 focus:ring-lpm-blue-700"
            >
              <AcademicCapIcon className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
              <span>Standar SPMI</span>
            </Link>
          </div>
        </div>
        <div className="px-5 sm:px-6 py-4 border-t border-[#CBD5E1]">
          <p className="text-xs text-slate-600 leading-relaxed">
            Seluruh angka di bawah dihitung langsung dari basis data penjaminan mutu (Standar SPMI,
            Dokumen Mutu, Indikator, Audit Butir, dan Tindak Lanjut). Bila data modul lain baru
            berubah, gunakan tombol <span className="font-semibold text-slate-800">Segarkan</span>{' '}
            untuk mengambil kondisi terbaru.
          </p>
        </div>
      </div>

      {/* 3. ERROR STATE */}
      {error && (
        <CardContainer>
          <ErrorState
            title="Gagal Memuat Ringkasan Mutu"
            description={error}
            onRetry={loadData}
          />
        </CardContainer>
      )}

      {/* 4. SKELETON LOADING */}
      {loading && !stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white border border-[#CBD5E1] rounded-[14px] p-5 h-32 animate-pulse bg-slate-100"
            />
          ))}
        </div>
      )}

      {/* 5. KARTU METRIK + LAPORAN */}
      {stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Standar SPMI"
              value={data.totalStandar}
              hint={`${data.indikatorTotal} indikator mutu terdaftar`}
              icon={AcademicCapIcon}
              accent="bg-lpm-blue-50 text-lpm-blue-700"
              to="/admin/standar"
              linkLabel="Daftar"
              linkClass="text-lpm-blue-700 hover:text-lpm-blue-900"
            />
            <MetricCard
              label="Dokumen Mutu"
              value={data.totalDokumen}
              hint="Kebijakan, manual, standar & SOP"
              icon={BookOpenIcon}
              accent="bg-lpm-yellow-400 text-lpm-blue-900"
              to="/admin/dokumen"
              linkLabel="Daftar"
              linkClass="text-lpm-yellow-400 hover:text-lpm-yellow-400"
            />
            <MetricCard
              label="Butir Audit AMI"
              value={data.totalAudit}
              hint={`${data.auditMayor} mayor · ${data.auditMinor} minor · ${data.auditSesuai} sesuai`}
              icon={ClipboardDocumentCheckIcon}
              accent="bg-lpm-blue-700 text-lpm-blue-700"
              to="/admin/ami"
              linkLabel="Daftar"
              linkClass="text-lpm-blue-700 hover:text-lpm-blue-700"
            />
            <MetricCard
              label="RTL Terbuka"
              value={data.tindakLanjutTerbuka}
              hint="Temuan belum ditutup (Terbuka/Dikerjakan)"
              icon={ExclamationTriangleIcon}
              accent="bg-rose-50 text-rose-700"
              to="/admin/ami"
              linkLabel="Tindak Lanjut"
              linkClass="text-rose-700 hover:text-rose-900"
              valueClass="text-rose-600"
            />
          </div>

          {/* 6. LAPORAN CHART — 4 ReportCard dalam grid 2 kolom */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* a. Proporsi hasil audit */}
            <ReportCard
              title="Laporan Hasil Audit Mutu"
              subtitle="Sebaran kepatuhan butir standar terhadap temuan AMI"
            >
              {data.totalAudit === 0 ? (
                <EmptyState
                  title="Belum Ada Butir Audit"
                  description="Belum ada butir audit AMI yang tercatat pada sistem."
                />
              ) : (
                <DonutChart
                  data={[
                    { label: 'Sesuai Standar', value: data.auditSesuai, color: '#059669' },
                    { label: 'Temuan Minor', value: data.auditMinor, color: '#D97706' },
                    { label: 'Temuan Mayor', value: data.auditMayor, color: '#E11D48' },
                  ].filter((d) => d.value > 0)}
                  centerLabel="Butir Audit"
                  centerValue={data.totalAudit}
                />
              )}
            </ReportCard>

            {/* b. Beban kerja tindak lanjut */}
            <ReportCard
              title="Laporan Beban Kerja Tindak Lanjut"
              subtitle="Status Rekomendasi Tindak Lanjut (RTL) atas temuan audit"
            >
              {data.tindakLanjutStatus.length === 0 ? (
                <EmptyState
                  title="Belum Ada Tindak Lanjut"
                  description="Belum ada rekomendasi tindak lanjut yang tercatat."
                />
              ) : (
                <div className="space-y-4">
                  <StackedBar data={tindakLanjutChart} />
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <GaugeRing
                      value={data.tindakLanjutTerbuka}
                      total={Math.max(
                        data.tindakLanjutStatus.reduce((sum, row) => sum + row.jumlah, 0),
                        1
                      )}
                      label="Belum Tuntas"
                      color="#E11D48"
                      size={88}
                    />
                    <GaugeRing
                      value={data.tindakLanjutTerbuka}
                      total={Math.max(data.totalAudit, 1)}
                      label="RTL vs Audit"
                      color="#D97706"
                      size={88}
                    />
                    <GaugeRing
                      value={data.auditSesuai + data.auditMinor}
                      total={Math.max(data.totalAudit, 1)}
                      label="Tanpa Mayor"
                      color="#2563EB"
                      size={88}
                    />
                  </div>
                </div>
              )}
            </ReportCard>

            {/* c. Volume per kategori repositori mutu */}
            <ReportCard
              title="Laporan Volume Repositori Mutu"
              subtitle="Perbandingan jumlah standar, dokumen, dan butir audit"
            >
              <BarChart
                data={[
                  { label: 'Standar SPMI', value: data.totalStandar, color: '#1D4ED8' },
                  { label: 'Indikator Mutu', value: data.indikatorTotal, color: '#2563EB' },
                  { label: 'Dokumen Mutu', value: data.totalDokumen, color: '#D97706' },
                  { label: 'Butir Audit AMI', value: data.totalAudit, color: '#7C3AED' },
                  { label: 'Tindak Lanjut', value: data.tindakLanjutStatus.reduce((s, r) => s + r.jumlah, 0), color: '#E11D48' },
                ]}
                unit=" item"
              />
            </ReportCard>

            {/* d. Capaian indikator PPEPP */}
            <ReportCard
              title="Laporan Capaian Indikator PPEPP"
              subtitle="Ketercapaian indikator mutu terhadap target standar SPMI"
            >
              <div className="flex items-center justify-around gap-2 py-2">
                <GaugeRing
                  value={data.indikatorTercapai}
                  total={Math.max(data.indikatorTotal, 1)}
                  label="Indikator Tercapai"
                  color="#059669"
                  size={116}
                />
                <GaugeRing
                  value={Math.max(data.indikatorTotal - data.indikatorTercapai, 0)}
                  total={Math.max(data.indikatorTotal, 1)}
                  label="Belum Tercapai"
                  color="#D97706"
                  size={116}
                />
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Indikator
                  </dt>
                  <dd className="text-base font-bold text-slate-900 tabular-nums">
                    {data.indikatorTotal}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Tercapai
                  </dt>
                  <dd className="text-base font-bold text-lpm-blue-700 tabular-nums">
                    {data.indikatorTercapai}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Persentase
                  </dt>
                  <dd className="text-base font-bold text-lpm-blue-900 tabular-nums">
                    {persenIndikator}%
                  </dd>
                </div>
              </dl>
              {indikatorChart.length > 0 && (
                <div className="mt-3">
                  <StackedBar data={indikatorChart} height={10} />
                </div>
              )}
            </ReportCard>
          </div>

          {/* 7. DAFTAR TERBARU — 2 kartu samping-samping */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CardContainer
              title="Temuan Audit Terbaru"
              subtitle="5 butir evaluasi AMI terakhir yang dilaporkan auditor"
              badge={<ClipboardDocumentCheckIcon className="w-4 h-4 text-lpm-blue-900" />}
              actions={
                <Link
                  to="/admin/ami"
                  className="text-xs font-bold text-lpm-blue-900 hover:text-lpm-blue-950 min-h-[44px] inline-flex items-center"
                >
                  Lihat Semua
                </Link>
              }
            >
              {recentAudits.length === 0 ? (
                <EmptyState
                  title="Belum Ada Temuan Audit"
                  description="Belum ada butir audit AMI yang tercatat dalam sistem."
                />
              ) : (
                <div className="space-y-3">
                  {recentAudits.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-lpm-blue-200 transition-colors bg-slate-50/50 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {item.standar?.kode || `STD-#${item.standarId}`}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-200/60 px-2 py-0.5 rounded">
                            {item.periode?.nama || 'Periode AMI'}
                          </span>
                        </div>
                        <h4
                          className="text-xs font-bold text-slate-900 mt-1 truncate"
                          title={item.standar?.nama || item.deskripsi || undefined}
                        >
                          {item.standar?.nama || 'Butir Standar SPMI'}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          Auditee: <span className="font-medium text-slate-700">{item.auditee}</span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${hasilBadgeClass(item.hasil)}`}
                        >
                          {hasilLabel(item.hasil)}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" aria-hidden="true" />
                          {formatTanggal(item.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContainer>

            <CardContainer
              title="Dokumen Mutu Terbaru"
              subtitle="5 arsip kebijakan, manual, standar, dan SOP terakhir"
              badge={<BookOpenIcon className="w-4 h-4 text-lpm-yellow-400" />}
              actions={
                <Link
                  to="/admin/dokumen"
                  className="text-xs font-bold text-lpm-yellow-400 hover:text-lpm-yellow-400 min-h-[44px] inline-flex items-center"
                >
                  Lihat Semua
                </Link>
              }
            >
              {recentDokumen.length === 0 ? (
                <EmptyState
                  title="Belum Ada Dokumen Mutu"
                  description="Belum ada dokumen kebijakan, manual, atau SOP yang diunggah."
                />
              ) : (
                <div className="space-y-3">
                  {recentDokumen.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-lpm-yellow-400 transition-colors bg-slate-50/50 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {item.kodeDokumen}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-lpm-blue-900 bg-lpm-yellow-400 border border-lpm-yellow-400 px-2 py-0.5 rounded">
                            {item.jenis}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mt-1 truncate" title={item.judul}>
                          {item.judul}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          Standar:{' '}
                          <span className="font-medium text-slate-700">
                            {item.standar?.kode || 'Umum'}
                          </span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <DocumentCheckIcon className="w-3 h-3" aria-hidden="true" />
                          Revisi {item.revisi}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" aria-hidden="true" />
                          {formatTanggal(item.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContainer>
          </div>

          {/* Catatan standar terbaru — pelengkap jejak penetapan standar */}
          {recentStandar.length > 0 && (
            <CardContainer
              title="Standar SPMI Terbaru"
              subtitle="5 butir standar yang terakhir ditetapkan"
              badge={<AcademicCapIcon className="w-4 h-4 text-lpm-blue-900" />}
              actions={
                <Link
                  to="/admin/standar"
                  className="text-xs font-bold text-lpm-blue-900 hover:text-lpm-blue-950 min-h-[44px] inline-flex items-center"
                >
                  Lihat Semua
                </Link>
              }
            >
              <ul className="divide-y divide-slate-100">
                {recentStandar.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.nama}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        <span className="font-mono">{item.kode}</span> · {item.kategori} · {item.tahun}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                      <ClipboardDocumentListIcon className="w-3 h-3" aria-hidden="true" />
                      {formatTanggal(item.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContainer>
          )}

          {/* 8. TATA KELOLA AKSES — pengguna, peran, izin (angka dari server) */}
          <CardContainer
            title="Tata Kelola Akses Panel LPM"
            subtitle="Komposisi pengguna, peran, dan izin yang terdaftar pada sistem"
            badge={<ShieldCheckIcon className="w-4 h-4 text-lpm-blue-900" />}
            actions={
              <Link
                to="/admin/pengguna"
                className="text-xs font-bold text-lpm-blue-900 hover:text-lpm-blue-950 min-h-[44px] inline-flex items-center"
              >
                Kelola Pengguna
              </Link>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 rounded-[12px] border border-slate-200 bg-slate-50/60 p-3.5">
                <div className="w-9 h-9 rounded-xl bg-lpm-blue-50 text-lpm-blue-700 flex items-center justify-center shrink-0">
                  <UsersIcon className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Pengguna
                  </p>
                  <p className="text-xl font-black text-slate-900 tabular-nums">{data.totalUsers}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-[12px] border border-slate-200 bg-slate-50/60 p-3.5">
                <div className="w-9 h-9 rounded-xl bg-lpm-yellow-400 text-lpm-blue-900 flex items-center justify-center shrink-0">
                  <ShieldCheckIcon className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Peran
                  </p>
                  <p className="text-xl font-black text-slate-900 tabular-nums">{data.totalRoles}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-[12px] border border-slate-200 bg-slate-50/60 p-3.5">
                <div className="w-9 h-9 rounded-xl bg-lpm-blue-700 text-lpm-blue-700 flex items-center justify-center shrink-0">
                  <KeyIcon className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Izin Akses
                  </p>
                  <p className="text-xl font-black text-slate-900 tabular-nums">
                    {data.totalPermissions}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircleIcon className="w-3.5 h-3.5 text-lpm-blue-700" aria-hidden="true" />
                {data.auditSesuai} butir sesuai standar
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ExclamationTriangleIcon className="w-3.5 h-3.5 text-lpm-yellow-400" aria-hidden="true" />
                {data.auditMinor} temuan minor
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ExclamationTriangleIcon className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
                {data.auditMayor} temuan mayor
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ArrowTrendingUpIcon className="w-3.5 h-3.5 text-lpm-blue-700" aria-hidden="true" />
                {data.indikatorTercapai}/{data.indikatorTotal} indikator tercapai
              </span>
              <span className="inline-flex items-center gap-1.5">
                <DocumentArrowUpIcon className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                {data.indikatorTotal} indikator mutu
              </span>
            </div>
          </CardContainer>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
