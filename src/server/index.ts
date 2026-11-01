import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

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

const SSO_ROLE_MAP: Record<string, string> = {
  SUPERADMIN: "admin",
  ADMIN_LPM: "admin",
  DOSEN: "dosen",
  MAHASISWA: "mahasiswa",
};

/** Role SSO yang diizinkan mengakses panel LPM (Admin & Dosen) */
const ALLOWED_SSO_ROLES = new Set(["SUPERADMIN", "ADMIN_LPM", "DOSEN"]);

const mapSsoRole = (role: string): string => SSO_ROLE_MAP[role] ?? "mahasiswa";

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header && header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "Token otentikasi tidak disediakan" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    (req as AuthRequest).user = {
      id: Number(decoded.id),
      username: String(decoded.username ?? ""),
      nama: String(decoded.nama ?? ""),
      email: typeof decoded.email === "string" ? decoded.email : null,
      role: String(decoded.role ?? "mahasiswa"),
      ssoRole: String(decoded.ssoRole ?? ""),
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

    // Tolak login jika role SSO tidak diizinkan di LPM
    if (!ALLOWED_SSO_ROLES.has(ssoUser.role)) {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak. Hanya Administrator LPM dan Dosen yang diizinkan masuk ke panel ini.",
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

    const tokenJwt = jwt.sign(sessionUser, JWT_SECRET, { expiresIn: "7d" });

    res.json({ success: true, token: tokenJwt, user: sessionUser });
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

// 1. Standar SPMI
app.get("/api/standar", async (req: Request, res: Response) => {
  try {
    const list = await prisma.standarSpmi.findMany({
      include: { dokumenList: true },
      orderBy: { kode: "asc" }
    });
    res.json({ success: true, data: list });
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
    const docs = await prisma.dokumenMutu.findMany({
      include: { standar: true },
      orderBy: { createdAt: "desc" }
    });
    res.json({ success: true, data: docs });
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
app.get("/api/audit", async (req: Request, res: Response) => {
  try {
    const audits = await prisma.auditButir.findMany({
      include: {
        periode: true,
        standar: true,
      },
      orderBy: { createdAt: "desc" }
    });
    res.json({ success: true, data: audits });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data audit AMI" });
  }
});

app.post("/api/audit", requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const { periodeId, standarId, auditee, auditor, hasil, deskripsi, rekomendasi, author } = req.body;
    const newAudit = await prisma.auditButir.create({
      data: {
        periodeId: Number(periodeId),
        standarId: Number(standarId),
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
app.get("/api/dashboard/stats", async (req: Request, res: Response) => {
  try {
    const [totalStandar, totalDokumen, audits] = await Promise.all([
      prisma.standarSpmi.count(),
      prisma.dokumenMutu.count(),
      prisma.auditButir.findMany({
        include: { periode: true, standar: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const totalAudit = audits.length;
    const auditMayor = audits.filter((a) => a.hasil === "Temuan Mayor").length;
    const auditMinor = audits.filter((a) => a.hasil === "Temuan Minor").length;
    const auditSesuai = audits.filter((a) => a.hasil === "Sesuai").length;

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
        },
        recentAudits: audits.slice(0, 5),
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

app.post("/api/users", requireRole("admin"), async (req: Request, res: Response) => {
  const { username, nama, email, role, ssoRole, fakultas, prodi, status } = req.body;
  if (!username || !nama) {
    return res.status(400).json({ success: false, message: "Username dan nama wajib diisi" });
  }
  const newUser = {
    id: rbacUsers.length ? Math.max(...rbacUsers.map((u) => u.id)) + 1 : 1,
    username,
    nama,
    email: email || null,
    role: role || "dosen",
    ssoRole: ssoRole || "DOSEN",
    fakultas: fakultas || null,
    prodi: prodi || null,
    status: status || "Aktif",
    createdAt: new Date().toISOString(),
  };
  rbacUsers.push(newUser);
  res.json({ success: true, data: newUser, message: "Pengguna berhasil ditambahkan" });
});

app.put("/api/users/:id", requireRole("admin"), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const idx = rbacUsers.findIndex((u) => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: "Pengguna tidak ditemukan" });
  }
  rbacUsers[idx] = { ...rbacUsers[idx], ...req.body, id };
  res.json({ success: true, data: rbacUsers[idx], message: "Pengguna berhasil diperbarui" });
});

app.delete("/api/users/:id", requireRole("admin"), async (req: Request, res: Response) => {
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
