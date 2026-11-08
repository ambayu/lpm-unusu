import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AppAccessInfo, SessionUser, TingkatMasuk } from '../services/api';
import { KUNCI_IZIN_MASUK, LABEL_TINGKAT, fetchSession } from '../services/api';

interface AuthContextValue {
  user: SessionUser | null;
  /** Cakupan akses aplikasi hasil hitung server (null saat belum terverifikasi). */
  appAccess: AppAccessInfo | null;
  loading: boolean;
  /** true bila pengguna tidak memiliki izin masuk panel LPM. */
  accessDenied: boolean;
  /** Label tingkat akses yang siap tampil di UI. */
  roleLabel: string;
  /** Tingkat masuk efektif (admin / dosen / mahasiswa) berdasarkan izin. */
  tingkat: TingkatMasuk | null;
  /** true bila memiliki izin masuk tingkat administrator. */
  isAppAdmin: boolean;
  /** Seluruh kunci izin pengguna (izin masuk + izin fitur). */
  izin: string[];
  /**
   * Pemeriksa izin fitur. SELALU pakai ini untuk menentukan tampil/tidaknya
   * menu dan tombol — jangan pernah membandingkan `user.role`.
   */
  bisa: (...kunci: string[]) => boolean;
  saveSession: (token: string, user: SessionUser, appAccess?: AppAccessInfo) => void;
  refreshSession: () => Promise<void>;
  logout: () => void;
}

const TOKEN_KEY = 'lpm_unusu_token';
const USER_KEY = 'lpm_unusu_user';
const IZIN_KEY = 'lpm_unusu_izin';

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Cadangan bila server tidak dapat dihubungi.
 * Tanpa data izin dari server, akses DITOLAK (fail-closed) — konsisten dengan
 * prinsip server: tidak ada izin terbaca berarti tidak boleh masuk.
 */
function fallbackAppAccess(): AppAccessInfo {
  return {
    app: 'lpm-unusu',
    appName: 'LPM UNUSU',
    allowed: false,
    reason: 'no_izin_masuk',
    ssoRole: '',
    ssoRoleLabel: '',
    tingkat: null,
    roleLabel: 'Tanpa Izin Masuk',
    isAppAdmin: false,
    izin: [],
    message: 'Izin akses belum dapat diverifikasi. Periksa koneksi ke server LPM.',
  };
}

const bacaIzinCache = (): string[] => {
  try {
    const raw = localStorage.getItem(IZIN_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

const simpanIzinCache = (izin: string[]) => {
  localStorage.setItem(IZIN_KEY, JSON.stringify(izin));
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [appAccess, setAppAccess] = useState<AppAccessInfo | null>(null);
  const [izin, setIzin] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(IZIN_KEY);
    setUser(null);
    setAppAccess(null);
    setIzin([]);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }

      // Tampilkan sesi tersimpan lebih dulu agar UI tidak berkedip.
      const cachedUserRaw = localStorage.getItem(USER_KEY);
      const cachedUser: SessionUser | null = cachedUserRaw
        ? (() => {
            try {
              return JSON.parse(cachedUserRaw) as SessionUser;
            } catch {
              localStorage.removeItem(USER_KEY);
              return null;
            }
          })()
        : null;
      const cachedIzin = bacaIzinCache();

      if (cachedUser && !cancelled) {
        setUser(cachedUser);
        setIzin(cachedIzin);
      }

      try {
        // Server adalah sumber kebenaran: izin dihitung ulang dari database.
        const response = await fetchSession();
        if (cancelled) return;

        const freshUser = response.data?.user ?? cachedUser;
        const freshAccess = response.data?.appAccess ?? null;
        const freshIzin = response.data?.izin ?? [];

        setUser(freshUser);
        setAppAccess(freshAccess);
        setIzin(freshIzin);

        if (!freshAccess || freshAccess.allowed === false) {
          // Tidak punya izin masuk — jangan simpan kredensial panel.
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(IZIN_KEY);
        } else {
          if (freshUser) localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
          simpanIzinCache(freshIzin);
        }
      } catch (error: any) {
        if (cancelled) return;

        const status = error?.response?.status;
        const deniedAccess: AppAccessInfo | undefined = error?.response?.data?.appAccess;

        if (deniedAccess && deniedAccess.allowed === false) {
          setAppAccess(deniedAccess);
          setIzin([]);
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(IZIN_KEY);
        } else if (status === 401) {
          clearSession();
        } else {
          // Gagal jaringan: pakai izin tersimpan agar panel tetap bisa dibuka,
          // tetapi server tetap menolak operasi yang tidak diizinkan.
          setAppAccess((prev) => prev ?? { ...fallbackAppAccess(), allowed: cachedIzin.length > 0, izin: cachedIzin });
        }
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
    if (access) {
      setAppAccess(access);
      if (access.izin) {
        setIzin(access.izin);
        simpanIzinCache(access.izin);
      }
    }
  };

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetchSession();
      if (response.data?.success) {
        const access = response.data.appAccess;
        const freshIzin = response.data.izin ?? [];
        setUser(response.data.user);
        setAppAccess(access);
        setIzin(freshIzin);

        // Izin bisa dicabut kapan saja di portal ONE UNUSU. Bila server
        // menyatakan tidak lagi berhak masuk, kredensial lokal wajib dibuang.
        if (!access || access.allowed === false) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(IZIN_KEY);
        } else {
          simpanIzinCache(freshIzin);
        }
      }
    } catch (error: any) {
      const deniedAccess: AppAccessInfo | undefined = error?.response?.data?.appAccess;
      if (deniedAccess && deniedAccess.allowed === false) {
        setAppAccess(deniedAccess);
        setIzin([]);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(IZIN_KEY);
      }
      /* kegagalan jaringan diabaikan — izin terakhir tetap dipakai */
    }
  }, []);

  /**
   * Revalidasi izin saat tab kembali aktif.
   * Kasus nyata: admin LPM dicabut izin masuknya di portal, sesi lokalnya masih
   * tersimpan. Tanpa ini panel LPM tetap terbuka sampai halaman di-reload.
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

  /** Pemeriksa izin — semua harus dimiliki bila argumen lebih dari satu. */
  const bisa = useCallback((...kunci: string[]) => kunci.every((k) => izin.includes(k)), [izin]);

  const accessDenied = !!appAccess && appAccess.allowed === false;
  const tingkat: TingkatMasuk | null =
    appAccess?.tingkat ??
    (izin.includes(KUNCI_IZIN_MASUK.admin)
      ? 'admin'
      : izin.includes(KUNCI_IZIN_MASUK.dosen)
        ? 'dosen'
        : izin.includes(KUNCI_IZIN_MASUK.mahasiswa)
          ? 'mahasiswa'
          : null);
  const roleLabel = appAccess?.roleLabel || (tingkat ? LABEL_TINGKAT[tingkat] : 'Pengguna');
  const isAppAdmin = tingkat === 'admin';

  const value = useMemo(
    () => ({
      user,
      appAccess,
      loading,
      accessDenied,
      roleLabel,
      tingkat,
      isAppAdmin,
      izin,
      bisa,
      saveSession,
      refreshSession,
      logout,
    }),
    [user, appAccess, loading, accessDenied, roleLabel, tingkat, isAppAdmin, izin, bisa, refreshSession]
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
