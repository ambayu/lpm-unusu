import React from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { PageShell } from './PageShell';

/* -------------------------------------------------------------------------- */
/* Tipe kolom tabel                                                           */
/* -------------------------------------------------------------------------- */

export interface ListColumn<T> {
  /** Kunci unik kolom. */
  key: string;
  /** Judul kolom pada <thead>. */
  header: React.ReactNode;
  /** Render isi sel. Bila kosong, dipakai `(row as any)[key]`. */
  render?: (row: T, index: number) => React.ReactNode;
  /** Kelas tambahan untuk <th> (mis. 'text-right', 'w-24'). */
  headerClassName?: string;
  /** Kelas tambahan untuk <td>. */
  cellClassName?: string;
}

/* -------------------------------------------------------------------------- */
/* Props template                                                             */
/* -------------------------------------------------------------------------- */

export interface ListPageTemplateProps<T> {
  /** Judul panel di kepala halaman. */
  title: string;
  /** Deskripsi singkat konteks halaman. */
  description: string;
  /** Lencana kecil di samping judul (mis. "Tata Naskah Master"). */
  badge?: React.ReactNode;
  /**
   * Tombol aksi di kanan judul. Umumnya tombol "Tambah ..." dan "Segarkan".
   * Contoh: <ListActionButton onClick={...} icon={<PlusIcon />}>Tambah</ListActionButton>
   */
  actions?: React.ReactNode;

  /* ---- Toolbar pencarian & filter ---- */

  /** Nilai kotak pencarian (controlled). */
  searchValue?: string;
  /** Handler perubahan kotak pencarian. */
  onSearchChange?: (value: string) => void;
  /** Placeholder kotak pencarian. */
  searchPlaceholder?: string;
  /** Elemen filter tambahan (select, tanggal, dsb.) di kanan kotak cari. */
  filters?: React.ReactNode;

  /* ---- Kartu tabel ---- */

  /** Judul kartu tabel. */
  tableTitle: string;
  /** Subjudul kartu tabel; boleh memuat jumlah data. */
  tableSubtitle?: React.ReactNode;
  /** Lencana di judul kartu tabel (mis. "24 Template"). */
  tableBadge?: React.ReactNode;
  /** Definisi kolom tabel. */
  columns: ListColumn<T>[];
  /** Data baris. */
  rows: T[];
  /** Kunci unik tiap baris. */
  rowKey: (row: T, index: number) => string | number;

  /* ---- Status tampilan ---- */

  /** Tampilkan indikator memuat. */
  loading?: boolean;
  /** Pesan galat; bila ada, kartu galat ditampilkan di atas toolbar. */
  error?: string | null;
  /** Handler "Coba lagi" pada kartu galat. */
  onRetry?: () => void;
  /** Pesan saat tidak ada data sama sekali. */
  emptyMessage?: string;
  /** Pesan saat pencarian tidak menemukan hasil. */
  noResultMessage?: string;
  /** True bila filter/pencarian sedang aktif (membedakan empty vs no-result). */
  hasActiveFilter?: boolean;

  /** Kelas aksen (palette aplikasi), mis. 'bg-emerald-700 hover:bg-emerald-800'. */
  accentClassName?: string;
  /** Kelas ikon pada tombol aksi utama. */
  accentIconClassName?: string;
  /** Lebar minimum tabel agar tetap terbaca saat di-scroll horizontal. */
  minTableWidth?: string;
  /** Isi tambahan di bawah tabel dalam kartu yang sama (mis. paginasi). */
  footer?: React.ReactNode;
  /**
   * Blok ringkasan di atas toolbar pencarian (mis. deretan kartu KPI).
   * Ditampilkan di antara kepala halaman dan toolbar.
   */
  stats?: React.ReactNode;
  /**
   * Tab navigasi yang ditempatkan di dalam kepala halaman (mis. "Semua / Masuk /
   * Keluar"). Berbeda dari `filters` yang berada di samping kotak pencarian.
   */
  tabs?: React.ReactNode;
}

/* -------------------------------------------------------------------------- */
/* Komponen bantu                                                             */
/* -------------------------------------------------------------------------- */

interface ListActionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  /** Bila diisi, tombol dirender sebagai <Link> (navigasi rute). */
  to?: string;
  icon?: React.ReactNode;
  /** Varian tampilan: 'primary' (aksi utama) atau 'secondary' (segarkan). */
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  accentClassName?: string;
  type?: 'button' | 'submit';
}

/**
 * Tombol aksi standar pada kepala halaman list. Tap target 44px sesuai WCAG AA.
 */
export const ListActionButton: React.FC<ListActionButtonProps> = ({
  children,
  onClick,
  to,
  icon,
  variant = 'primary',
  disabled = false,
  accentClassName = 'bg-emerald-700 hover:bg-emerald-800',
  type = 'button',
}) => {
  const base =
    'inline-flex items-center justify-center px-4 py-2.5 rounded-[12px] font-bold text-xs transition min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed';
  const style =
    variant === 'primary'
      ? `text-white shadow-xs ${accentClassName}`
      : 'bg-slate-100 hover:bg-slate-200 text-slate-700';

  const content = (
    <>
      {icon && <span className="mr-1.5 inline-flex">{icon}</span>}
      <span>{children}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`${base} ${style}`}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${style}`}>
      {content}
    </button>
  );
};

/* -------------------------------------------------------------------------- */
/* Template utama                                                             */
/* -------------------------------------------------------------------------- */

/**
 * ListPageTemplate — template BAKU halaman daftar (list/tabel) ekosistem
 * ONE UNUSU.
 *
 * Memuat seluruh kerangka body halaman sehingga setiap menu cukup mengisi
 * judul, kolom, dan datanya:
 *
 *   ┌────────────────────────────────────────────────────────┐
 *   │ [badge] Judul                            [ + Tambah ]  │
 *   │ Deskripsi                                [ Segarkan ]  │
 *   ├────────────────────────────────────────────────────────┤
 *   │ (galat)                                                │
 *   │ [ 🔍 Cari ... ]                     [ filter ] [filter]│
 *   │ ┌ kartu tabel ────────────────────────────────────────┐│
 *   │ │ Judul tabel                          [ 24 data ]    ││
 *   │ │ ┌────┬──────────┬─────────┐                         ││
 *   │ │ │ KOL│ KOLOM    │ AKSI    │                         ││
 *   │ │ ├────┼──────────┼─────────┤                         ││
 *   │ │ │ .. │ ...      │ ...     │                         ││
 *   │ │ └────┴──────────┴─────────┘                         ││
 *   │ └─────────────────────────────────────────────────────┘│
 *   └────────────────────────────────────────────────────────┘
 *
 * Aturan pemakaian:
 *  - Dashboard & halaman formulir TIDAK memakai template ini
 *    (dashboard → laporan grafik, formulir → FormPageTemplate).
 *  - Tabel selalu dibungkus `overflow-x-auto` + `min-w-*` agar bisa di-scroll
 *    horizontal di layar kecil.
 *  - Keadaan memuat / kosong / tanpa hasil ditangani template, bukan per halaman.
 */
export function ListPageTemplate<T>({
  title,
  description,
  badge,
  actions,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Cari data...',
  filters,
  tableTitle,
  tableSubtitle,
  tableBadge,
  columns,
  rows,
  rowKey,
  loading = false,
  error,
  onRetry,
  emptyMessage = 'Belum ada data.',
  noResultMessage = 'Tidak ada data yang cocok dengan kriteria pencarian.',
  hasActiveFilter = false,
  minTableWidth = 'min-w-[1080px]',
  footer,
  stats,
  tabs,
}: ListPageTemplateProps<T>) {
  const showSearch = typeof onSearchChange === 'function';

  return (
    <PageShell title={title} description={description} badge={badge} actions={actions} headerFooter={tabs}>
      {/* ---------- Ringkasan / KPI ---------- */}
      {stats}

      {/* ---------- Galat ---------- */}
      {error && (
        <div
          role="alert"
          className="bg-rose-50 border border-rose-200 rounded-[14px] p-4 text-center"
        >
          <p className="text-xs text-rose-700 font-bold">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 text-xs text-rose-800 underline font-bold"
            >
              Coba lagi
            </button>
          )}
        </div>
      )}

      {/* ---------- Toolbar pencarian & filter ---------- */}
      {(showSearch || filters) && (
        <div className="bg-white border border-[#CBD5E1] rounded-[14px] p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row gap-3">
            {showSearch && (
              <div className="relative flex-1">
                <MagnifyingGlassIcon
                  className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchValue ?? ''}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 text-slate-800 min-h-[44px]"
                />
              </div>
            )}
            {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
          </div>
        </div>
      )}

      {/* ---------- Kartu tabel ---------- */}
      <div className="w-full min-w-0 bg-white border border-[#CBD5E1] rounded-[16px] shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 sm:p-6 border-b border-[#CBD5E1]">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">{tableTitle}</h2>
            {tableSubtitle && (
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">{tableSubtitle}</p>
            )}
          </div>
          {tableBadge}
        </div>

        <div className="p-5 sm:p-6">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <ArrowPathIcon className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" aria-hidden="true" />
              Memuat data...
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              {hasActiveFilter ? noResultMessage : emptyMessage}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className={`w-full ${minTableWidth} text-left text-xs text-slate-700 border-collapse`}>
                <thead>
                  <tr className="border-b border-[#CBD5E1] bg-slate-50/70 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                    {columns.map((col) => (
                      <th key={col.key} className={`py-3 px-4 ${col.headerClassName ?? ''}`}>
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CBD5E1]/60">
                  {rows.map((row, index) => (
                    <tr key={rowKey(row, index)} className="hover:bg-slate-50/80 transition-colors">
                      {columns.map((col) => (
                        <td key={col.key} className={`py-3.5 px-4 ${col.cellClassName ?? ''}`}>
                          {col.render
                            ? col.render(row, index)
                            : ((row as Record<string, unknown>)[col.key] as React.ReactNode)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Isi tambahan (paginasi) — tetap di dalam kartu tabel */}
        {footer}
      </div>
    </PageShell>
  );
}

export default ListPageTemplate;
