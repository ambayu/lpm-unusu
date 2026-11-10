import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SidebarLayout } from './components/SidebarLayout';
import { LandingPage } from './pages/Landing';
import { DashboardPage } from './pages/Dashboard';
import { StandarPage } from './pages/Standar';
import { StandarFormPage } from './pages/StandarForm';
import { DokumenPage } from './pages/Dokumen';
import { DokumenFormPage } from './pages/DokumenForm';
import { AmiPage } from './pages/Ami';
import { AmiFormPage } from './pages/AmiForm';
import { ManajemenSliderLpm } from './pages/ManajemenSliderLpm';
import { UsersPage } from './pages/Users';
import { PenggunaFormPage } from './pages/PenggunaForm';
import { PeranFormPage } from './pages/RolesForm';
import { RolesPage } from './pages/Roles';
import { PermissionsPage } from './pages/Permissions';
import { ProfilPage } from './pages/Profil';
import { LoginPage } from './pages/Login';
import { SsoCallbackPage } from './pages/SsoCallback';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessDeniedPage } from './pages/AccessDenied';
import { ForbiddenPage } from './pages/Forbidden';
import { NotFoundPage } from './pages/NotFound';

/**
 * Penjaga rute panel.
 *
 * Tiga lapis pemeriksaan:
 * 1. Belum login            -> /login
 * 2. Tanpa izin masuk panel -> /akses-ditolak (403 masuk)
 * 3. Tanpa izin fitur       -> halaman 403 fitur (`izin` diisi)
 *
 * Otorisasi SELALU lewat daftar `izin`, tidak pernah lewat nama peran.
 */
function ProtectedRoute({
  children,
  izin,
}: {
  children: React.ReactElement;
  /** Kunci izin yang harus dimiliki untuk membuka rute ini. */
  izin?: string[];
}) {
  const { user, loading, accessDenied, bisa } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F5F2] text-xs font-semibold text-slate-500">
        Memuat sesi penjaminan mutu...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (accessDenied) {
    return <Navigate to="/akses-ditolak" replace />;
  }

  const halaman = <SidebarLayout>{children}</SidebarLayout>;

  if (izin && izin.length > 0 && !bisa(...izin)) {
    return <SidebarLayout><ForbiddenPage /></SidebarLayout>;
  }

  return halaman;
}

const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

export function App() {
  const currentPath = window.location.pathname;
  const isBaseSubpath = BASE_PATH && currentPath.startsWith(BASE_PATH);
  const routerBasename = isBaseSubpath ? BASE_PATH : '';

  return (
    <AuthProvider>
      <Router basename={routerBasename}>
        <Routes>
          {/* Halaman Landing Publik */}
          <Route path="/" element={<LandingPage />} />

          {/* Autentikasi SSO */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/sso/callback" element={<SsoCallbackPage />} />

          {/* Penolakan akses: tanpa izin masuk panel */}
          <Route path="/akses-ditolak" element={<AccessDeniedPage />} />

          {/* Panel dengan sidebar */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Profil Pengguna */}
          <Route
            path="/admin/profil"
            element={
              <ProtectedRoute>
                <ProfilPage />
              </ProtectedRoute>
            }
          />

          {/* Standar SPMI */}
          <Route
            path="/admin/standar"
            element={
              <ProtectedRoute izin={['standar:view']}>
                <StandarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/standar/tambah"
            element={
              <ProtectedRoute izin={['standar:create']}>
                <StandarFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/standar/edit/:id"
            element={
              <ProtectedRoute izin={['standar:update']}>
                <StandarFormPage />
              </ProtectedRoute>
            }
          />

          {/* Dokumen Mutu */}
          <Route
            path="/admin/dokumen"
            element={
              <ProtectedRoute izin={['dokumen:view']}>
                <DokumenPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dokumen/tambah"
            element={
              <ProtectedRoute izin={['dokumen:create']}>
                <DokumenFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dokumen/edit/:id"
            element={
              <ProtectedRoute izin={['dokumen:update']}>
                <DokumenFormPage />
              </ProtectedRoute>
            }
          />

          {/* Audit Mutu Internal (AMI) */}
          <Route
            path="/admin/ami"
            element={
              <ProtectedRoute izin={['audit:view']}>
                <AmiPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ami/tambah"
            element={
              <ProtectedRoute izin={['audit:create']}>
                <AmiFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ami/edit/:id"
            element={
              <ProtectedRoute izin={['audit:update']}>
                <AmiFormPage />
              </ProtectedRoute>
            }
          />

          {/* Manajemen Slider Hero Halaman Depan */}
          <Route
            path="/admin/slider"
            element={
              <ProtectedRoute izin={['standar:view', 'dokumen:view', 'audit:view']}>
                <ManajemenSliderLpm />
              </ProtectedRoute>
            }
          />

          {/* Manajemen Pengguna & Hak Akses (RBAC) */}
          <Route
            path="/admin/pengguna"
            element={
              <ProtectedRoute izin={['pengguna:view']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute izin={['pengguna:view']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/pengguna/tambah"
            element={
              <ProtectedRoute izin={['pengguna:create']}>
                <PenggunaFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/pengguna/edit/:id"
            element={
              <ProtectedRoute izin={['pengguna:update']}>
                <PenggunaFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/peran"
            element={
              <ProtectedRoute izin={['peran:view']}>
                <RolesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <ProtectedRoute izin={['peran:view']}>
                <RolesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/peran/tambah"
            element={
              <ProtectedRoute izin={['peran:create']}>
                <PeranFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/peran/edit/:id"
            element={
              <ProtectedRoute izin={['peran:update']}>
                <PeranFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/izin"
            element={
              <ProtectedRoute izin={['izin:view']}>
                <PermissionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/permissions"
            element={
              <ProtectedRoute izin={['izin:view']}>
                <PermissionsPage />
              </ProtectedRoute>
            }
          />
          {/* Kompatibilitas tautan lama: menu gabungan "Peran & Izin" sudah
              dipecah menjadi /admin/peran dan /admin/izin. */}
          <Route path="/admin/peran-izin" element={<Navigate to="/admin/peran" replace />} />
          <Route path="/admin/rbac" element={<Navigate to="/admin/peran" replace />} />

          {/* 403 fitur & 404 alamat tidak dikenal */}
          <Route path="/akses-ditolak-fitur" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
