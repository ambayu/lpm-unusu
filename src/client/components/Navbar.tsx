import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldCheckIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  HomeIcon,
  ArrowTopRightOnSquareIcon,
  ArrowRightStartOnRectangleIcon,
  ArrowRightIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

interface NavLinkItem {
  /** Tautan rute (react-router) — mis. "/". */
  to?: string;
  /** Tautan jangkar di landing page — mis. "#spmi". */
  href?: string;
  label: string;
  icon?: React.ElementType;
  /** Predikat penanda menu aktif. */
  match: (pathname: string, hash: string) => boolean;
}

const WEBSITE_KAMPUS = 'https://unusu.ac.id';

/**
 * Navbar publik LPM UNUSU.
 *
 * Struktur baku ekosistem ONE UNUSU:
 *   ┌──────────────────────────────────────────────────────────────────────┐
 *   │ [logo] LPM UNUSU    | Beranda  Standar SPMI  Dokumen  Audit  | Aksi  │
 *   └──────────────────────────────────────────────────────────────────────┘
 * Brand di kiri, menu di tengah, aksi akun di kanan.
 *
 * Navbar disembunyikan pada rute panel (/admin) karena panel sudah memiliki
 * sidebar + topbar sendiri — guard ganda: App.tsx tidak merender Navbar di
 * dalam SidebarLayout, dan komponen ini tetap mengembalikan null.
 */
export const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, roleLabel, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Tutup menu mobile setiap kali rute/hash berubah.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  // Panel admin punya topbar sendiri; navbar publik tidak boleh muncul.
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const hash = location.hash || '';
  const isLanding = location.pathname === '/' || location.pathname === '';

  const links: NavLinkItem[] = [
    {
      to: '/',
      label: 'Beranda',
      icon: HomeIcon,
      match: (p) => p === '/' || p === '',
    },
    {
      href: '#spmi',
      label: 'Standar SPMI',
      icon: AcademicCapIcon,
      match: (p, h) => (p === '/' || p === '') && h === '#spmi',
    },
    {
      href: '#dokumen',
      label: 'Dokumen Mutu',
      icon: BookOpenIcon,
      match: (p, h) => (p === '/' || p === '') && h === '#dokumen',
    },
    {
      href: '#ami',
      label: 'Audit AMI',
      icon: ClipboardDocumentCheckIcon,
      match: (p, h) => (p === '/' || p === '') && h === '#ami',
    },
  ];

  const isActive = (item: NavLinkItem) => item.match(location.pathname, hash);

  const linkClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-lpm-yellow-400 ${
      active
        ? 'text-lpm-blue-900 bg-lpm-yellow-400'
        : 'text-white hover:text-lpm-yellow-400 hover:bg-white/10'
    }`;

  /** Menu dirender sebagai Link (rute) atau <a> (jangkar landing). */
  const renderItem = (item: NavLinkItem, variant: 'desktop' | 'mobile') => {
    const active = isActive(item);
    const Icon = item.icon;
    const content = (
      <>
        {Icon ? (
          <Icon
            className={variant === 'desktop' ? 'w-4 h-4' : 'w-4 h-4'}
            aria-hidden="true"
          />
        ) : null}
        <span>{item.label}</span>
      </>
    );

    const className =
      variant === 'desktop'
        ? linkClass(active)
        : `flex items-center gap-2 min-h-[44px] px-3 rounded-[8px] text-sm font-semibold ${
            active ? 'bg-lpm-yellow-400 text-lpm-blue-900' : 'text-white hover:bg-white/10'
          }`;

    const commonProps = {
      className,
      'aria-current': active ? ('page' as const) : undefined,
    };

    if (item.to) {
      return (
        <Link key={item.label} to={item.to} onClick={() => setMobileOpen(false)} {...commonProps}>
          {content}
        </Link>
      );
    }

    // Jangkar hanya bermakna di landing page; dari halaman lain arahkan ke "/#..."
    const href = isLanding ? item.href : `/${item.href}`;

    return (
      <a
        key={item.label}
        href={href}
        onClick={() => setMobileOpen(false)}
        {...commonProps}
      >
        {content}
      </a>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-lpm-blue-900 border-b-2 border-lpm-yellow-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* ---------- KIRI: BRAND ---------- */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="LPM UNUSU — Beranda">
            <div className="w-9 h-9 rounded-[10px] bg-lpm-yellow-400 flex items-center justify-center">
              <ShieldCheckIcon className="w-5 h-5 text-lpm-blue-900" aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <div className="flex items-baseline gap-1">
                <span className="font-extrabold text-[15px] tracking-tight text-white">LPM</span>
                <span className="font-extrabold text-[15px] tracking-tight text-lpm-yellow-400">UNUSU</span>
              </div>
              <p className="text-[10px] font-medium text-lpm-blue-200">Penjaminan Mutu Internal</p>
            </div>
          </Link>

          {/* ---------- TENGAH: MENU DESKTOP ---------- */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Navigasi utama">
            {links.map((item) => renderItem(item, 'desktop'))}
          </nav>

          {/* ---------- KANAN: AKSI ---------- */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Identitas pengguna — tautan langsung ke panel pengelola tanpa border;
                 *  saat hover hanya bayangan tipis di kiri & kanan sebagai penanda area.
                 *  Dropdown akun ada di topbar panel administrasi. */}
                <Link
                  to="/admin"
                  aria-label="Buka panel manajemen"
                  title="Buka panel manajemen"
                  className="group hidden lg:inline-flex items-center gap-2 h-[44px] px-3 text-white transition-all hover:text-lpm-yellow-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lpm-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-lpm-blue-900"
                >
                  <div className="w-8 h-8 rounded-full bg-lpm-yellow-400 text-lpm-blue-900 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                    {user.nama?.charAt(0) || <UserCircleIcon className="w-4 h-4" aria-hidden="true" />}
                  </div>
                  <div className="flex flex-col leading-tight min-w-0 text-left">
                    <span className="text-xs font-bold text-white max-w-[140px] truncate">
                      {user.nama}
                    </span>
                    <span className="text-[10px] font-semibold uppercase text-lpm-yellow-400 truncate max-w-[140px]">
                      {roleLabel}
                    </span>
                  </div>
                </Link>

                {/* Mobile: jalan masuk panel lewat tombol ikon */}
                <Link
                  to="/admin"
                  aria-label="Buka panel manajemen"
                  title="Buka panel manajemen"
                  className="lg:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-[8px] text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lpm-yellow-400"
                >
                  <Squares2X2Icon className="w-4 h-4" aria-hidden="true" />
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-3 rounded-[8px] text-xs font-semibold text-rose-300 hover:bg-rose-500/20 border border-transparent hover:border-rose-400/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 cursor-pointer"
                >
                  <ArrowRightStartOnRectangleIcon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </>
            ) : (
              <>
                <a
                  href={WEBSITE_KAMPUS}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="hidden lg:inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-[8px] text-xs font-semibold text-lpm-blue-100 hover:text-lpm-yellow-400 hover:bg-white/10 transition-colors"
                >
                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Website Kampus</span>
                </a>
                <Link
                  to="/login"
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-4 rounded-[8px] text-xs font-bold bg-lpm-yellow-400 hover:bg-lpm-yellow-500 text-lpm-blue-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-lpm-blue-900"
                >
                  <span>Masuk SSO</span>
                  <ArrowRightIcon className="w-3.5 h-3.5 text-lpm-yellow-400" aria-hidden="true" />
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={mobileOpen}
              className="md:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-[8px] border border-white/30 text-white"
            >
              {mobileOpen ? (
                <XMarkIcon className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Bars3Icon className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ---------- MENU MOBILE ---------- */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/20 bg-lpm-blue-900 px-4 py-3 space-y-1">
          {links.map((item) => renderItem(item, 'mobile'))}

          <div className="pt-2 mt-1 border-t border-slate-100 space-y-1">
            <a
              href={WEBSITE_KAMPUS}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-2 min-h-[44px] px-3 rounded-[8px] text-sm font-semibold text-white hover:bg-white/10"
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4" aria-hidden="true" />
              <span>Website Kampus</span>
            </a>
            {user && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 min-h-[44px] px-3 rounded-[8px] text-sm font-semibold text-lpm-blue-900 bg-lpm-blue-50"
              >
                <ArrowRightIcon className="w-4 h-4" aria-hidden="true" />
                <span>Panel Manajemen</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
