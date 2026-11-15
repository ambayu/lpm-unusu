import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * Definisi satu kolom tabel.
 * `ListPageTemplate` mengekspor tipe yang sama (`ListColumn`) sehingga kolom
 * dapat dipakai bergantian di kedua komponen tanpa konversi.
 */
export interface DataTableColumn<T> {
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

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string | number;
  /** Tampilkan indikator memuat menggantikan isi tabel. */
  loading?: boolean;
  /** Pesan saat data kosong (sudah difilter oleh pemanggil). */
  emptyMessage?: React.ReactNode;
  /**
   * Ukuran teks tabel. `md` (default) adalah ukuran baku panel admin:
   * header 12px uppercase, isi sel 14px. `sm` hanya untuk tabel padat
   * seperti daftar centang pada formulir.
   */
  size?: 'sm' | 'md';
  /** Lebar minimum tabel agar tetap terbaca saat di-scroll horizontal. */
  minTableWidth?: string;
  /** Isi tambahan di bawah tabel (mis. paginasi). */
  footer?: React.ReactNode;
  className?: string;
}

/**
 * DataTable — komponen tabel BAKU ekosistem ONE UNUSU.
 *
 * Seluruh halaman daftar WAJIB merender data melalui komponen ini (langsung
 * atau lewat `ListPageTemplate` yang memakainya secara internal). Dilarang
 * menulis `<table>` inline di halaman: aturan ukuran, warna header, garis
 * pemisah, dan perilaku scroll horizontal harus seragam di semua menu.
 *
 * Ketentuan visual (size `md`):
 *  - header: `text-xs font-bold uppercase tracking-wider`, latar `bg-slate-50/70`;
 *  - isi sel: `text-sm` dengan padding `py-3.5 px-4`;
 *  - tabel dibungkus `overflow-x-auto` + lebar minimum agar layar kecil tetap
 *    bisa digeser horizontal tanpa memotong kolom.
 *
 * Aksesibilitas: tabel semantik (`<table>`/`<thead>`/`<th>`/`<td>`), baris
 * memakai `key` unik dari `rowKey`, dan status memuat diumumkan lewat
 * `role="status"`.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  emptyMessage = 'Belum ada data.',
  size = 'md',
  minTableWidth = 'min-w-[1080px]',
  footer,
  className = '',
}: DataTableProps<T>) {
  const isSm = size === 'sm';

  const tableTextClass = isSm ? 'text-xs' : 'text-sm';
  const headClass = isSm ? 'text-[11px]' : 'text-xs';
  const cellPadding = isSm ? 'py-2.5 px-3' : 'py-3.5 px-4';

  /**
   * Ukuran teks baku, ditempelkan langsung pada `<th>`/`<td>`.
   * Kolom hanya boleh mengatur perataan, lebar, atau warna — mengubah ukuran
   * font di dalam sel dilarang agar seluruh tabel seragam.
   */
  const headTypeClass = `${headClass} font-bold leading-tight`;
  const cellTypeClass = `${tableTextClass} font-medium leading-normal`;

  if (loading) {
    return (
      <div className={`py-16 text-center text-slate-400 ${tableTextClass}`} role="status">
        <ArrowPathIcon
          className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400"
          aria-hidden="true"
        />
        Memuat data...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={`py-16 text-center text-slate-400 ${tableTextClass}`} role="status">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table
          className={`w-full ${minTableWidth} text-left ${tableTextClass} text-slate-700 border-collapse ${className}`}
        >
          <thead>
            <tr className="border-b border-[#CBD5E1] bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`${cellPadding} ${headTypeClass} ${col.headerClassName ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#CBD5E1]/60">
            {rows.map((row, index) => (
              <tr key={rowKey(row, index)} className="hover:bg-slate-50/80 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className={`${cellPadding} ${cellTypeClass} ${col.cellClassName ?? ''}`}>
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
      {footer}
    </>
  );
}

export default DataTable;
