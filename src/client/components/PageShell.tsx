import React from 'react';

/* -------------------------------------------------------------------------- */
/* PageShell — kerangka BAKU seluruh halaman panel ekosistem ONE UNUSU        */
/* -------------------------------------------------------------------------- */

export interface PageShellProps {
  /** Judul panel di kepala halaman. */
  title: string;
  /** Deskripsi singkat konteks halaman. */
  description: string;
  /** Lencana kecil di samping judul (mis. "Tata Naskah Master"). */
  badge?: React.ReactNode;
  /** Tombol aksi di kanan judul. */
  actions?: React.ReactNode;
  /** Isi tambahan yang menempel di bawah kepala halaman (mis. tab). */
  headerFooter?: React.ReactNode;
  /** Isi utama halaman. */
  children: React.ReactNode;
}

/**
 * PageShell — satu-satunya sumber kerangka kepala halaman.
 *
 * Dipakai oleh `ListPageTemplate` (halaman daftar) DAN `FormPageTemplate`
 * (halaman formulir) agar kedua jenis halaman tampil dengan kerangka identik:
 * lebar, padding, border, radius, tipografi judul, dan posisi tombol aksi.
 *
 *   ┌────────────────────────────────────────────────────────┐
 *   │ [badge] Judul                            [ aksi aksi ] │
 *   │ Deskripsi                                              │
 *   ├────────────────────────────────────────────────────────┤
 *   │ children                                               │
 *   └────────────────────────────────────────────────────────┘
 *
 * Catatan: shell TIDAK menambahkan `max-w-*`, `mx-auto`, atau padding luar —
 * padding dan lebar kanvas sudah disediakan `AdminLayout`/`SidebarLayout`.
 * Menambahkannya lagi membuat halaman tampak berbeda padahal templatenya sama.
 */
export const PageShell: React.FC<PageShellProps> = ({
  title,
  description,
  badge,
  actions,
  headerFooter,
  children,
}) => {
  return (
    <div className="w-full min-w-0 space-y-5">
      {/* ---------- Kepala halaman ---------- */}
      <div className="w-full min-w-0 bg-white border border-[#CBD5E1] rounded-[16px] shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">{title}</h1>
              {badge}
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">{description}</p>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
        </div>
        {headerFooter && (
          <div className="flex flex-wrap items-center gap-2 px-5 sm:px-6 py-4 border-t border-[#CBD5E1]">
            {headerFooter}
          </div>
        )}
      </div>

      {/* ---------- Isi halaman ---------- */}
      {children}
    </div>
  );
};

export default PageShell;
