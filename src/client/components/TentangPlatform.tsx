import React, { useState } from 'react';

interface TentangPlatformProps {
  /** Anchor & aria-labelledby id (default: 'tentang'). */
  id?: string;
  eyebrow?: string;
  title: React.ReactNode;
  paragraphs?: React.ReactNode[];
  bullets?: React.ReactNode[];
  /** Path gambar potret utama (mis. '/assets/profil-operator-surat.png'). */
  portraitSrc?: string;
  /** Path gambar cadangan bila potret belum tersedia. */
  fallbackSrc?: string;
  imageAlt?: string;
  accentBg?: string;
  accentBorder?: string;
  bulletBg?: string;
  eyebrowClass?: string;
}

/**
 * TentangPlatform — seksi "Tentang Platform" dengan pola baku ONE UNUSU:
 * teks di kiri (eyebrow + judul + paragraf + poin centang), gambar di kanan.
 *
 * Gambar potret (`portraitSrc`) adalah aset utama. Bila aset potret belum
 * tersedia, komponen otomatis jatuh ke `fallbackSrc` (foto suasana kampus)
 * sehingga halaman tidak pernah menampilkan gambar rusak. Begitu file potret
 * ditambahkan ke `public/assets/`, tampilannya langsung berganti tanpa perlu
 * mengubah kode.
 */
export const TentangPlatform: React.FC<TentangPlatformProps> = ({
  id = 'tentang',
  eyebrow = 'Tentang Platform',
  title,
  paragraphs = [],
  bullets = [],
  portraitSrc,
  fallbackSrc,
  imageAlt = '',
  accentBg = 'from-lpm-blue-100/90 via-lpm-yellow-400/60 to-transparent',
  accentBorder = 'border-lpm-blue-100',
  bulletBg = 'bg-lpm-blue-800 text-lpm-yellow-400',
  eyebrowClass = 'text-lpm-blue-800 border-lpm-blue-800',
}) => {
  const [usePortrait, setUsePortrait] = useState(Boolean(portraitSrc));
  const base = import.meta.env.BASE_URL || '/';
  const resolve = (p?: string) => (p ? (p.startsWith('http') ? p : `${base}${p.replace(/^\//, '')}`) : '');
  const src = resolve(usePortrait ? portraitSrc : fallbackSrc);

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="bg-lpm-blue-50 py-16 sm:py-24 border-b border-lpm-blue-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
        {/* KIRI — teks */}
        <div className="lg:col-span-6">
          <div className="space-y-2">
            {/* Eyebrow: bilah tegak, bukan pil rounded-full. */}
            <p
              className={`inline-block border-l-2 pl-3 text-xs font-bold uppercase tracking-widest ${eyebrowClass}`}
            >
              {eyebrow}
            </p>
            <h2 id={`${id}-title`} className="pt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {title}
            </h2>
          </div>

          <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-600 sm:text-base">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <ul className="mt-7 space-y-3">
            {bullets.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-xs text-slate-700 sm:text-sm">
                <span
                  className={`mt-0.5 grid size-5 flex-shrink-0 place-items-center rounded-full ${bulletBg}`}
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5">
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* KANAN — gambar */}
        <div className="lg:col-span-6">
          <div className="relative mx-auto flex max-w-lg items-end justify-center">
            <div
              className={`absolute inset-x-2 bottom-0 h-[86%] rounded-[40px] border bg-gradient-to-tr ${accentBg} ${accentBorder}`}
              aria-hidden="true"
            />
            {src && (
              <img
                src={src}
                alt={imageAlt}
                loading="lazy"
                decoding="async"
                onError={() => {
                  if (usePortrait && fallbackSrc) setUsePortrait(false);
                }}
                className="relative z-10 w-full rounded-[28px] object-cover shadow-[0_24px_60px_-24px_rgba(15,23,42,0.35)]"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TentangPlatform;
