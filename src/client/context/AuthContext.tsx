import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AppAccessInfo, SessionUser } from '../services/api';
import { FOREIGN_APP_ROLES, SSO_ROLE_LABEL, fetchSession, isLpmScopedRole } from '../services/api';

interface AuthContextValue {
  user: SessionUser | null;
  /** Cakupan akses aplikasi hasil hitung server (null saat belum terverifikasi). */
  appAccess: AppAccessInfo | null;
  loading: boolean;
  /** true bila peran pengguna bukan milik aplikasi LPM (mis. ADMIN_LPPM). */
  accessDenied: boolean;
  /** Label peran yang siap tampil di UI. */
  roleLabel: string;
  /** true hanya untuk Administrator LPM / Superadmin (bukan admin aplikasi lain). */
  isAppAdmin: boolean;
  saveSession: (token: string, user: SessionUser, appAccess?: AppAccessInfo) => void;
  refreshSession: () => Promise<void>;
  logout: () => void;
}

const TOKEN_KEY = 'lpm_unusu_token';
const USER_KEY = 'lpm_unusu_user';

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Cadangan cakupan akses bila server tidak dapat dihubungi.
 * Aturan tetap SAMA dengan server: hanya peran LPM yang diizinkan, dan peran
 * admin aplikasi lain selalu ditolak.
 */
function deriveAppAccess(user: SessionUser | null): AppAccessInfo | null {
  if (!user) return null;
  const ssoRole = (user.ssoRole || '').toUpperCase();
  const allowed = isLpmScopedRole(ssoRole);
  const isForeignAdmin = (FOREIGN_APP_ROLES as readonly string[]).includes(ssoRole);
  return {
    app: 'lpm-unusu',
    appName: 'LPM UNUSU',
    allowed,
    reason: allowed ? 'allowed' : isForeignAdmin ? 'foreign_app_admin' : 'role_not_allowed',
    ssoRole,
    role: user.role,
    roleLabel: SSO_ROLE_LABEL[ssoRole] || ssoRole || 'Tanpa Peran',
    isAppAdmin: ssoRole === 'ADMIN_LPM' || ssoRole === 'SUPERADMIN',
    foreignApp: null,
    message: allowed
      ? 'Selamat datang di panel LPM UNUSU.'
      : `Peran ${ssoRole || 'tidak dikenal'} bukan milik aplikasi LPM UNUSU.`,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [appAccess, setAppAccess] = useState<AppAccessInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setAppAccess(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const raw = localStorage.getItem(USER_KEY);

      if (!token || !raw) {
        if (!cancelled) setLoading(false);
        return;
      }

      let cachedUser: SessionUser | null = null;
      try {
        cachedUser = JSON.parse(raw) as SessionUser;
      } catch {
        localStorage.removeItem(USER_KEY);
      }

      // Tampilkan sesi tersimpan lebih dulu agar UI tidak berkedip.
      if (cachedUser && !cancelled) {
        setUser(cachedUser);
        setAppAccess(deriveAppAccess(cachedUser));
      }

      try {
        // Server adalah sumber kebenaran: peran & cakupan aplikasi dihitung ulang.
        const response = await fetchSession();
        if (cancelled) return;

        const freshUser = response.data?.user ?? cachedUser;
        const freshAccess = response.data?.appAccess ?? deriveAppAccess(freshUser);

        setUser(freshUser);
        setAppAccess(freshAccess);

        if (freshAccess && !freshAccess.allowed) {
          // Sesi milik aplikasi lain — jangan pernah dipakai di panel LPM.
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        } else if (freshUser) {
          localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
        }
      } catch (error: any) {
        if (cancelled) return;

        const deniedAccess: AppAccessInfo | undefined = error?.response?.data?.appAccess;
        if (deniedAccess && !deniedAccess.allowed) {
          setAppAccess(deniedAccess);
          clearSession();
          setUser(cachedUser);
          setAppAccess(deniedAccess);
        }
        // Selain 401/403 (mis. jaringan mati) biarkan sesi tersimpan dipakai
        // dengan cakupan hasil turunan lokal.
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const saveSession = (token: string, sessionUser: SessionUser, access?: AppAccessInfo) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    setAppAccess(access ?? deriveAppAccess(sessionUser));
  };

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetchSession();
      if (response.data?.success) {
        const access = response.data.appAccess;
        setUser(response.data.user);
        setAppAccess(access);

        // Peran bisa dicabut / dipindah ke aplikasi lain di portal. Bila server
        // menyatakan akses tidak lagi sah, kredensial lokal wajib dibuang.
        if (access && access.allowed === false) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      }
    } catch (error: any) {
      const deniedAccess: AppAccessInfo | undefined = error?.response?.data?.appAccess;
      if (deniedAccess && deniedAccess.allowed === false) {
        setAppAccess(deniedAccess);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
      /* kegagalan jaringan diabaikan — status akses terakhir tetap dipakai */
    }
  }, []);

  /**
   * Revalidasi cakupan aplikasi saat tab kembali aktif.
   * Kasus nyata: admin LPM dipindahkan menjadi admin LPPM di portal, sesi lokalnya
   * masih tersimpan. Tanpa ini panel LPM tetap terbuka sampai halaman di-reload.
   */
  useEffect(() => {
    const REVALIDATE_INTERVAL_MS = 60_000;
    let lastCheckedAt = 0;

    const revalidate = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      if (!localStorage.getItem(TOKEN_KEY)) return;

      const now = Date.now();
      if (now - lastCheckedAt < REVALIDATE_INTERVAL_MS) return;

      lastCheckedAt = now;
      void refreshSession();
    };

    document.addEventListener('visibilitychange', revalidate);
    window.addEventListener('focus', revalidate);

    return () => {
      document.removeEventListener('visibilitychange', revalidate);
      window.removeEventListener('focus', revalidate);
    };
  }, [refreshSession]);

  const logout = () => {
    clearSession();
  };

  const accessDenied = !!appAccess && appAccess.allowed === false;
  const roleLabel = appAccess?.roleLabel || SSO_ROLE_LABEL[user?.ssoRole || ''] || user?.role || 'Pengguna';
  const isAppAdmin = !!appAccess?.isAppAdmin;

  const value = useMemo(
    () => ({
      user,
      appAccess,
      loading,
      accessDenied,
      roleLabel,
      isAppAdmin,
      saveSession,
      refreshSession,
      logout,
    }),
    [user, appAccess, loading, accessDenied, roleLabel, isAppAdmin, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus dipakai di dalam AuthProvider');
  }
  return context;
}
