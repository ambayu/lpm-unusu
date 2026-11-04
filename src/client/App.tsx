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
import { UsersPage } from './pages/Users';
import { RolesPage } from './pages/Roles';
import { PermissionsPage } from './pages/Permissions';
import { LoginPage } from './pages/Login';
import { SsoCallbackPage } from './pages/SsoCallback';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessDeniedPage } from './pages/AccessDenied';

/**
 * Penjaga rute panel admin.
 * - Belum login  -> /login
 * - Peran bukan milik aplikasi LPM (mis. ADMIN_LPPM) -> halaman Akses Ditolak
 * - Rute khusus admin & bukan Administrator LPM -> dialihkan ke dashboard
 */
function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: React.ReactElement;
  adminOnly?: boolean;
}) {
  const { user, loading, accessDenied, isAppAdmin } = useAuth();
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
  if (adminOnly && !isAppAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <SidebarLayout>{children}</SidebarLayout>;
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

          {/* Penolakan akses lintas aplikasi (mis. admin LPPM membuka panel LPM) */}
          <Route path="/akses-ditolak" element={<AccessDeniedPage />} />

          {/* Panel Manajemen Admin Ber-Sidebar */}
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

          {/* Standar SPMI */}
          <Route
            path="/admin/standar"
            element={
              <ProtectedRoute>
                <StandarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/standar/tambah"
            element={
              <ProtectedRoute>
                <StandarFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/standar/edit/:id"
            element={
              <ProtectedRoute>
                <StandarFormPage />
              </ProtectedRoute>
            }
          />

          {/* Dokumen Mutu */}
          <Route
            path="/admin/dokumen"
            element={
              <ProtectedRoute>
                <DokumenPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dokumen/tambah"
            element={
              <ProtectedRoute>
                <DokumenFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dokumen/edit/:id"
            element={
              <ProtectedRoute>
                <DokumenFormPage />
              </ProtectedRoute>
            }
          />

          {/* Audit Mutu Internal (AMI) */}
          <Route
            path="/admin/ami"
            element={
              <ProtectedRoute>
                <AmiPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ami/tambah"
            element={
              <ProtectedRoute>
                <AmiFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ami/edit/:id"
            element={
              <ProtectedRoute>
                <AmiFormPage />
              </ProtectedRoute>
            }
          />

          {/* Manajemen Pengguna & Hak Akses (RBAC) — khusus Administrator LPM */}
          <Route
            path="/admin/pengguna"
            element={
              <ProtectedRoute adminOnly>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute adminOnly>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/peran"
            element={
              <ProtectedRoute adminOnly>
                <RolesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <ProtectedRoute adminOnly>
                <RolesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/izin"
            element={
              <ProtectedRoute adminOnly>
                <PermissionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/permissions"
            element={
              <ProtectedRoute adminOnly>
                <PermissionsPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
