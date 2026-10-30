import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  HomeIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isActive = (path: string) =>
    location.pathname === path ||
    (path === '/admin/standar' && (location.pathname === '/admin' || location.pathname.startsWith('/admin/standar/'))) ||
    (path === '/admin/dokumen' && location.pathname.startsWith('/admin/dokumen/')) ||
    (path === '/admin/ami' && location.pathname.startsWith('/admin/ami/'));

  const navItems = [
    {
      path: '/admin/standar',
      label: 'Standar SPMI',
      icon: AcademicCapIcon,
      desc: 'Pangkalan Butir Siklus PPEPP',
    },
    {
      path: '/admin/dokumen',
      label: 'Dokumen Mutu & SOP',
      icon: BookOpenIcon,
      desc: 'Arsip Kebijakan & Formulir',
    },
    {
      path: '/admin/ami',
      label: 'Audit Mutu Internal (AMI)',
      icon: ClipboardDocumentCheckIcon,
      desc: 'Siklus Evaluasi & KTS Mutu',
    },
  ];

  const getBreadcrumbLabel = (path: string) => {
    if (path === '/admin' || path === '/admin/standar') return 'Pangkalan Standar Mutu SPMI';
    if (path === '/admin/standar/tambah') return 'Tambah Standar SPMI Baru';
    if (path.startsWith('/admin/standar/edit/')) return 'Edit Standar SPMI';
    if (path === '/admin/dokumen') return 'Bank Dokumen Kebijakan, Manual & SOP';
    if (path === '/admin/dokumen/tambah') return 'Upload Dokumen Mutu Baru';
    if (path.startsWith('/admin/dokumen/edit/')) return 'Edit Dokumen Mutu';
    if (path === '/admin/ami') return 'Audit Mutu Internal (AMI) & Temuan Lapangan';
    if (path === '/admin/ami/tambah') return 'Catat Temuan Audit AMI Baru';
    if (path.startsWith('/admin/ami/edit/')) return 'Edit Temuan Audit AMI';
    return 'Lembaga Penjaminan Mutu';
  };

  const currentLabel = getBreadcrumbLabel(location.pathname);

  const renderSidebar = (isCollapsed: boolean) => (
    <div className="h-full flex flex-col justify-between bg-[#F0F4FA] text-slate-800 border-r border-[#CBD5E1] relative overflow-hidden select-none">
      <div className="relative z-10 flex flex-col h-full">
        {/* Header Branding — Height h-[88px] exactly matches Topbar height */}
        <div
          className={`h-[88px] border-b border-[#CBD5E1] flex items-center justify-between ${
            isCollapsed ? 'px-3 justify-center' : 'px-5'
          }`}
        >
          <Link to="/admin" className="flex items-center space-x-3 overflow-hidden">
            <div className="w-11 h-11 rounded-[14px] bg-white border border-[#CBD5E1] p-1 shadow-2xs flex-shrink-0 flex items-center justify-center">
              <div className="w-9 h-9 rounded-[10px] bg-blue-900 flex items-center justify-center text-white shadow-xs">
                <ShieldCheckIcon className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            {!isCollapsed && (
              <div className="leading-tight truncate">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-base text-slate-900 tracking-normal">LPM</span>
                  <span className="font-bold text-base text-blue-900 tracking-normal">UNUSU</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium tracking-wide mt-0.5">
                  Penjaminan Mutu Internal
                </p>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-5 px-3 space-y-6 overflow-y-auto">
          <div>
            {!isCollapsed && (
              <p className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                MENU TATA KELOLA MUTU
              </p>
            )}
            <nav className="space-y-1.5" role="navigation" aria-label="Menu utama">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    title={isCollapsed ? item.label : undefined}
                    aria-current={active ? 'page' : undefined}
                    className={`w-full flex items-center rounded-[12px] text-[13.5px] font-semibold transition-all ${
                      isCollapsed ? 'justify-center p-2.5' : 'px-3.5 py-2.5 gap-3'
                    } ${
                      active
                        ? 'bg-[#DBEAFE] text-blue-900 font-bold shadow-2xs'
                        : 'text-slate-600 hover:bg-[#E2EDFB] hover:text-blue-900'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0 transition-colors ${
                        active
                          ? 'bg-blue-900 text-white shadow-2xs'
                          : 'bg-[#DBEAFE] text-blue-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {!isCollapsed && (
                      <div className="truncate">
                        <div className="leading-tight">{item.label}</div>
                        <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                          {item.desc}
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            {!isCollapsed && (
              <p className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                NAVIGASI
              </p>
            )}
            <div className="space-y-1.5">
              <Link
                to="/"
                className={`w-full flex items-center rounded-[12px] text-[13.5px] font-medium transition-all ${
                  isCollapsed ? 'justify-center p-2.5' : 'px-3.5 py-2.5 gap-3'
                } text-slate-600 hover:bg-[#E2EDFB] hover:text-blue-900`}
                title={isCollapsed ? 'Halaman Depan LPM' : undefined}
              >
                <div className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0 bg-[#DBEAFE] text-blue-700">
                  <HomeIcon className="w-4 h-4" />
                </div>
                {!isCollapsed && (
                  <div className="truncate">
                    <div className="leading-tight font-semibold">Halaman Depan</div>
                    <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                      Beranda Profil LPM UNUSU
                    </div>
                  </div>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar Footer — Status & Logout action pill */}
        <div className={`border-t border-[#CBD5E1] p-3 space-y-2 bg-[#E9EFF7] ${isCollapsed ? 'text-center' : ''}`}>
          {!isCollapsed ? (
            <>
              {/* System status pill */}
              <div className="px-3 py-2 rounded-[12px] bg-white border border-[#CBD5E1] shadow-2xs flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-semibold text-slate-700">SSO Gateway Aktif</span>
                </div>
                <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  LPM
                </span>
              </div>

              {/* Logout button */}
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-[12px] bg-white hover:bg-rose-50 border border-[#CBD5E1] hover:border-rose-200 text-xs font-semibold text-slate-700 hover:text-rose-700 shadow-2xs transition-colors cursor-pointer"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                <span>Keluar Akun</span>
              </button>
            </>
          ) : (
            <button
              onClick={logout}
              title="Keluar dari LPM UNUSU"
              aria-label="Keluar dari LPM UNUSU"
              className="p-2.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-[12px] transition-colors mx-auto cursor-pointer block border border-[#CBD5E1] bg-white shadow-2xs"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col lg:flex-row font-sans text-slate-800">
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-white border-b border-[#CBD5E1] px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-2xs">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-[10px] border border-[#CBD5E1] text-slate-600 hover:bg-slate-100 focus:outline-none"
            aria-label="Buka menu navigasi"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-[10px] bg-blue-900 flex items-center justify-center text-white ring-1 ring-blue-800">
              <ShieldCheckIcon className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900">LPM </span>
              <span className="font-bold text-sm text-blue-900">UNUSU</span>
            </div>
          </div>
        </div>

        <Link
          to="/"
          className="text-xs font-semibold text-blue-900 bg-blue-50 px-3 py-1.5 rounded-[10px] border border-blue-200"
        >
          Beranda
        </Link>
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex" role="dialog" aria-modal="true" aria-label="Menu navigasi">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="absolute top-3 right-3 z-20">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-[10px] bg-white/90 text-slate-600 hover:bg-white shadow-xs border border-[#CBD5E1]"
                aria-label="Tutup menu navigasi"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            {renderSidebar(false)}
          </div>
        </div>
      )}

      {/* Desktop Sticky Sidebar — matches ONE UNUSU pattern */}
      <aside
        className={`hidden lg:block sticky top-0 h-screen transition-[width] duration-300 ease-in-out flex-shrink-0 z-30 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
        aria-label="Sidebar navigasi"
      >
        {renderSidebar(collapsed)}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar/Headbar — Exact 88px height matching Sidebar Brand Header */}
        <header className="hidden lg:flex sticky top-0 z-20 bg-white border-b border-[#CBD5E1] h-[88px] px-6 items-center justify-between shadow-2xs">
          {/* Left Controls: Sidebar toggle & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-[10px] border border-[#CBD5E1] text-slate-600 hover:bg-[#E2EDFB] hover:text-blue-900 transition-colors cursor-pointer"
              title={collapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
            >
              {collapsed ? (
                <ChevronDoubleRightIcon className="w-4 h-4" />
              ) : (
                <ChevronDoubleLeftIcon className="w-4 h-4" />
              )}
            </button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm">
              <Link to="/admin" className="text-blue-900 hover:text-blue-950 font-medium flex items-center gap-1">
                <HomeIcon className="w-4 h-4" />
                <span className="font-bold">LPM UNUSU</span>
              </Link>
              <span className="text-slate-400 font-bold">›</span>
              <span className="text-slate-600 font-medium">{currentLabel}</span>
            </nav>
          </div>

          {/* Right Controls: User Profile Dropdown */}
          <div className="flex items-center gap-3 relative">
            {/* User Profile Pill */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-[#CBD5E1] bg-white hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-xs ring-1 ring-blue-800">
                  {user?.nama ? user.nama.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="text-left hidden xl:block leading-tight">
                  <div className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                    {user?.nama || 'Auditor Mutu'}
                  </div>
                  <div className="text-[10px] text-blue-900 font-semibold">{user?.role || 'Super Admin'}</div>
                </div>
                <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown Popup */}
              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-[14px] bg-white shadow-md border border-[#CBD5E1] py-1.5 z-50 text-xs"
                  onMouseLeave={() => setProfileDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-900">{user?.nama || 'Auditor Mutu'}</p>
                    <p className="text-[11px] text-slate-500 font-normal">{user?.email || 'lpm@unusu.ac.id'}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 text-[10px] font-bold border border-blue-200">
                      {user?.role || 'Auditor Internal'}
                    </span>
                  </div>
                  <Link
                    to="/"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-900 transition-colors"
                  >
                    <HomeIcon className="w-4 h-4 text-slate-400" />
                    <span>Halaman Depan LPM</span>
                  </Link>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-rose-700 hover:bg-rose-50 transition-colors text-left font-semibold cursor-pointer border-t border-slate-100"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    <span>Keluar Akun</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Canvas */}
        <main className="flex-1 p-5 sm:p-7 min-w-0 w-full">{children}</main>

        {/* Subtle Clean Footer */}
        <footer className="py-5 px-6 text-center text-xs text-slate-500 border-t border-[#CBD5E1] bg-white">
          &copy; {new Date().getFullYear()} LPM UNUSU — Lembaga Penjaminan Mutu Terintegrasi Ekosistem ONE UNUSU
        </footer>
      </div>
    </div>
  );
};
