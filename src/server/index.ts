import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import jwt from "jsonwebtoken";
import { PrismaClient, Prisma } from "@prisma/client";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5004;

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

// Static files in production
const clientDistPath = path.resolve(process.cwd(), "dist/client");
app.use(express.static(clientDistPath));
app.use("/lpm", express.static(clientDistPath));

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", app: "LPM UNUSU API", time: new Date().toISOString() });
});

// ==========================================
// SSO ONE UNUSU — satu pintu, tanpa login lokal
// ==========================================
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL: JWT_SECRET belum diset di environment. Server dihentikan demi keamanan.");
  process.exit(1);
}
const SSO_BASE_URL = process.env.SSO_BASE_URL || "http://localhost:5000";
const SSO_CLIENT_ID = process.env.SSO_CLIENT_ID || "lpm-unusu";
const SSO_CLIENT_KEY = process.env.SSO_CLIENT_KEY || "";

interface SsoUserPayload {
  id: number;
  username: string;
  nama: string;
  email?: string | null;
  role: string;
  nim?: string | null;
  nidn?: string | null;
  fakultas?: string | null;
  prodi?: string | null;
}

interface SsoSession {
  id: number;
  username: string;
  nama: string;
  email: string | null;
  role: string;
  ssoRole: string;
  nim: string | null;
  nidn: string | null;
  prodi: string | null;
  fakultas: string | null;
}

interface AuthRequest extends Request {
  user?: SsoSession;
  /** Kunci izin pengguna — selalu dibaca dari database, bukan dari JWT. */
  izin?: Set<string>;
}

// ==========================================
// OTORISASI BERBASIS IZIN (BUKAN PERAN MENTAH)
//
// Sumber kebenaran: tabel lpm_roles / lpm_permissions / lpm_role_permissions
// dan lpm_users / lpm_user_roles di database LPM. Peran ONE UNUSU hanya
// dipakai untuk MENYEMAI izin; setelah itu yang menentukan adalah izin.
//
// Dua lapis yang diperiksa pada SETIAP permintaan:
//   1. Izin masuk  -> <clientId>:masuk_admin | masuk_dosen | masuk_mahasiswa
//   2. Izin fitur  -> <resource>:<action>, mis. standar:create
//
// Izin selalu dibaca dari database (bukan dari JWT), sehingga pencabutan izin
// berlaku seketika tanpa menunggu token kedaluwarsa.
// ==========================================

/** Kunci izin masuk panel LPM. */
const KUNCI_IZIN_MASUK = {
  admin: "lpm-unusu:masuk_admin",
  dosen: "lpm-unusu:masuk_dosen",
  mahasiswa: "lpm-unusu:masuk_mahasiswa",
} as const;

type TingkatMasuk = keyof typeof KUNCI_IZIN_MASUK;

/** Label tampilan untuk tingkat akses. */
const LABEL_TINGKAT: Record<TingkatMasuk, string> = {
  admin: "Administrator LPM",
  dosen: "Dosen / Auditor Mutu",
  mahasiswa: "Mahasiswa / Observer",
};

const SEMUA_KUNCI_IZIN_MASUK = Object.values(KUNCI_IZIN_MASUK);

/** Label peran ONE UNUSU untuk kebutuhan tampilan saja (bukan otorisasi). */
const ROLE_LABEL_SSO: Record<string, string> = {
  SUPERADMIN: "Superadmin Ekosistem",
  ADMIN_LPM: "Administrator LPM",
  ADMIN_LPPM: "Administrator LPPM",
  ADMIN_ESURAT: "Administrator E-Surat",
  ADMIN_SARPRAS: "Administrator Sarpras",
  ADMIN_AKREDITASI: "Administrator Akreditasi",
  ADMIN_LMS: "Administrator LMS",
  ADMIN_SSO: "Administrator ONE UNUSU",
  DOSEN: "Dosen / Auditor Mutu",
  MAHASISWA: "Mahasiswa / Observer",
};

/**
 * Ambil seluruh kunci izin milik seorang pengguna dari database LPM lokal.
 * Mendukung auto-provisioning jika pengguna baru login pertama kali dari SSO.
 */
const ambilIzinPengguna = async (
  userId: number,
  ssoRole: string,
  userInfo?: { username?: string; nama?: string; email?: string | null; ssoRoles?: string[] }
): Promise<{ izin: Set<string>; roles: string[]; userRecord?: any }> => {
  const hasil = new Set<string>();

  // Cari di tabel lpm_users
  let user = await prisma.lpmUser.findFirst({
    where: {
      OR: [
        { userId },
        ...(userInfo?.username ? [{ username: userInfo.username }] : []),
      ],
    },
    include: {
      peran: {
        include: {
          role: {
            include: {
              izin: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Jika belum ada di lpm_users, lakukan auto-provisioning peran default
  if (!user && userInfo?.username) {
    const ssoRoles = userInfo.ssoRoles ?? (ssoRole ? [ssoRole] : []);
    let targetRoleKode = "dosen";
    if (ssoRoles.includes("SUPERADMIN") || ssoRoles.includes("ADMIN_LPM")) {
      targetRoleKode = "admin";
    } else if (ssoRoles.includes("MAHASISWA")) {
      targetRoleKode = "mahasiswa";
    }

    const defaultRole = await prisma.lpmRole.findUnique({
      where: { kode: targetRoleKode },
    });

    if (defaultRole) {
      user = await prisma.lpmUser.create({
        data: {
          userId,
          username: userInfo.username,
          nama: userInfo.nama || userInfo.username,
          email: userInfo.email || null,
          ssoRole: ssoRole ? String(ssoRole).toUpperCase() : null,
          status: "Aktif",
          peran: {
            create: [{ roleId: defaultRole.id }],
          },
        },
        include: {
          peran: {
            include: {
              role: {
                include: {
                  izin: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    }
  }

  const roleKodes: string[] = [];
  if (user) {
    for (const ur of user.peran) {
      roleKodes.push(ur.role.kode);
      for (const rp of ur.role.izin) {
        hasil.add(rp.permission.kunci);
      }
    }
  }

  return { izin: hasil, roles: roleKodes, userRecord: user };
};

/** Tingkat masuk tertinggi yang dimiliki pengguna (null = tidak boleh masuk). */
const tingkatMasukDari = (izin: Set<string>): TingkatMasuk | null => {
  if (izin.has(KUNCI_IZIN_MASUK.admin)) return "admin";
  if (izin.has(KUNCI_IZIN_MASUK.dosen)) return "dosen";
  if (izin.has(KUNCI_IZIN_MASUK.mahasiswa)) return "mahasiswa";
  return null;
};

export type AppAccessReason =
  | "allowed"
  | "no_izin_masuk"
  | "foreign_app_admin"
  | "missing_role";

export interface AppAccessDecision {
  app: string;
  appName: string;
  allowed: boolean;
  reason: AppAccessReason;
  ssoRole: string;
  ssoRoleLabel: string;
  tingkat: TingkatMasuk | null;
  roleLabel: string;
  isAppAdmin: boolean;
  izin: string[];
  message: string;
}

const APP_CODE = "lpm-unusu";
const APP_NAME = "LPM UNUSU";

/** Peran admin aplikasi LAIN — hanya untuk pesan penolakan yang informatif. */
const FOREIGN_APP_ADMIN_ROLES: Record<string, string> = {
  ADMIN_LPPM: "LPPM UNUSU",
  ADMIN_ESURAT: "E-Surat UNUSU",
  ADMIN_SARPRAS: "Sarpras UNUSU",
  ADMIN_AKREDITASI: "Akreditasi UNUSU",
  ADMIN_LMS: "LMS UNUSU",
  ADMIN_SSO: "ONE UNUSU Gateway",
};

/**
 * Putusan akses aplikasi — murni berdasarkan IZIN, bukan nama peran.
 * Parameter `izin` berasal dari database (lihat ambilIzinPengguna).
 */
const putuskanAkses = (params: {
  ssoRole: string;
  izin: Set<string>;
}): AppAccessDecision => {
  const ssoRole = (params.ssoRole || "").toUpperCase();
  const tingkat = tingkatMasukDari(params.izin);
  const dasar = {
    app: APP_CODE,
    appName: APP_NAME,
    ssoRole,
    ssoRoleLabel: ROLE_LABEL_SSO[ssoRole] ?? ssoRole ?? "Tanpa Peran",
    tingkat,
    roleLabel: tingkat ? LABEL_TINGKAT[tingkat] : "Tanpa Izin Masuk",
    isAppAdmin: tingkat === "admin",
    izin: Array.from(params.izin),
  };

  if (tingkat) {
    return {
      ...dasar,
      allowed: true,
      reason: "allowed",
      message: `Selamat datang di panel ${APP_NAME}.`,
    };
  }

  const namaAplikasiLain = FOREIGN_APP_ADMIN_ROLES[ssoRole];
  if (namaAplikasiLain) {
    return {
      ...dasar,
      allowed: false,
      reason: "foreign_app_admin",
      message: `Akun Anda terdaftar sebagai ${ROLE_LABEL_SSO[ssoRole] ?? ssoRole} (${namaAplikasiLain}), sehingga tidak memiliki izin masuk panel ${APP_NAME}. Silakan hubungi Superadmin ONE UNUSU bila penugasan izin perlu diubah.`,
    };
  }

  return {
    ...dasar,
    allowed: false,
    reason: ssoRole ? "no_izin_masuk" : "missing_role",
    message: ssoRole
      ? `Peran ${ssoRole} belum memiliki izin masuk panel ${APP_NAME}. Minta Superadmin ONE UNUSU memberikan izin masuk yang sesuai.`
      : "Token SSO tidak memuat peran. Silakan login ulang melalui Portal ONE UNUSU.",
  };
};

/** Versi sinkron untuk pengecekan cepat di endpoint (izin sudah diambil). */
const punyaIzin = (req: Request, kunci: string): boolean => {
  const izin = (req as AuthRequest).izin;
  return !!izin && izin.has(kunci);
};

/**
 * Jejak audit penolakan akses lintas aplikasi.
 * Disimpan in-memory (maksimal 100 entri terakhir) agar administrator LPM dapat
 * menelusuri percobaan masuk dari peran aplikasi lain tanpa membuka log server.
 */
interface AccessDenialEntry {
  id: string;
  at: string;
  source: "sso_exchange" | "api_request";
  ssoRole: string;
  reason: AppAccessReason;
  username: string;
  nama: string;
  foreignApp: string | null;
  path: string;
  ip: string;
}

const accessDenials: AccessDenialEntry[] = [];
const MAX_ACCESS_DENIALS = 100;

const recordAccessDenial = (entry: Omit<AccessDenialEntry, "id" | "at">) => {
  accessDenials.unshift({
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
  });
  if (accessDenials.length > MAX_ACCESS_DENIALS) {
    accessDenials.length = MAX_ACCESS_DENIALS;
  }
};

const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header && header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "Token otentikasi tidak disediakan" });
  }

  let decoded: jwt.JwtPayload;
  try {
    decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
  } catch {
    return res.status(401).json({ success: false, message: "Sesi login telah kedaluwarsa" });
  }

  try {
    const ssoRole = String(decoded.ssoRole ?? "");
    const userId = Number(decoded.id);

    // Izin dibaca ulang dari database pada setiap permintaan sehingga
    // pencabutan izin oleh administrator berlaku seketika.
    const resAkses = await ambilIzinPengguna(userId, ssoRole, {
      username: typeof decoded.username === "string" ? decoded.username : undefined,
      nama: typeof decoded.nama === "string" ? decoded.nama : undefined,
    });
    const izin = resAkses.izin;
    const akses = putuskanAkses({ ssoRole, izin });

    // Penjaga izin masuk: tanpa izin masuk, seluruh API panel ditolak.
    if (!akses.allowed) {
      recordAccessDenial({
        source: "api_request",
        ssoRole: akses.ssoRole,
        reason: akses.reason,
        username: String(decoded.username ?? ""),
        nama: String(decoded.nama ?? ""),
        foreignApp: FOREIGN_APP_ADMIN_ROLES[akses.ssoRole] ?? null,
        path: req.originalUrl,
        ip: req.ip ?? "",
      });
      return res.status(403).json({
        success: false,
        code: akses.reason === "foreign_app_admin" ? "FOREIGN_APP_ADMIN" : "IZIN_MASUK_DITOLAK",
        message: akses.message,
        appAccess: akses,
      });
    }

    (req as AuthRequest).izin = izin;
    (req as AuthRequest).user = {
      id: userId,
      username: String(decoded.username ?? ""),
      nama: String(decoded.nama ?? ""),
      email: typeof decoded.email === "string" ? decoded.email : null,
      role: akses.tingkat ?? "mahasiswa",
      ssoRole,
      nim: typeof decoded.nim === "string" ? decoded.nim : null,
      nidn: typeof decoded.nidn === "string" ? decoded.nidn : null,
      prodi: typeof decoded.prodi === "string" ? decoded.prodi : null,
      fakultas: typeof decoded.fakultas === "string" ? decoded.fakultas : null,
    };
    next();
  } catch (error: any) {
    console.error("Gagal memuat izin pengguna:", error?.message);
    return res.status(500).json({ success: false, message: "Gagal memverifikasi izin akses" });
  }
};

// Verifikasi token SSO sekali-pakai lalu terbitkan sesi lokal
app.post("/api/auth/sso", async (req: Request, res: Response) => {
  try {
    const { client_id, token } = req.body ?? {};

    if (!client_id || !token) {
      return res.status(400).json({ success: false, message: "client_id dan token wajib diisi" });
    }
    if (client_id !== SSO_CLIENT_ID) {
      return res.status(400).json({ success: false, message: "Client ID tidak cocok dengan aplikasi ini" });
    }
    if (!SSO_CLIENT_KEY) {
      return res.status(500).json({ success: false, message: "SSO_CLIENT_KEY belum dikonfigurasi di server" });
    }

    const ssoResponse = await fetch(`${SSO_BASE_URL}/api/v2/website/verify-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: SSO_CLIENT_ID, client_key: SSO_CLIENT_KEY, token }),
    });

    const ssoPayload = (await ssoResponse.json().catch(() => null)) as
      | { status?: boolean; message?: string; data?: { user?: SsoUserPayload } }
      | null;
    const ssoUser = ssoPayload?.data?.user;

    if (!ssoResponse.ok || !ssoPayload?.status || !ssoUser) {
      return res.status(401).json({ success: false, message: ssoPayload?.message || "Verifikasi token SSO gagal" });
    }

    // Ambil izin dan peran lokal LPM pengguna dari database lokal
    const ssoRoles = Array.isArray((ssoUser as any).roles)
      ? (ssoUser as any).roles
      : ssoUser.role
      ? [ssoUser.role]
      : [];

    const resAkses = await ambilIzinPengguna(ssoUser.id, ssoUser.role, {
      username: ssoUser.username,
      nama: ssoUser.nama,
      email: ssoUser.email,
      ssoRoles,
    });
    const izinSso = resAkses.izin;
    const akses = putuskanAkses({ ssoRole: ssoUser.role, izin: izinSso });
    if (!akses.allowed) {
      recordAccessDenial({
        source: "sso_exchange",
        ssoRole: akses.ssoRole,
        reason: akses.reason,
        username: ssoUser.username ?? "",
        nama: ssoUser.nama ?? "",
        foreignApp: FOREIGN_APP_ADMIN_ROLES[akses.ssoRole] ?? null,
        path: "/api/auth/sso",
        ip: req.ip ?? "",
      });
      return res.status(403).json({
        success: false,
        code: akses.reason === "foreign_app_admin" ? "FOREIGN_APP_ADMIN" : "IZIN_MASUK_DITOLAK",
        message: akses.message,
        appAccess: akses,
      });
    }

    const sessionUser: SsoSession = {
      id: ssoUser.id,
      username: ssoUser.username,
      nama: ssoUser.nama,
      email: ssoUser.email ?? null,
      role: akses.tingkat ?? "mahasiswa",
      ssoRole: ssoUser.role,
      nim: ssoUser.nim ?? null,
      nidn: ssoUser.nidn ?? null,
      prodi: ssoUser.prodi ?? null,
      fakultas: ssoUser.fakultas ?? null,
    };

    const tokenJwt = jwt.sign({ ...sessionUser, appCode: APP_CODE }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ success: true, token: tokenJwt, user: sessionUser, appAccess: akses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal memproses SSO: " + error?.message });
  }
});

// Seluruh API di bawah ini wajib membawa JWT sesi lokal (hasil SSO).
app.use("/api", authenticate);

/**
 * Middleware otorisasi berbasis IZIN.
 * `requirePermission("standar:create")` menolak permintaan yang tidak memuat
 * kunci izin tersebut — tidak pernah memeriksa nama peran.
 */
const requirePermission = (...kunci: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const izin = (req as AuthRequest).izin;
    if (!izin) {
      return res.status(401).json({ success: false, message: "Sesi tidak valid" });
    }
    const kurang = kunci.filter((k) => !izin.has(k));
    if (kurang.length > 0) {
      return res.status(403).json({
        success: false,
        code: "IZIN_KURANG",
        message: "Akses ditolak. Anda tidak memiliki izin untuk operasi ini.",
        dibutuhkan: kurang,
      });
    }
    next();
  };

/** Wajib memiliki izin masuk tingkat administrator (izin, bukan nama peran). */
const requireIzinMasukAdmin = requirePermission(KUNCI_IZIN_MASUK.admin);

// 0a. Jejak penolakan akses lintas aplikasi (butuh izin keamanan:view)
app.get("/api/security/access-denials", requirePermission("keamanan:view"), (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 25, MAX_ACCESS_DENIALS);
  const foreignAdmin = accessDenials.filter((d) => d.reason === "foreign_app_admin").length;

  res.json({
    success: true,
    app: APP_CODE,
    data: accessDenials.slice(0, limit),
    total: accessDenials.length,
    summary: {
      foreignAdmin,
      other: accessDenials.length - foreignAdmin,
    },
  });
});

// 0. Sesi & cakupan aplikasi (dipakai klien untuk memvalidasi ulang localStorage)
app.get("/api/auth/me", (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const izin = (req as AuthRequest).izin ?? new Set<string>();
  const akses = putuskanAkses({ ssoRole: user.ssoRole, izin });
  res.json({ success: true, user, appAccess: akses, izin: Array.from(izin) });
});

/** Daftar tingkat masuk & izin yang dikenali aplikasi ini (untuk matriks izin). */
app.get("/api/auth/app-roles", async (req: Request, res: Response) => {
  const semuaIzin = await prisma.lpmPermission.findMany({ orderBy: [{ grup: "asc" }, { kunci: "asc" }] });
  const kemapuan = (req as AuthRequest).izin ?? new Set<string>();
  res.json({
    success: true,
    app: APP_CODE,
    appName: APP_NAME,
    tingkatMasuk: Object.entries(KUNCI_IZIN_MASUK).map(([tingkat, kunci]) => ({
      tingkat,
      kunci,
      label: LABEL_TINGKAT[tingkat as TingkatMasuk],
    })),
    izinMasukDimiliki: SEMUA_KUNCI_IZIN_MASUK.filter((k) => kemapuan.has(k)),
    izin: semuaIzin.map((i) => ({ kunci: i.kunci, nama: i.nama, grup: i.grup })),
  });
});

// ---------------------------------------------------------------------------
// Utilitas paginasi opsional.
// Tanpa ?page, endpoint tetap mengembalikan seluruh baris (backward compatible
// dengan klien lama). Dengan ?page, server membatasi payload sehingga index
// (createdAt/hasil/kategori) benar-benar terpakai dan respons tidak membengkak.
// ---------------------------------------------------------------------------
const MAX_PAGE_LIMIT = 100;

const parsePagination = (req: Request) => {
  const rawPage = Number(req.query.page);
  const rawLimit = Number(req.query.limit);
  const paginated = Number.isFinite(rawPage) && rawPage > 0;
  const limit = Math.min(
    Math.max(Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : 25, 1),
    MAX_PAGE_LIMIT,
  );
  const page = paginated ? Math.floor(rawPage) : 1;
  return { paginated, page, limit, skip: (page - 1) * limit, take: limit };
};

/** Parse angka query opsional; mengembalikan undefined bila kosong/tidak valid. */
const parseOptionalInt = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
};

// 1. Standar SPMI
app.get("/api/standar", requirePermission("standar:view"), async (req: Request, res: Response) => {
  try {
    // Filter opsional — tiap filter dipetakan ke index yang sesuai:
    //   kategori            -> lpm_standar_spmi_kategori_tahun_idx
    //   tahun               -> lpm_standar_spmi_kategori_tahun_idx / tahun_idx
    //   q (kode/nama)       -> lpm_standar_spmi_kode_key / nama_idx
    const { kategori, tahun, q } = req.query as Record<string, string | undefined>;
    const where: Prisma.StandarSpmiWhereInput = {
      ...(kategori ? { kategori } : {}),
      ...(tahun && Number.isFinite(Number(tahun)) ? { tahun: Number(tahun) } : {}),
      ...(q
        ? {
            OR: [
              { kode: { contains: q } },
              { nama: { contains: q } },
            ],
          }
        : {}),
    };

    const { paginated, page, limit, skip, take } = parsePagination(req);

    const [list, total] = await Promise.all([
      prisma.standarSpmi.findMany({
        where,
        include: { dokumenList: true },
        orderBy: { kode: "asc" },
        ...(paginated ? { skip, take } : {}),
      }),
      paginated ? prisma.standarSpmi.count({ where }) : Promise.resolve(0),
    ]);

    res.json({
      success: true,
      data: list,
      ...(paginated ? { meta: { page, limit, total, totalPages: Math.ceil(total / limit) } } : {}),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil standar SPMI" });
  }
});

app.post("/api/standar", requirePermission("standar:create"), async (req: Request, res: Response) => {
  try {
    const { kode, nama, kategori, pernyataan, indikator, target, tahun, author } = req.body;
    if (!kode || !nama || !kategori || !pernyataan) {
      return res.status(400).json({ success: false, message: "Kode, nama, kategori, dan pernyataan wajib diisi" });
    }
    const created = await prisma.standarSpmi.create({
      data: {
        kode,
        nama,
        kategori,
        pernyataan,
        indikator,
        target,
        tahun: Number(tahun) || 2026,
        ...(author && { author }),
      },
    });
    res.json({ success: true, data: created, message: "Standar SPMI berhasil ditambahkan" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Gagal menambah standar SPMI" });
  }
});

app.get("/api/standar/:id", requirePermission("standar:view"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await prisma.standarSpmi.findUnique({
      where: { id: Number(id) },
    });
    if (!item) {
      return res.status(404).json({ success: false, message: "Standar SPMI tidak ditemukan" });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data standar SPMI" });
  }
});

app.put("/api/standar/:id", requirePermission("standar:update"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { kode, nama, kategori, pernyataan, indikator, target, tahun, author } = req.body;
    const updated = await prisma.standarSpmi.update({
      where: { id: Number(id) },
      data: {
        ...(kode && { kode }),
        ...(nama && { nama }),
        ...(kategori && { kategori }),
        ...(pernyataan && { pernyataan }),
        indikator: indikator !== undefined ? indikator : undefined,
        target: target !== undefined ? target : undefined,
        ...(tahun && { tahun: Number(tahun) }),
        ...(author && { author }),
      },
    });
    res.json({ success: true, data: updated, message: "Standar SPMI berhasil diperbarui" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Gagal memperbarui standar SPMI" });
  }
});

app.delete("/api/standar/:id", requirePermission("standar:delete"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.standarSpmi.delete({
      where: { id: Number(id) },
    });
    res.json({ success: true, message: "Standar SPMI berhasil dihapus" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Gagal menghapus standar SPMI" });
  }
});

// 2. Dokumen Mutu / SOP
app.get("/api/dokumen-mutu", requirePermission("dokumen:view"), async (req: Request, res: Response) => {
  try {
    // Filter opsional — dipetakan ke index:
    //   jenis            -> lpm_dokumen_mutu_jenis_tahun_idx
    //   tahun            -> lpm_dokumen_mutu_jenis_tahun_idx / tahun_idx
    //   standarId        -> lpm_dokumen_mutu_standarId_jenis_idx
    //   orderBy createdAt-> lpm_dokumen_mutu_createdAt_idx (DESC)
    const { jenis, tahun, standarId, q } = req.query as Record<string, string | undefined>;
    const where: Prisma.DokumenMutuWhereInput = {
      ...(jenis ? { jenis } : {}),
      ...(parseOptionalInt(tahun) !== undefined ? { tahun: parseOptionalInt(tahun) } : {}),
      ...(parseOptionalInt(standarId) !== undefined ? { standarId: parseOptionalInt(standarId) } : {}),
      ...(q
        ? {
            OR: [
              { kodeDokumen: { contains: q } },
              { judul: { contains: q } },
            ],
          }
        : {}),
    };

    const { paginated, page, limit, skip, take } = parsePagination(req);

    const [docs, total] = await Promise.all([
      prisma.dokumenMutu.findMany({
        where,
        include: { standar: true },
        orderBy: { createdAt: "desc" },
        ...(paginated ? { skip, take } : {}),
      }),
      paginated ? prisma.dokumenMutu.count({ where }) : Promise.resolve(0),
    ]);

    res.json({
      success: true,
      data: docs,
      ...(paginated ? { meta: { page, limit, total, totalPages: Math.ceil(total / limit) } } : {}),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil dokumen mutu" });
  }
});

app.post("/api/dokumen-mutu", requirePermission("dokumen:create"), async (req: Request, res: Response) => {
  try {
    const { standarId, kodeDokumen, judul, jenis, revisi, filePath, tahun, author } = req.body;
    if (!kodeDokumen || !judul) {
      return res.status(400).json({ success: false, message: "Kode dokumen dan judul wajib diisi" });
    }
    const created = await prisma.dokumenMutu.create({
      data: {
        standarId: standarId ? Number(standarId) : null,
        kodeDokumen,
        judul,
        jenis: jenis || "Standar",
        revisi: Number(revisi) || 0,
        filePath,
        tahun: Number(tahun) || 2026,
        ...(author && { author }),
      },
      include: { standar: true },
    });
    res.json({ success: true, data: created, message: "Dokumen mutu berhasil didaftarkan" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Gagal menambah dokumen mutu" });
  }
});

app.get("/api/dokumen-mutu/:id", requirePermission("dokumen:view"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await prisma.dokumenMutu.findUnique({
      where: { id: Number(id) },
      include: { standar: true },
    });
    if (!doc) {
      return res.status(404).json({ success: false, message: "Dokumen mutu tidak ditemukan" });
    }
    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil detail dokumen mutu" });
  }
});

app.put("/api/dokumen-mutu/:id", requirePermission("dokumen:update"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { standarId, kodeDokumen, judul, jenis, revisi, filePath, tahun, author } = req.body;
    const updated = await prisma.dokumenMutu.update({
      where: { id: Number(id) },
      data: {
        standarId: standarId !== undefined ? (standarId ? Number(standarId) : null) : undefined,
        ...(kodeDokumen && { kodeDokumen }),
        ...(judul && { judul }),
        ...(jenis && { jenis }),
        revisi: revisi !== undefined ? Number(revisi) : undefined,
        filePath: filePath !== undefined ? filePath : undefined,
        ...(tahun && { tahun: Number(tahun) }),
        ...(author && { author }),
      },
      include: { standar: true },
    });
    res.json({ success: true, data: updated, message: "Dokumen mutu berhasil diperbarui" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Gagal memperbarui dokumen mutu" });
  }
});

app.delete("/api/dokumen-mutu/:id", requirePermission("dokumen:delete"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.dokumenMutu.delete({
      where: { id: Number(id) },
    });
    res.json({ success: true, message: "Dokumen mutu berhasil dihapus" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Gagal menghapus dokumen mutu" });
  }
});

// 3. Periode & Audit AMI
// Daftar periode AMI untuk dropdown input audit.
// Index terkait: lpm_periode_ami_tahun_status_idx, lpm_periode_ami_status_idx
app.get("/api/periode-ami", async (req: Request, res: Response) => {
  try {
    const { status, tahun } = req.query as Record<string, string | undefined>;
    const where: Prisma.PeriodeAmiWhereInput = {
      ...(status ? { status } : {}),
      ...(parseOptionalInt(tahun) !== undefined ? { tahun: parseOptionalInt(tahun) } : {}),
    };

    const data = await prisma.periodeAmi.findMany({
      where,
      orderBy: [{ tahun: "desc" }, { id: "desc" }],
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil periode AMI" });
  }
});

app.get("/api/audit", requirePermission("audit:view"), async (req: Request, res: Response) => {
  try {
    // Filter opsional — dipetakan ke index:
    //   periodeId        -> lpm_audit_butir_periodeId_hasil_idx
    //   standarId        -> lpm_audit_butir_standarId_hasil_idx
    //   hasil            -> lpm_audit_butir_hasil_idx
    //   auditee          -> lpm_audit_butir_auditee_idx
    //   orderBy createdAt-> lpm_audit_butir_createdAt_idx (DESC)
    const { periodeId, standarId, hasil, auditee } = req.query as Record<string, string | undefined>;
    const where: Prisma.AuditButirWhereInput = {
      ...(parseOptionalInt(periodeId) !== undefined ? { periodeId: parseOptionalInt(periodeId) } : {}),
      ...(parseOptionalInt(standarId) !== undefined ? { standarId: parseOptionalInt(standarId) } : {}),
      ...(hasil ? { hasil } : {}),
      ...(auditee ? { auditee: { contains: auditee } } : {}),
    };

    const { paginated, page, limit, skip, take } = parsePagination(req);

    const [audits, total] = await Promise.all([
      prisma.auditButir.findMany({
        where,
        include: {
          periode: true,
          standar: true,
        },
        orderBy: { createdAt: "desc" },
        ...(paginated ? { skip, take } : {}),
      }),
      paginated ? prisma.auditButir.count({ where }) : Promise.resolve(0),
    ]);

    res.json({
      success: true,
      data: audits,
      ...(paginated ? { meta: { page, limit, total, totalPages: Math.ceil(total / limit) } } : {}),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data audit AMI" });
  }
});

// 3b. Rekap matriks AMI: hitung temuan per periode/standar langsung di database
// (GROUP BY) alih-alih menarik seluruh baris ke memori aplikasi.
app.get("/api/audit/rekap", requirePermission("audit:view"), async (req: Request, res: Response) => {
  try {
    const { periodeId } = req.query as Record<string, string | undefined>;
    const periode = parseOptionalInt(periodeId);

    const [perHasil, perStandar] = await Promise.all([
      prisma.auditButir.groupBy({
        by: ["hasil"],
        where: periode !== undefined ? { periodeId: periode } : undefined,
        _count: { _all: true },
      }),
      prisma.auditButir.groupBy({
        by: ["standarId", "hasil"],
        where: periode !== undefined ? { periodeId: periode } : undefined,
        _count: { _all: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        periodeId: periode ?? null,
        perHasil: perHasil.map((row) => ({ hasil: row.hasil, jumlah: row._count._all })),
        perStandar: perStandar.map((row) => ({
          standarId: row.standarId,
          hasil: row.hasil,
          jumlah: row._count._all,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil rekap audit AMI" });
  }
});

app.post("/api/audit", requirePermission("audit:create"), async (req: Request, res: Response) => {
  try {
    const { periodeId, standarId, auditee, auditor, hasil, deskripsi, rekomendasi, author } = req.body;

    // Validasi referensi lebih awal (memakai index PK) supaya pelanggaran FK
    // tidak muncul sebagai error 500 yang tidak informatif.
    const idPeriode = parseOptionalInt(periodeId);
    const idStandar = parseOptionalInt(standarId);
    if (idPeriode === undefined || idStandar === undefined) {
      return res.status(400).json({ success: false, message: "Periode AMI dan Standar SPMI wajib dipilih" });
    }
    if (!auditee || !auditor) {
      return res.status(400).json({ success: false, message: "Auditee dan auditor wajib diisi" });
    }

    const [periodeAda, standarAda] = await Promise.all([
      prisma.periodeAmi.count({ where: { id: idPeriode } }),
      prisma.standarSpmi.count({ where: { id: idStandar } }),
    ]);
    if (!periodeAda) {
      return res.status(400).json({ success: false, message: "Periode AMI tidak ditemukan" });
    }
    if (!standarAda) {
      return res.status(400).json({ success: false, message: "Standar SPMI tidak ditemukan" });
    }

    const newAudit = await prisma.auditButir.create({
      data: {
        periodeId: idPeriode,
        standarId: idStandar,
        auditee,
        auditor,
        hasil: hasil || "Sesuai",
        deskripsi,
        rekomendasi,
        ...(author && { author }),
      }
    });
    res.json({ success: true, data: newAudit, message: "Hasil audit AMI berhasil disimpan" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menambah data audit" });
  }
});

app.get("/api/audit/:id", requirePermission("audit:view"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await prisma.auditButir.findUnique({
      where: { id: Number(id) },
      include: {
        periode: true,
        standar: true,
      },
    });
    if (!item) {
      return res.status(404).json({ success: false, message: "Catatan audit AMI tidak ditemukan" });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil detail audit AMI" });
  }
});

app.put("/api/audit/:id", requirePermission("audit:update"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { periodeId, standarId, auditee, auditor, hasil, deskripsi, rekomendasi, author } = req.body;
    const updated = await prisma.auditButir.update({
      where: { id: Number(id) },
      data: {
        ...(periodeId && { periodeId: Number(periodeId) }),
        ...(standarId && { standarId: Number(standarId) }),
        ...(auditee && { auditee }),
        ...(auditor && { auditor }),
        ...(hasil && { hasil }),
        deskripsi: deskripsi !== undefined ? deskripsi : undefined,
        rekomendasi: rekomendasi !== undefined ? rekomendasi : undefined,
        ...(author && { author }),
      },
      include: {
        periode: true,
        standar: true,
      },
    });
    res.json({ success: true, data: updated, message: "Temuan audit AMI berhasil diperbarui" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Gagal memperbarui catatan audit AMI" });
  }
});

app.delete("/api/audit/:id", requirePermission("audit:delete"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.auditButir.delete({
      where: { id: Number(id) },
    });
    res.json({ success: true, message: "Catatan audit AMI berhasil dihapus" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Gagal menghapus catatan audit AMI" });
  }
});

// ==========================================
// 3c. Indikator & Target Capaian Mutu (modul PPEPP)
// ==========================================
// Index terkait: lpm_indikator_spmi_standarId_kode_key (unique),
//                lpm_indikator_spmi_standarId_tahun_idx,
//                lpm_indikator_spmi_tahun_status_idx
app.get("/api/indikator", requirePermission("indikator:view"), async (req: Request, res: Response) => {
  try {
    const { standarId, tahun, status } = req.query as Record<string, string | undefined>;
    const where: Prisma.IndikatorSpmiWhereInput = {
      ...(parseOptionalInt(standarId) !== undefined ? { standarId: parseOptionalInt(standarId) } : {}),
      ...(parseOptionalInt(tahun) !== undefined ? { tahun: parseOptionalInt(tahun) } : {}),
      ...(status ? { status } : {}),
    };

    const { paginated, page, limit, skip, take } = parsePagination(req);

    const [data, total] = await Promise.all([
      prisma.indikatorSpmi.findMany({
        where,
        include: { standar: { select: { id: true, kode: true, nama: true, kategori: true } } },
        orderBy: [{ standarId: "asc" }, { kode: "asc" }],
        ...(paginated ? { skip, take } : {}),
      }),
      paginated ? prisma.indikatorSpmi.count({ where }) : Promise.resolve(0),
    ]);

    res.json({
      success: true,
      data,
      ...(paginated ? { meta: { page, limit, total, totalPages: Math.ceil(total / limit) } } : {}),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil indikator SPMI" });
  }
});

app.post("/api/indikator", requirePermission("indikator:create"), async (req: Request, res: Response) => {
  try {
    const { standarId, kode, nama, satuan, target, capaian, tahun, status, catatan, author } = req.body;
    const idStandar = parseOptionalInt(standarId);
    if (idStandar === undefined || !kode || !nama) {
      return res.status(400).json({ success: false, message: "Standar, kode, dan nama indikator wajib diisi" });
    }

    const standarAda = await prisma.standarSpmi.count({ where: { id: idStandar } });
    if (!standarAda) {
      return res.status(400).json({ success: false, message: "Standar SPMI tidak ditemukan" });
    }

    const created = await prisma.indikatorSpmi.create({
      data: {
        standarId: idStandar,
        kode,
        nama,
        satuan: satuan || null,
        target: target !== undefined && target !== "" ? Number(target) : null,
        capaian: capaian !== undefined && capaian !== "" ? Number(capaian) : null,
        tahun: parseOptionalInt(tahun) ?? 2026,
        status: status || "Belum Dinilai",
        catatan: catatan || null,
        ...(author && { author }),
      },
    });
    res.json({ success: true, data: created, message: "Indikator berhasil ditambahkan" });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({ success: false, message: "Kode indikator sudah dipakai pada standar ini" });
    }
    res.status(500).json({ success: false, message: error?.message || "Gagal menambah indikator" });
  }
});

app.put("/api/indikator/:id", requirePermission("indikator:update"), async (req: Request, res: Response) => {
  try {
    const id = parseOptionalInt(req.params.id);
    if (id === undefined) {
      return res.status(400).json({ success: false, message: "ID indikator tidak valid" });
    }
    const { nama, satuan, target, capaian, tahun, status, catatan } = req.body;

    const updated = await prisma.indikatorSpmi.update({
      where: { id },
      data: {
        ...(nama && { nama }),
        satuan: satuan !== undefined ? satuan : undefined,
        target: target !== undefined ? (target === "" || target === null ? null : Number(target)) : undefined,
        capaian: capaian !== undefined ? (capaian === "" || capaian === null ? null : Number(capaian)) : undefined,
        ...(parseOptionalInt(tahun) !== undefined && { tahun: parseOptionalInt(tahun) }),
        ...(status && { status }),
        catatan: catatan !== undefined ? catatan : undefined,
      },
    });
    res.json({ success: true, data: updated, message: "Indikator berhasil diperbarui" });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return res.status(404).json({ success: false, message: "Indikator tidak ditemukan" });
    }
    res.status(500).json({ success: false, message: error?.message || "Gagal memperbarui indikator" });
  }
});

app.delete("/api/indikator/:id", requirePermission("indikator:delete"), async (req: Request, res: Response) => {
  try {
    const id = parseOptionalInt(req.params.id);
    if (id === undefined) {
      return res.status(400).json({ success: false, message: "ID indikator tidak valid" });
    }
    await prisma.indikatorSpmi.delete({ where: { id } });
    res.json({ success: true, message: "Indikator berhasil dihapus" });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return res.status(404).json({ success: false, message: "Indikator tidak ditemukan" });
    }
    res.status(500).json({ success: false, message: error?.message || "Gagal menghapus indikator" });
  }
});

// ==========================================
// 3d. Siklus PPEPP (Penetapan → Peningkatan)
// ==========================================
// Index terkait: lpm_siklus_ppepp_standarId_tahun_tahap_key (unique),
//                lpm_siklus_ppepp_tahun_tahap_status_idx,
//                lpm_siklus_ppepp_periodeId_tahap_idx
const TAHAP_PPEPP = ["Penetapan", "Pelaksanaan", "Evaluasi", "Pengendalian", "Peningkatan"];

app.get("/api/siklus-ppepp", requirePermission("ppepp:view"), async (req: Request, res: Response) => {
  try {
    const { standarId, tahun, tahap, status, periodeId } = req.query as Record<string, string | undefined>;
    const where: Prisma.SiklusPpeppWhereInput = {
      ...(parseOptionalInt(standarId) !== undefined ? { standarId: parseOptionalInt(standarId) } : {}),
      ...(parseOptionalInt(tahun) !== undefined ? { tahun: parseOptionalInt(tahun) } : {}),
      ...(parseOptionalInt(periodeId) !== undefined ? { periodeId: parseOptionalInt(periodeId) } : {}),
      ...(tahap ? { tahap } : {}),
      ...(status ? { status } : {}),
    };

    const data = await prisma.siklusPpepp.findMany({
      where,
      include: {
        standar: { select: { id: true, kode: true, nama: true } },
        periode: { select: { id: true, nama: true, tahun: true } },
      },
      orderBy: [{ tahun: "desc" }, { standarId: "asc" }],
    });

    // Ringkasan progres per standar (dihitung dari baris yang sudah diambil,
    // jumlahnya maksimal 5 tahap per standar sehingga tidak membebani memori).
    type ProgresStandar = { standarId: number; total: number; selesai: number; berjalan: number };
    const progres = Object.values(
      data.reduce<Record<number, ProgresStandar>>(
        (acc: Record<number, ProgresStandar>, row: { standarId: number; status: string }) => {
          const entry = (acc[row.standarId] ??= { standarId: row.standarId, total: 0, selesai: 0, berjalan: 0 });
          entry.total += 1;
          if (row.status === "Selesai") entry.selesai += 1;
          if (row.status === "Berjalan") entry.berjalan += 1;
          return acc;
        },
        {},
      ),
    );

    res.json({ success: true, data, progres });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil siklus PPEPP" });
  }
});

app.post("/api/siklus-ppepp", requirePermission("ppepp:create"), async (req: Request, res: Response) => {
  try {
    const { standarId, periodeId, tahap, status, tahun, tanggalMulai, tanggalSelesai, penanggungJawab, catatan } = req.body;

    const idStandar = parseOptionalInt(standarId);
    if (idStandar === undefined || !tahap) {
      return res.status(400).json({ success: false, message: "Standar dan tahap PPEPP wajib diisi" });
    }
    if (!TAHAP_PPEPP.includes(tahap)) {
      return res.status(400).json({ success: false, message: `Tahap harus salah satu dari: ${TAHAP_PPEPP.join(", ")}` });
    }

    const idTahun = parseOptionalInt(tahun) ?? 2026;
    const idPeriode = parseOptionalInt(periodeId);

    // Upsert memakai composite unique (standarId, tahun, tahap) sehingga
    // mencatat ulang tahap yang sama bersifat idempoten, bukan duplikasi.
    const saved = await prisma.siklusPpepp.upsert({
      where: { standarId_tahun_tahap: { standarId: idStandar, tahun: idTahun, tahap } },
      update: {
        status: status || undefined,
        periodeId: idPeriode !== undefined ? idPeriode : undefined,
        tanggalMulai: tanggalMulai ? new Date(tanggalMulai) : undefined,
        tanggalSelesai: tanggalSelesai ? new Date(tanggalSelesai) : undefined,
        penanggungJawab: penanggungJawab !== undefined ? penanggungJawab : undefined,
        catatan: catatan !== undefined ? catatan : undefined,
      },
      create: {
        standarId: idStandar,
        periodeId: idPeriode ?? null,
        tahun: idTahun,
        tahap,
        status: status || "Belum Mulai",
        tanggalMulai: tanggalMulai ? new Date(tanggalMulai) : null,
        tanggalSelesai: tanggalSelesai ? new Date(tanggalSelesai) : null,
        penanggungJawab: penanggungJawab || null,
        catatan: catatan || null,
      },
    });

    res.json({ success: true, data: saved, message: `Tahap ${tahap} berhasil disimpan` });
  } catch (error: any) {
    if (error?.code === "P2003") {
      return res.status(400).json({ success: false, message: "Standar atau periode AMI tidak ditemukan" });
    }
    res.status(500).json({ success: false, message: error?.message || "Gagal menyimpan siklus PPEPP" });
  }
});

app.put("/api/siklus-ppepp/:id", requirePermission("ppepp:update"), async (req: Request, res: Response) => {
  try {
    const id = parseOptionalInt(req.params.id);
    if (id === undefined) {
      return res.status(400).json({ success: false, message: "ID siklus PPEPP tidak valid" });
    }
    const { status, tanggalMulai, tanggalSelesai, penanggungJawab, catatan } = req.body;

    const updated = await prisma.siklusPpepp.update({
      where: { id },
      data: {
        ...(status && { status }),
        tanggalMulai: tanggalMulai !== undefined ? (tanggalMulai ? new Date(tanggalMulai) : null) : undefined,
        tanggalSelesai: tanggalSelesai !== undefined ? (tanggalSelesai ? new Date(tanggalSelesai) : null) : undefined,
        penanggungJawab: penanggungJawab !== undefined ? penanggungJawab : undefined,
        catatan: catatan !== undefined ? catatan : undefined,
      },
    });
    res.json({ success: true, data: updated, message: "Siklus PPEPP berhasil diperbarui" });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return res.status(404).json({ success: false, message: "Catatan siklus PPEPP tidak ditemukan" });
    }
    res.status(500).json({ success: false, message: error?.message || "Gagal memperbarui siklus PPEPP" });
  }
});

// ==========================================
// 3e. Tindak Lanjut Temuan Audit (Pengendalian & Peningkatan)
// ==========================================
// Index terkait: lpm_tindak_lanjut_auditId_status_idx,
//                lpm_tindak_lanjut_status_tenggat_idx,
//                lpm_tindak_lanjut_standarId_status_idx
app.get("/api/tindak-lanjut", requirePermission("tindaklanjut:view"), async (req: Request, res: Response) => {
  try {
    const { auditId, standarId, status, prioritas } = req.query as Record<string, string | undefined>;
    const where: Prisma.TindakLanjutWhereInput = {
      ...(parseOptionalInt(auditId) !== undefined ? { auditId: parseOptionalInt(auditId) } : {}),
      ...(parseOptionalInt(standarId) !== undefined ? { standarId: parseOptionalInt(standarId) } : {}),
      ...(status ? { status } : {}),
      ...(prioritas ? { prioritas } : {}),
    };

    const { paginated, page, limit, skip, take } = parsePagination(req);

    const [data, total] = await Promise.all([
      prisma.tindakLanjut.findMany({
        where,
        include: {
          standar: { select: { id: true, kode: true, nama: true } },
          audit: { select: { id: true, auditee: true, hasil: true } },
        },
        orderBy: [{ tenggat: "asc" }, { createdAt: "desc" }],
        ...(paginated ? { skip, take } : {}),
      }),
      paginated ? prisma.tindakLanjut.count({ where }) : Promise.resolve(0),
    ]);

    res.json({
      success: true,
      data,
      ...(paginated ? { meta: { page, limit, total, totalPages: Math.ceil(total / limit) } } : {}),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil tindak lanjut" });
  }
});

app.post("/api/tindak-lanjut", requirePermission("tindaklanjut:create"), async (req: Request, res: Response) => {
  try {
    const { auditId, standarId, uraian, penanggungJawab, status, prioritas, tenggat } = req.body;
    const idStandar = parseOptionalInt(standarId);
    if (idStandar === undefined || !uraian) {
      return res.status(400).json({ success: false, message: "Standar dan uraian tindak lanjut wajib diisi" });
    }

    const created = await prisma.tindakLanjut.create({
      data: {
        auditId: parseOptionalInt(auditId) ?? null,
        standarId: idStandar,
        uraian,
        penanggungJawab: penanggungJawab || null,
        status: status || "Terbuka",
        prioritas: prioritas || "Sedang",
        tenggat: tenggat ? new Date(tenggat) : null,
      },
    });
    res.json({ success: true, data: created, message: "Tindak lanjut berhasil dibuat" });
  } catch (error: any) {
    if (error?.code === "P2003") {
      return res.status(400).json({ success: false, message: "Standar atau temuan audit tidak ditemukan" });
    }
    res.status(500).json({ success: false, message: error?.message || "Gagal membuat tindak lanjut" });
  }
});

app.put("/api/tindak-lanjut/:id", requirePermission("tindaklanjut:update"), async (req: Request, res: Response) => {
  try {
    const id = parseOptionalInt(req.params.id);
    if (id === undefined) {
      return res.status(400).json({ success: false, message: "ID tindak lanjut tidak valid" });
    }
    const { uraian, penanggungJawab, status, prioritas, tenggat, tanggalSelesai, buktiPath } = req.body;

    const updated = await prisma.tindakLanjut.update({
      where: { id },
      data: {
        ...(uraian && { uraian }),
        penanggungJawab: penanggungJawab !== undefined ? penanggungJawab : undefined,
        ...(status && { status }),
        ...(prioritas && { prioritas }),
        tenggat: tenggat !== undefined ? (tenggat ? new Date(tenggat) : null) : undefined,
        tanggalSelesai: tanggalSelesai !== undefined ? (tanggalSelesai ? new Date(tanggalSelesai) : null) : undefined,
        buktiPath: buktiPath !== undefined ? buktiPath : undefined,
      },
    });
    res.json({ success: true, data: updated, message: "Tindak lanjut berhasil diperbarui" });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return res.status(404).json({ success: false, message: "Tindak lanjut tidak ditemukan" });
    }
    res.status(500).json({ success: false, message: error?.message || "Gagal memperbarui tindak lanjut" });
  }
});

// 4. Dashboard Stats
// Sebelumnya seluruh baris lpm_audit_butir ditarik ke memori lalu difilter di JS
// (O(n) transfer + O(n) scan). Sekarang agregasi dilakukan di database:
//   - GROUP BY hasil   -> memakai lpm_audit_butir_hasil_idx
//   - GROUP BY status  -> lpm_indikator_spmi_tahun_status_idx / lpm_tindak_lanjut_status_tenggat_idx
//   - count()          -> memakai index PK
//   - take: 5          -> memakai index createdAt (DESC) masing-masing tabel
// Payload lengkap dipakai dashboard: kartu metrik (12 angka), donut hasil audit,
// bar volume repositori, gauge capaian PPEPP, stacked bar status RTL, serta dua
// daftar terbaru (audit + dokumen) dan daftar standar terbaru.
app.get("/api/dashboard/stats", async (req: Request, res: Response) => {
  try {
    const [
      totalStandar,
      totalDokumen,
      hasilGroups,
      recentAudits,
      indikatorGroups,
      tindakLanjutTerbuka,
      // Tambahan untuk laporan dashboard: komposisi status tindak lanjut
      // (StackedBar) dan daftar terbaru tiap modul (5 baris terakhir).
      tindakLanjutGroups,
      recentStandar,
      recentDokumen,
      // Jumlah RBAC diambil dari database (bukan lagi dari memori proses).
      jumlahPengguna,
      jumlahPeran,
      jumlahIzin,
    ] = await Promise.all([
      prisma.standarSpmi.count(),
      prisma.dokumenMutu.count(),
      prisma.auditButir.groupBy({
        by: ["hasil"],
        _count: { _all: true },
      }),
      prisma.auditButir.findMany({
        include: { periode: true, standar: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Rekap ketercapaian indikator (modul PPEPP) — GROUP BY status memakai
      // index lpm_indikator_spmi_tahun_status_idx.
      prisma.indikatorSpmi.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      // Temuan yang belum ditutup — memakai lpm_tindak_lanjut_status_tenggat_idx.
      prisma.tindakLanjut.count({
        where: { status: { in: ["Terbuka", "Dikerjakan"] } },
      }),
      // Komposisi status RTL (GROUP BY status) — index lpm_tindak_lanjut_status_tenggat_idx.
      prisma.tindakLanjut.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      // 5 standar SPMI terbaru — index lpm_standar_spmi_createdAt_idx (DESC).
      prisma.standarSpmi.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // 5 dokumen mutu terbaru — index lpm_dokumen_mutu_createdAt_idx (DESC).
      prisma.dokumenMutu.findMany({
        include: { standar: { select: { kode: true, nama: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.lpmUser.count(),
      prisma.lpmRole.count(),
      prisma.lpmPermission.count(),
    ]);

    const countByHasil = (label: string) =>
      hasilGroups.find((group) => group.hasil === label)?._count._all ?? 0;

    const totalAudit = hasilGroups.reduce((sum, group) => sum + group._count._all, 0);
    const auditMayor = countByHasil("Temuan Mayor");
    const auditMinor = countByHasil("Temuan Minor");
    const auditSesuai = countByHasil("Sesuai");

    const indikatorTotal = indikatorGroups.reduce((sum, group) => sum + group._count._all, 0);
    const indikatorTercapai = indikatorGroups
      .filter((group) => group.status === "Tercapai" || group.status === "Melebihi Target")
      .reduce((sum, group) => sum + group._count._all, 0);

    // Rincian status indikator (Belum Dinilai / Belum Tercapai / Tercapai /
    // Melebihi Target) untuk laporan proporsi siklus PPEPP.
    const indikatorStatus = indikatorGroups.map((group) => ({
      status: group.status,
      jumlah: group._count._all,
    }));

    // Komposisi status tindak lanjut (Terbuka / Dikerjakan / Selesai / Dibatalkan).
    const tindakLanjutStatus = tindakLanjutGroups.map((group) => ({
      status: group.status,
      jumlah: group._count._all,
    }));

    res.json({
      success: true,
      data: {
        stats: {
          totalStandar,
          totalDokumen,
          totalAudit,
          totalUsers: jumlahPengguna,
          totalRoles: jumlahPeran,
          totalPermissions: jumlahIzin,
          auditMayor,
          auditMinor,
          auditSesuai,
          // Modul PPEPP: ketercapaian indikator & temuan yang belum ditutup
          indikatorTotal,
          indikatorTercapai,
          tindakLanjutTerbuka,
          indikatorStatus,
          tindakLanjutStatus,
        },
        recentAudits,
        recentStandar,
        recentDokumen,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Gagal mengambil statistik dashboard" });
  }
});

// ---------------------------------------------------------------------------
// 5. RBAC API (Pengguna, Peran, Izin) — SELURUHNYA DARI DATABASE
//
// Tidak ada lagi penyimpanan in-memory: setiap perubahan izin langsung
// tersimpan di tabel lpm_* sehingga bertahan setelah server dimulai ulang.
// Semua endpoint dijaga `requirePermission(...)`, bukan nama peran.
// ---------------------------------------------------------------------------

/** Bentuk respons peran untuk klien. */
const bentukPeran = (r: any) => ({
  id: r.kode,
  roleId: r.id,
  name: r.kode,
  kode: r.kode,
  label: r.nama,
  nama: r.nama,
  description: r.deskripsi ?? "",
  deskripsi: r.deskripsi ?? "",
  permissionsCount: r.izin?.length ?? 0,
  usersCount: r._count?.pengguna ?? 0,
  isSystem: r.sistem,
  izin: (r.izin ?? []).map((rp: any) => rp.permission.kunci),
});

// 5a. Pengguna LPM — hanya pemegang izin pengguna:view
app.get("/api/users", requirePermission("pengguna:view"), async (req: Request, res: Response) => {
  try {
    const daftar = await prisma.lpmUser.findMany({
      orderBy: { id: "asc" },
      include: { peran: { include: { role: true } } },
    });
    res.json({
      success: true,
      data: daftar.map((u) => ({
        id: u.id,
        userId: u.userId,
        username: u.username,
        nama: u.nama,
        email: u.email,
        ssoRole: u.ssoRole,
        status: u.status,
        peran: u.peran.map((p) => p.role.kode),
        role: u.peran[0]?.role.kode ?? null,
        createdAt: u.createdAt,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || "Gagal memuat pengguna" });
  }
});

// 5b. Tambah pengguna LPM + penugasan peran (izin pengguna:create)
app.post("/api/users", requirePermission("pengguna:create"), async (req: Request, res: Response) => {
  try {
    const { userId, username, nama, email, ssoRole, status, peran } = req.body ?? {};
    if (!userId || !username || !nama) {
      return res.status(400).json({
        success: false,
        message: "userId, username, dan nama wajib diisi",
      });
    }

    const kodePeran: string[] = Array.isArray(peran) ? peran : [];
    if (kodePeran.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Pilih minimal satu peran. Izin pengguna diturunkan dari peran yang diberikan.",
      });
    }

    const peranDb = await prisma.lpmRole.findMany({ where: { kode: { in: kodePeran } } });
    if (peranDb.length !== kodePeran.length) {
      const tidakDikenal = kodePeran.filter((k) => !peranDb.some((p) => p.kode === k));
      return res.status(400).json({
        success: false,
        message: `Peran tidak dikenal: ${tidakDikenal.join(", ")}`,
      });
    }

    const pengguna = await prisma.lpmUser.create({
      data: {
        userId: Number(userId),
        username: String(username),
        nama: String(nama),
        email: email || null,
        ssoRole: ssoRole ? String(ssoRole).toUpperCase() : null,
        status: status || "Aktif",
        peran: { create: peranDb.map((p) => ({ roleId: p.id })) },
      },
      include: { peran: { include: { role: true } } },
    });

    res.json({ success: true, data: pengguna, message: "Pengguna berhasil ditambahkan" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || "Gagal menambah pengguna" });
  }
});

// 5c. Ubah pengguna LPM (izin pengguna:update)
app.put("/api/users/:id", requirePermission("pengguna:update"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { nama, email, ssoRole, status, peran } = req.body ?? {};

    const ada = await prisma.lpmUser.findUnique({ where: { id } });
    if (!ada) {
      return res.status(404).json({ success: false, message: "Pengguna tidak ditemukan" });
    }

    const kodePeran: string[] | undefined = Array.isArray(peran) ? peran : undefined;
    let peranDb: { id: number; kode: string }[] = [];
    if (kodePeran) {
      const ditemukan = await prisma.lpmRole.findMany({ where: { kode: { in: kodePeran } } });
      if (ditemukan.length !== kodePeran.length) {
        return res.status(400).json({ success: false, message: "Ada peran yang tidak dikenal" });
      }
      peranDb = ditemukan;
    }

    const diperbarui = await prisma.$transaction(async (tx) => {
      await tx.lpmUser.update({
        where: { id },
        data: {
          ...(nama !== undefined ? { nama: String(nama) } : {}),
          ...(email !== undefined ? { email: email || null } : {}),
          ...(ssoRole !== undefined ? { ssoRole: ssoRole ? String(ssoRole).toUpperCase() : null } : {}),
          ...(status !== undefined ? { status: String(status) } : {}),
        },
      });
      if (kodePeran) {
        await tx.lpmUserRole.deleteMany({ where: { userId: id } });
        if (peranDb.length > 0) {
          await tx.lpmUserRole.createMany({
            data: peranDb.map((p) => ({ userId: id, roleId: p.id })),
          });
        }
      }
      return tx.lpmUser.findUnique({ where: { id }, include: { peran: { include: { role: true } } } });
    });

    res.json({ success: true, data: diperbarui, message: "Pengguna berhasil diperbarui" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || "Gagal memperbarui pengguna" });
  }
});

// 5d. Hapus pengguna LPM (izin pengguna:delete)
app.delete("/api/users/:id", requirePermission("pengguna:delete"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.lpmUser.delete({ where: { id } }).catch(() => null);
    res.json({ success: true, message: "Pengguna berhasil dihapus" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || "Gagal menghapus pengguna" });
  }
});

// 5e. Daftar peran (izin peran:view)
app.get("/api/roles", requirePermission("peran:view"), async (req: Request, res: Response) => {
  try {
    const daftar = await prisma.lpmRole.findMany({
      orderBy: { id: "asc" },
      include: { izin: { include: { permission: true } }, _count: { select: { pengguna: true } } },
    });
    res.json({ success: true, data: daftar.map(bentukPeran) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || "Gagal memuat peran" });
  }
});

// 5f. Buat peran baru (izin peran:create)
app.post("/api/roles", requirePermission("peran:create"), async (req: Request, res: Response) => {
  try {
    const { kode, nama, deskripsi, izin } = req.body ?? {};
    const kodeBersih = String(kode || nama || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, "_");
    if (!kodeBersih || !nama) {
      return res.status(400).json({ success: false, message: "Kode dan nama peran wajib diisi" });
    }

    const sudahAda = await prisma.lpmRole.findUnique({ where: { kode: kodeBersih } });
    if (sudahAda) {
      return res.status(409).json({ success: false, message: `Peran ${kodeBersih} sudah ada` });
    }

    const daftarKunci: string[] = Array.isArray(izin) ? izin : [];
    const izinDb = daftarKunci.length
      ? await prisma.lpmPermission.findMany({ where: { kunci: { in: daftarKunci } } })
      : [];

    const baru = await prisma.lpmRole.create({
      data: {
        kode: kodeBersih,
        nama: String(nama),
        deskripsi: deskripsi || null,
        sistem: false,
        izin: { create: izinDb.map((i) => ({ permissionId: i.id })) },
      },
      include: { izin: { include: { permission: true } }, _count: { select: { pengguna: true } } },
    });

    res.json({ success: true, data: bentukPeran(baru), message: "Peran baru berhasil dibuat" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || "Gagal membuat peran" });
  }
});

// 5g. Ubah peran / matriks izinnya (izin peran:update)
app.put("/api/roles/:id", requirePermission("peran:update"), async (req: Request, res: Response) => {
  try {
    const kode = String(req.params.id);
    const { nama, deskripsi, izin } = req.body ?? {};

    const peran = await prisma.lpmRole.findUnique({ where: { kode } });
    if (!peran) {
      return res.status(404).json({ success: false, message: "Peran tidak ditemukan" });
    }

    const daftarKunci: string[] | undefined = Array.isArray(izin) ? izin : undefined;
    let izinDb: { id: number; kunci: string }[] = [];
    if (daftarKunci) {
      izinDb = await prisma.lpmPermission.findMany({ where: { kunci: { in: daftarKunci } } });
      const tidakDikenal = daftarKunci.filter((k) => !izinDb.some((i) => i.kunci === k));
      if (tidakDikenal.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Izin tidak dikenal: ${tidakDikenal.join(", ")}`,
        });
      }
    }

    const diperbarui = await prisma.$transaction(async (tx) => {
      await tx.lpmRole.update({
        where: { kode },
        data: {
          ...(nama !== undefined ? { nama: String(nama) } : {}),
          ...(deskripsi !== undefined ? { deskripsi: deskripsi || null } : {}),
        },
      });
      if (daftarKunci) {
        await tx.lpmRolePermission.deleteMany({ where: { roleId: peran.id } });
        if (izinDb.length > 0) {
          await tx.lpmRolePermission.createMany({
            data: izinDb.map((i) => ({ roleId: peran.id, permissionId: i.id })),
          });
        }
      }
      return tx.lpmRole.findUnique({
        where: { kode },
        include: { izin: { include: { permission: true } }, _count: { select: { pengguna: true } } },
      });
    });

    res.json({ success: true, data: bentukPeran(diperbarui), message: "Peran berhasil diperbarui" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || "Gagal memperbarui peran" });
  }
});

// 5h. Hapus peran (izin peran:delete)
app.delete("/api/roles/:id", requirePermission("peran:delete"), async (req: Request, res: Response) => {
  try {
    const kode = String(req.params.id);
    const peran = await prisma.lpmRole.findUnique({ where: { kode } });
    if (!peran) {
      return res.status(404).json({ success: false, message: "Peran tidak ditemukan" });
    }
    if (peran.sistem) {
      return res.status(400).json({ success: false, message: "Peran sistem inti tidak dapat dihapus" });
    }
    await prisma.lpmRole.delete({ where: { kode } });
    res.json({ success: true, message: "Peran berhasil dihapus" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || "Gagal menghapus peran" });
  }
});

// 5i. Matriks izin: seluruh kunci izin yang dikenali panel LPM (izin izin:view)
app.get("/api/permissions", requirePermission("izin:view"), async (req: Request, res: Response) => {
  try {
    const daftar = await prisma.lpmPermission.findMany({
      orderBy: [{ grup: "asc" }, { kunci: "asc" }],
    });
    res.json({
      success: true,
      data: daftar.map((i) => ({
        id: i.id,
        kunci: i.kunci,
        nama: i.nama,
        grup: i.grup,
        keterangan: i.keterangan ?? "",
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || "Gagal memuat izin" });
  }
});

// 5j. Matriks izin per peran sekaligus (dipakai halaman Tata Kelola)
app.get("/api/rbac/matriks", requirePermission("izin:view"), async (req: Request, res: Response) => {
  try {
    const [peran, izin] = await Promise.all([
      prisma.lpmRole.findMany({
        orderBy: { id: "asc" },
        include: { izin: { include: { permission: true } }, _count: { select: { pengguna: true } } },
      }),
      prisma.lpmPermission.findMany({ orderBy: [{ grup: "asc" }, { kunci: "asc" }] }),
    ]);
    res.json({
      success: true,
      peran: peran.map(bentukPeran),
      izin: izin.map((i) => ({ kunci: i.kunci, nama: i.nama, grup: i.grup })),
      izinMasuk: Object.entries(KUNCI_IZIN_MASUK).map(([tingkat, kunci]) => ({
        tingkat,
        kunci,
        label: LABEL_TINGKAT[tingkat as TingkatMasuk],
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || "Gagal memuat matriks izin" });
  }
});

// 5k. Ringkasan RBAC untuk halaman Tata Kelola
app.get("/api/rbac/summary", requirePermission("izin:view"), async (req: Request, res: Response) => {
  try {
    const [jumlahPeran, jumlahPengguna, jumlahIzin] = await Promise.all([
      prisma.lpmRole.count(),
      prisma.lpmUser.count(),
      prisma.lpmPermission.count(),
    ]);
    res.json({ success: true, data: { jumlahPeran, jumlahPengguna, jumlahIzin } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || "Gagal memuat ringkasan RBAC" });
  }
});

// Root handler & middleware guard: pastikan rute root / melayani landing page publik dan tidak diarahkan ke /admin
app.get("/", (req: Request, res: Response, next: NextFunction) => {
  // Rute root adalah landing page publik resmi LPM UNUSU.
  // Pengalihan ke /admin hanya terjadi jika pengguna secara sadar mengakses /admin atau melalui navigasi UI.
  next();
});

// SPA Fallback
app.get("*", (req: Request, res: Response) => {
  res.sendFile(path.join(clientDistPath, "index.html"), (err) => {
    if (err) {
      res.status(200).send("LPM UNUSU Server Running. Build client using 'npm run build:client'.");
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 LPM UNUSU Monolith Server running on http://localhost:${PORT}`);
});
