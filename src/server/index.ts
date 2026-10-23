import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
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

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", app: "LPM UNUSU API", time: new Date().toISOString() });
});

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
    const { periodeId, standarId, auditee, auditor, hasil, deskripsi, rekomendasi } = req.body;
    const newAudit = await prisma.auditButir.create({
      data: {
        periodeId: Number(periodeId),
        standarId: Number(standarId),
        auditee,
        auditor,
        hasil: hasil || "Sesuai",
        deskripsi,
        rekomendasi,
      }
    });
    res.json({ success: true, data: newAudit, message: "Hasil audit AMI berhasil disimpan" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menambah data audit" });
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
