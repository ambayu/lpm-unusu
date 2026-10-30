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
  DOSEN: "dosen",
  MAHASISWA: "mahasiswa",
};

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

app.post("/api/standar", async (req: Request, res: Response) => {
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

app.put("/api/standar/:id", async (req: Request, res: Response) => {
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

app.delete("/api/standar/:id", async (req: Request, res: Response) => {
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

app.post("/api/dokumen-mutu", async (req: Request, res: Response) => {
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

app.put("/api/dokumen-mutu/:id", async (req: Request, res: Response) => {
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

app.delete("/api/dokumen-mutu/:id", async (req: Request, res: Response) => {
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

app.post("/api/audit", async (req: Request, res: Response) => {
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

app.put("/api/audit/:id", async (req: Request, res: Response) => {
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

app.delete("/api/audit/:id", async (req: Request, res: Response) => {
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
