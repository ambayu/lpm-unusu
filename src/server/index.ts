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
}

// ==========================================
// PEMISAHAN ADMIN PER APLIKASI (APP-SCOPED ROLE)
// Ekosistem ONE UNUSU memakai SATU tabel pengguna dengan peran ber-prefix
// aplikasi. Panel LPM hanya boleh dibuka oleh peran milik LPM. Admin aplikasi
// lain (contoh ADMIN_LPPM) WAJIB ditolak walau token SSO-nya sah.
// ==========================================
const SSO_ROLE_MAP: Record<string, string> = {
  SUPERADMIN: "admin",
  ADMIN_LPM: "admin",
  ADMIN_LPPM: "admin",
  ADMIN_ESURAT: "admin",
  ADMIN_SARPRAS: "admin",
  ADMIN_AKREDITASI: "admin",
  ADMIN_LMS: "admin",
  ADMIN_SSO: "admin",
  DOSEN: "dosen",
  MAHASISWA: "mahasiswa",
};

/** Kode & nama aplikasi ini — dipakai pada payload otorisasi. */
const APP_CODE = "lpm-unusu";
const APP_NAME = "LPM UNUSU";

/** Peran SSO yang SAH untuk aplikasi LPM (admin LPM, superadmin, dosen auditor). */
const LPM_APP_ROLES = new Set(["SUPERADMIN", "ADMIN_LPM", "DOSEN"]);

/** Peran admin milik aplikasi LAIN di ekosistem ONE UNUSU — dilarang masuk LPM. */
const FOREIGN_APP_ADMIN_ROLES: Record<string, string> = {
  ADMIN_LPPM: "LPPM UNUSU",
  ADMIN_ESURAT: "E-Surat UNUSU",
  ADMIN_SARPRAS: "Sarpras UNUSU",
  ADMIN_AKREDITASI: "Akreditasi UNUSU",
  ADMIN_LMS: "LMS UNUSU",
  ADMIN_SSO: "ONE UNUSU Gateway",
};

/** Label peran untuk kebutuhan tampilan (UI memakai ini, bukan string mentah). */
const ROLE_LABEL: Record<string, string> = {
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

/** Backward compatibility untuk pemeriksaan lama. */
const ALLOWED_SSO_ROLES = LPM_APP_ROLES;

const mapSsoRole = (role: string): string => SSO_ROLE_MAP[role] ?? "mahasiswa";

const isLpmAdminRole = (ssoRole: string): boolean =>
  ssoRole === "SUPERADMIN" || ssoRole === "ADMIN_LPM";

export type AppAccessReason =
  | "allowed"
  | "foreign_app_admin"
  | "role_not_allowed"
  | "missing_role";

export interface AppAccessDecision {
  app: string;
  appName: string;
  allowed: boolean;
  reason: AppAccessReason;
  ssoRole: string;
  role: string;
  roleLabel: string;
  isAppAdmin: boolean;
  foreignApp: { code: string; name: string } | null;
  message: string;
}

/**
 * Satu-satunya sumber kebenaran otorisasi panel LPM.
 * Dipakai saat tukar token SSO, saat verifikasi sesi (/api/auth/me), dan pada
 * middleware authenticate agar token lama tidak bisa dipakai lintas aplikasi.
 */
const resolveAppAccess = (ssoRoleRaw: string): AppAccessDecision => {
  const ssoRole = (ssoRoleRaw || "").toUpperCase();
  const base = {
    app: APP_CODE,
    appName: APP_NAME,
    ssoRole,
    role: mapSsoRole(ssoRole),
    roleLabel: ROLE_LABEL[ssoRole] ?? ssoRole ?? "Tanpa Peran",
  };

  if (!ssoRole) {
    return {
      ...base,
      allowed: false,
      reason: "missing_role",
      isAppAdmin: false,
      foreignApp: null,
      message: "Token SSO tidak memuat peran. Silakan login ulang melalui Portal ONE UNUSU.",
    };
  }

  const foreignAppName = FOREIGN_APP_ADMIN_ROLES[ssoRole];
  if (foreignAppName) {
    return {
      ...base,
      allowed: false,
      reason: "foreign_app_admin",
      isAppAdmin: false,
      foreignApp: {
        code: ssoRole.replace(/^ADMIN_/, "").toLowerCase(),
        name: foreignAppName,
      },
      message: `Akun Anda terdaftar sebagai ${ROLE_LABEL[ssoRole] ?? ssoRole} (${foreignAppName}). Administrator aplikasi lain tidak dapat masuk ke panel ${APP_NAME}. Silakan gunakan aplikasi ${foreignAppName} atau hubungi Superadmin ONE UNUSU bila penugasan peran perlu diubah.`,
    };
  }

  if (!LPM_APP_ROLES.has(ssoRole)) {
    return {
      ...base,
      allowed: false,
      reason: "role_not_allowed",
      isAppAdmin: false,
      foreignApp: null,
      message: `Peran ${ssoRole} tidak memiliki hak akses ke panel ${APP_NAME}. Panel ini hanya untuk Administrator LPM, Superadmin, dan Dosen/Auditor Mutu.`,
    };
  }

  return {
    ...base,
    allowed: true,
    reason: "allowed",
    isAppAdmin: isLpmAdminRole(ssoRole),
    foreignApp: null,
    message: `Selamat datang di panel ${APP_NAME}.`,
  };
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

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header && header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "Token otentikasi tidak disediakan" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    const ssoRole = String(decoded.ssoRole ?? "");
    const access = resolveAppAccess(ssoRole);

    // Penjaga lapis kedua: token lama yang terbit sebelum pemisahan admin per
    // aplikasi tidak boleh dipakai untuk membuka panel LPM.
    if (!access.allowed) {
      recordAccessDenial({
        source: "api_request",
        ssoRole: access.ssoRole,
        reason: access.reason,
        username: String(decoded.username ?? ""),
        nama: String(decoded.nama ?? ""),
        foreignApp: access.foreignApp?.name ?? null,
        path: req.originalUrl,
        ip: req.ip ?? "",
      });
      return res.status(403).json({
        success: false,
        code: access.reason === "foreign_app_admin" ? "FOREIGN_APP_ADMIN" : "APP_ACCESS_DENIED",
        message: access.message,
        appAccess: access,
      });
    }

    (req as AuthRequest).user = {
      id: Number(decoded.id),
      username: String(decoded.username ?? ""),
      nama: String(decoded.nama ?? ""),
      email: typeof decoded.email === "string" ? decoded.email : null,
      role: String(decoded.role ?? "mahasiswa"),
      ssoRole,
      nim: typeof decoded.nim === "string" ? decoded.nim : null,
      nidn: typeof decoded.nidn === "string" ? decoded.nidn : null,
      prodi: typeof decoded.prodi === "string" ? decoded.prodi : null,
      fakultas: typeof decoded.fakultas === "string" ? decoded.fakultas : null,
    };
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Sesi login telah kedaluwarsa" });
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

    // Tolak login jika peran SSO bukan milik aplikasi LPM (admin LPPM, dsb.)
    const access = resolveAppAccess(ssoUser.role);
    if (!access.allowed) {
      recordAccessDenial({
        source: "sso_exchange",
        ssoRole: access.ssoRole,
        reason: access.reason,
        username: ssoUser.username ?? "",
        nama: ssoUser.nama ?? "",
        foreignApp: access.foreignApp?.name ?? null,
        path: "/api/auth/sso",
        ip: req.ip ?? "",
      });
      return res.status(403).json({
        success: false,
        code: access.reason === "foreign_app_admin" ? "FOREIGN_APP_ADMIN" : "APP_ACCESS_DENIED",
        message: access.message,
        appAccess: access,
      });
    }

    const sessionUser: SsoSession = {
      id: ssoUser.id,
      username: ssoUser.username,
      nama: ssoUser.nama,
      email: ssoUser.email ?? null,
      role: mapSsoRole(ssoUser.role),
      ssoRole: ssoUser.role,
      nim: ssoUser.nim ?? null,
      nidn: ssoUser.nidn ?? null,
      prodi: ssoUser.prodi ?? null,
      fakultas: ssoUser.fakultas ?? null,
    };

    const tokenJwt = jwt.sign({ ...sessionUser, appCode: APP_CODE }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ success: true, token: tokenJwt, user: sessionUser, appAccess: access });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal memproses SSO: " + error?.message });
  }
});

// Seluruh API di bawah ini wajib membawa JWT sesi lokal (hasil SSO).
app.use("/api", authenticate);

/** Middleware otorisasi — hanya role tertentu yang boleh lewat. */
const requireRole = (...allowed: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const role = (req as AuthRequest).user?.role;
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak. Anda tidak memiliki izin untuk operasi ini.",
      });
    }
    next();
  };

/** Middleware khusus admin aplikasi LPM (bukan admin aplikasi lain). */
const requireLpmAdmin = (req: Request, res: Response, next: NextFunction) => {
  const access = resolveAppAccess((req as AuthRequest).user?.ssoRole ?? "");
  if (!access.allowed || !access.isAppAdmin) {
    return res.status(403).json({
      success: false,
      code: "LPM_ADMIN_ONLY",
      message: "Operasi ini hanya dapat dilakukan Administrator LPM.",
      appAccess: access,
    });
  }
  next();
};

// 0a. Jejak penolakan akses lintas aplikasi (khusus Administrator LPM)
app.get("/api/security/access-denials", requireLpmAdmin, (req: Request, res: Response) => {
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
  const access = resolveAppAccess(user.ssoRole);
  res.json({ success: true, user, appAccess: access });
});

/** Daftar peran yang sah untuk aplikasi ini (untuk dropdown penugasan peran). */
app.get("/api/auth/app-roles", (req: Request, res: Response) => {
  const data = Array.from(LPM_APP_ROLES).map((code) => ({
    code,
    label: ROLE_LABEL[code] ?? code,
    internalRole: mapSsoRole(code),
    isAppAdmin: isLpmAdminRole(code),
  }));
  res.json({
    success: true,
    app: APP_CODE,
    appName: APP_NAME,
    data,
    deniedRoles: Object.entries(FOREIGN_APP_ADMIN_ROLES).map(([code, name]) => ({
      code,
      label: ROLE_LABEL[code] ?? code,
      appName: name,
    })),
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
app.get("/api/standar", async (req: Request, res: Response) => {
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

app.post("/api/standar", requireRole("admin"), async (req: Request, res: Response) => {
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

app.get("/api/standar/:id", async (req: Request, res: Response) => {
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

app.put("/api/standar/:id", requireRole("admin"), async (req: Request, res: Response) => {
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

app.delete("/api/standar/:id", requireRole("admin"), async (req: Request, res: Response) => {
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
app.get("/api/dokumen-mutu", async (req: Request, res: Response) => {
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

app.post("/api/dokumen-mutu", requireRole("admin"), async (req: Request, res: Response) => {
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

app.get("/api/dokumen-mutu/:id", async (req: Request, res: Response) => {
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

app.put("/api/dokumen-mutu/:id", requireRole("admin"), async (req: Request, res: Response) => {
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

app.delete("/api/dokumen-mutu/:id", requireRole("admin"), async (req: Request, res: Response) => {
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

app.get("/api/audit", async (req: Request, res: Response) => {
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
app.get("/api/audit/rekap", async (req: Request, res: Response) => {
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

app.post("/api/audit", requireRole("admin"), async (req: Request, res: Response) => {
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

app.get("/api/audit/:id", async (req: Request, res: Response) => {
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

app.put("/api/audit/:id", requireRole("admin"), async (req: Request, res: Response) => {
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

app.delete("/api/audit/:id", requireRole("admin"), async (req: Request, res: Response) => {
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
app.get("/api/indikator", async (req: Request, res: Response) => {
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

app.post("/api/indikator", requireRole("admin"), async (req: Request, res: Response) => {
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

app.put("/api/indikator/:id", requireRole("admin"), async (req: Request, res: Response) => {
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

app.delete("/api/indikator/:id", requireRole("admin"), async (req: Request, res: Response) => {
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

app.get("/api/siklus-ppepp", async (req: Request, res: Response) => {
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

app.post("/api/siklus-ppepp", requireRole("admin"), async (req: Request, res: Response) => {
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

app.put("/api/siklus-ppepp/:id", requireRole("admin"), async (req: Request, res: Response) => {
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
app.get("/api/tindak-lanjut", async (req: Request, res: Response) => {
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

app.post("/api/tindak-lanjut", requireRole("admin"), async (req: Request, res: Response) => {
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

app.put("/api/tindak-lanjut/:id", requireRole("admin"), async (req: Request, res: Response) => {
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

// In-memory RBAC store (users, roles, permissions) for LPM access governance
let rbacUsers = [
  {
    id: 1,
    username: "superadmin",
    nama: "Dr. Ahmad Fauzi, M.Kom",
    email: "ahmad.fauzi@unusu.ac.id",
    role: "admin",
    ssoRole: "SUPERADMIN",
    fakultas: "Fakultas Sains dan Teknologi",
    prodi: "Sistem Informasi",
    status: "Aktif",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    username: "auditor1",
    nama: "Siti Nurhaliza, M.Pd",
    email: "siti.nurhaliza@unusu.ac.id",
    role: "dosen",
    ssoRole: "DOSEN",
    fakultas: "Fakultas Tarbiyah dan Keguruan",
    prodi: "Pendidikan Agama Islam",
    status: "Aktif",
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    username: "auditor2",
    nama: "Hendra Gunawan, S.T",
    email: "hendra.gunawan@unusu.ac.id",
    role: "dosen",
    ssoRole: "DOSEN",
    fakultas: "Fakultas Sains dan Teknologi",
    prodi: "Ilmu Komputer",
    status: "Aktif",
    createdAt: new Date().toISOString(),
  },
];

let rbacRoles = [
  {
    id: "admin",
    name: "admin",
    label: "Super Admin SPMI",
    description: "Akses penuh konfigurasi butir SPMI, buku dokumen kebijakan, periode audit AMI, serta manajemen RBAC LPM.",
    permissionsCount: 8,
    usersCount: 1,
    isSystem: true,
  },
  {
    id: "dosen",
    name: "dosen",
    label: "Auditor Mutu Internal (Dosen)",
    description: "Melakukan peninjauan butir standar, input evaluasi instrumen audit lapangan, dan rekomendasi perbaikan mutu.",
    permissionsCount: 4,
    usersCount: 2,
    isSystem: true,
  },
  {
    id: "mahasiswa",
    name: "mahasiswa",
    label: "Observer Mutu (Mahasiswa)",
    description: "Melihat pangkalan data mutu, arsip SOP publik, dan status akreditasi institusi/prodi.",
    permissionsCount: 2,
    usersCount: 0,
    isSystem: false,
  },
];

const rbacPermissions = [
  { id: "p1", name: "lpm:view_dashboard", action: "READ", resource: "Dashboard & Metrik SPMI", guard: "Active" },
  { id: "p2", name: "lpm:manage_standar", action: "WRITE / UPDATE", resource: "Pangkalan Standar PPEPP", guard: "Admin Only" },
  { id: "p3", name: "lpm:manage_dokumen", action: "WRITE / UPDATE", resource: "Bank Dokumen & SOP", guard: "Admin Only" },
  { id: "p4", name: "lpm:conduct_audit", action: "WRITE / EVALUATE", resource: "Instrumen & Temuan AMI", guard: "Auditor & Admin" },
  { id: "p5", name: "lpm:manage_users", action: "CRUD", resource: "Manajemen Pengguna LPM", guard: "Admin Only" },
  { id: "p6", name: "lpm:manage_roles", action: "CRUD", resource: "Manajemen Peran & Wewenang", guard: "Admin Only" },
  { id: "p7", name: "lpm:manage_permissions", action: "CONFIG", resource: "Matriks Izin Akses RBAC", guard: "Admin Only" },
];

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
          totalUsers: rbacUsers.length,
          totalRoles: rbacRoles.length,
          totalPermissions: rbacPermissions.length,
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

// 5. RBAC API (Users, Roles, Permissions)
app.get("/api/users", async (req: Request, res: Response) => {
  res.json({ success: true, data: rbacUsers });
});

app.post("/api/users", requireLpmAdmin, async (req: Request, res: Response) => {
  const { username, nama, email, role, ssoRole, fakultas, prodi, status } = req.body;
  if (!username || !nama) {
    return res.status(400).json({ success: false, message: "Username dan nama wajib diisi" });
  }
  // Admin per aplikasi: penugasan peran wajib berada dalam cakupan LPM.
  const requestedSsoRole = String(ssoRole || (role === "admin" ? "ADMIN_LPM" : "DOSEN")).toUpperCase();
  const access = resolveAppAccess(requestedSsoRole);
  if (!access.allowed) {
    return res.status(403).json({
      success: false,
      code: "FOREIGN_APP_ROLE",
      message: `Peran ${requestedSsoRole} bukan milik aplikasi LPM. ${access.message}`,
    });
  }
  const newUser = {
    id: rbacUsers.length ? Math.max(...rbacUsers.map((u) => u.id)) + 1 : 1,
    username,
    nama,
    email: email || null,
    role: access.role,
    ssoRole: access.ssoRole,
    fakultas: fakultas || null,
    prodi: prodi || null,
    status: status || "Aktif",
    createdAt: new Date().toISOString(),
  };
  rbacUsers.push(newUser);
  res.json({ success: true, data: newUser, message: "Pengguna berhasil ditambahkan" });
});

app.put("/api/users/:id", requireLpmAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const idx = rbacUsers.findIndex((u) => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: "Pengguna tidak ditemukan" });
  }
  if (req.body?.ssoRole) {
    const access = resolveAppAccess(String(req.body.ssoRole).toUpperCase());
    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        code: "FOREIGN_APP_ROLE",
        message: `Peran ${String(req.body.ssoRole).toUpperCase()} bukan milik aplikasi LPM. ${access.message}`,
      });
    }
    req.body.ssoRole = access.ssoRole;
    req.body.role = access.role;
  }
  rbacUsers[idx] = { ...rbacUsers[idx], ...req.body, id };
  res.json({ success: true, data: rbacUsers[idx], message: "Pengguna berhasil diperbarui" });
});

app.delete("/api/users/:id", requireLpmAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  rbacUsers = rbacUsers.filter((u) => u.id !== id);
  res.json({ success: true, message: "Pengguna berhasil dihapus" });
});

app.get("/api/roles", async (req: Request, res: Response) => {
  // Update users count dynamically
  const rolesWithCount = rbacRoles.map((r) => ({
    ...r,
    usersCount: rbacUsers.filter((u) => u.role === r.name).length,
  }));
  res.json({ success: true, data: rolesWithCount });
});

app.post("/api/roles", requireRole("admin"), async (req: Request, res: Response) => {
  const { name, label, description } = req.body;
  if (!name || !label) {
    return res.status(400).json({ success: false, message: "Nama dan label peran wajib diisi" });
  }
  const newRole = {
    id: name.toLowerCase().replace(/\s+/g, "_"),
    name: name.toLowerCase().replace(/\s+/g, "_"),
    label,
    description: description || "",
    permissionsCount: 4,
    usersCount: 0,
    isSystem: false,
  };
  rbacRoles.push(newRole);
  res.json({ success: true, data: newRole, message: "Peran baru berhasil dibuat" });
});

app.put("/api/roles/:id", requireRole("admin"), async (req: Request, res: Response) => {
  const id = req.params.id;
  const idx = rbacRoles.findIndex((r) => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: "Peran tidak ditemukan" });
  }
  rbacRoles[idx] = { ...rbacRoles[idx], ...req.body, id };
  res.json({ success: true, data: rbacRoles[idx], message: "Peran berhasil diperbarui" });
});

app.delete("/api/roles/:id", requireRole("admin"), async (req: Request, res: Response) => {
  const id = req.params.id;
  const role = rbacRoles.find((r) => r.id === id);
  if (role?.isSystem) {
    return res.status(400).json({ success: false, message: "Peran sistem inti tidak dapat dihapus" });
  }
  rbacRoles = rbacRoles.filter((r) => r.id !== id);
  res.json({ success: true, message: "Peran berhasil dihapus" });
});

app.get("/api/permissions", async (req: Request, res: Response) => {
  res.json({ success: true, data: rbacPermissions });
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
