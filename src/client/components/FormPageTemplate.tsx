import React from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon } from '@heroicons/react/24/outline';
import { PageShell } from './PageShell';

interface FormPageTemplateProps {
  /** Judul panel, mis. "Tambah Standar SPMI Baru" atau "Edit Butir Standar SPMI". */
  title: string;
  /** Deskripsi singkat konteks formulir. */
  description: string;
  /** Path tujuan tombol kembali (mis. '/admin/standar'). */
  backTo: string;
  backLabel?: string;
  /** Label tombol kirim; default otomatis dari `isEdit`. */
  submitLabel?: string;
  cancelLabel?: string;
  /** True bila formulir sedang dalam mode ubah data. */
  isEdit?: boolean;
  submitting?: boolean;
  error?: string | null;
  /** Label tambahan di kanan judul (mis. badge status). */
  badge?: React.ReactNode;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onCancel?: () => void;
  /** Kelas aksen tombol simpan (palette aplikasi). */
  accentClassName?: string;
  /** Warna ikon centang pada tombol simpan. */
  submitIconClassName?: string;
  /** Kelas focus ring field, mengikuti palette aplikasi. */
  children: React.ReactNode;
}

/**
 * FormPageTemplate — template BAKU seluruh halaman formulir (tambah/ubah data)
 * pada ekosistem ONE UNUSU.
 *
 * Tujuan: setiap menu yang memiliki formulir tampil dengan kerangka yang sama
 * (header panel + pesan galat + area isian + baris aksi tetap di bawah),
 * sehingga tata letak konsisten antar menu dan antar aplikasi. Dashboard tidak
 * memakai template ini.
 *
 * Kerangka kepala halaman (lebar, border, radius, tipografi judul, posisi
 * tombol) dipinjam dari `PageShell` — komponen yang SAMA dipakai
 * `ListPageTemplate`. Dengan begitu halaman formulir dan halaman daftar tidak
 * lagi tampak berbeda.
 *
 * Struktur:
 *   ┌ PageShell ─────────────────────────────────────────┐
 *   │ [badge] Judul                          [Kembali]   │
 *   │ Deskripsi                                          │
 *   ├────────────────────────────────────────────────────┤
 *   │ (pesan galat)                                      │
 *   │ children — seksi-seksi CardContainer               │
 *   │ ─────────────────────────────────────────────────  │
 *   │ [Batal]                              [Simpan]      │
 *   └────────────────────────────────────────────────────┘
 */
export const FormPageTemplate: React.FC<FormPageTemplateProps> = ({
  title,
  description,
  backTo,
  backLabel = 'Kembali',
  submitLabel,
  cancelLabel = 'Batal',
  isEdit = false,
  submitting = false,
  error,
  badge,
  onSubmit,
  onCancel,
  accentClassName = 'bg-blue-900 hover:bg-blue-950',
  submitIconClassName = 'text-amber-400',
  children,
}) => {
  const finalSubmitLabel =
    submitLabel || (isEdit ? 'Simpan Perubahan' : 'Simpan Data');

  return (
    <PageShell
      title={title}
      description={description}
      badge={badge}
      actions={
        <Link
          to={backTo}
          className="inline-flex items-center justify-center px-5 py-2.5 h-[42px] rounded-[12px] border border-[#CBD5E1] bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold shadow-2xs transition-all shrink-0"
        >
          <span>{backLabel}</span>
        </Link>
      }
    >
      {/* Kartu isian — kerangka sama dengan kartu tabel pada ListPageTemplate */}
      <div className="w-full min-w-0 bg-white border border-[#CBD5E1] rounded-[16px] shadow-xs overflow-hidden">
        <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-6">
          {error && (
            <div
              role="alert"
              className="p-4 rounded-[12px] bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium"
            >
              {error}
            </div>
          )}

          {children}

          {/* Baris aksi standar — selalu di bawah formulir */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className="inline-flex items-center justify-center px-5 py-2.5 h-[42px] rounded-[12px] border border-[#CBD5E1] bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold transition-all shadow-2xs disabled:opacity-50"
              >
                {cancelLabel}
              </button>
            ) : (
              <Link
                to={backTo}
                className="inline-flex items-center justify-center px-5 py-2.5 h-[42px] rounded-[12px] border border-[#CBD5E1] bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold transition-all shadow-2xs"
              >
                {cancelLabel}
              </Link>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex items-center justify-center gap-2.5 px-6 py-2.5 h-[42px] rounded-[12px] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer ${accentClassName}`}
            >
              <CheckIcon className={`w-5 h-5 ${submitIconClassName}`} aria-hidden="true" />
              <span>{submitting ? 'Menyimpan...' : finalSubmitLabel}</span>
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
};

export default FormPageTemplate;
