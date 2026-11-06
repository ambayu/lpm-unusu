/**
 * Migrasi palet LPM UNUSU ke biru, kuning, putih, hitam (sekali pakai).
 *
 * Aturan pemetaan:
 * - Hijau apa pun (emerald, green, teal) -> biru, karena palet resmi tidak
 *   lagi memakai hijau.
 * - Ungu dan indigo -> biru.
 * - Merah/rose hanya DIPERTAHANKAN bila berfungsi sebagai penanda bahaya
 *   (galat, hapus, akses ditolak). Selain itu dipetakan ke kuning.
 * - Alias lama `lpm-green*`, `lpm-gold*`, `lpm-brand*`, `lpm-nav*` -> biru/kuning.
 */
import fs from 'node:fs';
import path from 'node:path';

// Warna hijau/ungu -> biru, mempertahankan tingkatannya.
const PETA = [
  // Emerald (hijau) -> biru
  [/emerald-50\b/g, 'lpm-blue-50'],
  [/emerald-100\b/g, 'lpm-blue-100'],
  [/emerald-200\b/g, 'lpm-blue-200'],
  [/emerald-300\b/g, 'lpm-blue-200'],
  [/emerald-400\b/g, 'lpm-blue-400'],
  [/emerald-500\b/g, 'lpm-blue-600'],
  [/emerald-600\b/g, 'lpm-blue-700'],
  [/emerald-700\b/g, 'lpm-blue-700'],
  [/emerald-800\b/g, 'lpm-blue-800'],
  [/emerald-900\b/g, 'lpm-blue-900'],
  [/emerald-950\b/g, 'lpm-blue-950'],

  // Green -> biru
  [/\bgreen-50\b/g, 'lpm-blue-50'],
  [/\bgreen-100\b/g, 'lpm-blue-100'],
  [/\bgreen-200\b/g, 'lpm-blue-200'],
  [/\bgreen-300\b/g, 'lpm-blue-200'],
  [/\bgreen-400\b/g, 'lpm-blue-400'],
  [/\bgreen-500\b/g, 'lpm-blue-600'],
  [/\bgreen-600\b/g, 'lpm-blue-700'],
  [/\bgreen-700\b/g, 'lpm-blue-700'],
  [/\bgreen-800\b/g, 'lpm-blue-800'],
  [/\bgreen-900\b/g, 'lpm-blue-900'],
  [/\bgreen-950\b/g, 'lpm-blue-950'],

  // Teal / ungu / indigo -> biru
  [/\bteal-\d{2,3}\b/g, 'lpm-blue-700'],
  [/\bpurple-\d{2,3}\b/g, 'lpm-blue-700'],
  [/\bviolet-\d{2,3}\b/g, 'lpm-blue-700'],
  [/\bindigo-\d{2,3}\b/g, 'lpm-blue-800'],

  // Token lama repo ini
  [/lpm-green-50\b/g, 'lpm-blue-50'],
  [/lpm-green-100\b/g, 'lpm-blue-100'],
  [/lpm-green-200\b/g, 'lpm-blue-200'],
  [/lpm-green-300\b/g, 'lpm-blue-200'],
  [/lpm-green-400\b/g, 'lpm-blue-400'],
  [/lpm-green-500\b/g, 'lpm-blue-600'],
  [/lpm-green-600\b/g, 'lpm-blue-700'],
  [/lpm-green-700\b/g, 'lpm-blue-700'],
  [/lpm-green-800\b/g, 'lpm-blue-800'],
  [/lpm-green-900\b/g, 'lpm-blue-900'],
  [/lpm-green-surface\b/g, 'lpm-blue-surface'],
  [/\blpm-green\b/g, 'lpm-blue'],
  [/\blpm-gold\b/g, 'lpm-yellow'],
  [/\blpm-brand\b/g, 'lpm-blue'],
  [/lpm-nav-bg\b/g, 'lpm-blue-50'],
  [/lpm-nav-border\b/g, 'lpm-blue-200'],
  [/lpm-nav-active\b/g, 'lpm-blue-100'],
  [/lpm-nav-hover\b/g, 'lpm-blue-50'],
  [/lpm-nav-muted\b/g, 'lpm-blue-100'],

  // Biru mentah -> token resmi
  [/\bblue-50\b/g, 'lpm-blue-50'],
  [/\bblue-100\b/g, 'lpm-blue-100'],
  [/\bblue-200\b/g, 'lpm-blue-200'],
  [/\bblue-300\b/g, 'lpm-blue-200'],
  [/\bblue-400\b/g, 'lpm-blue-400'],
  [/\bblue-500\b/g, 'lpm-blue-600'],
  [/\bblue-600\b/g, 'lpm-blue-700'],
  [/\bblue-700\b/g, 'lpm-blue-700'],
  [/\bblue-800\b/g, 'lpm-blue-800'],
  [/\bblue-900\b/g, 'lpm-blue-900'],
  [/\bblue-950\b/g, 'lpm-blue-950'],

  // Kuning mentah -> token resmi
  [/\bamber-50\b/g, 'lpm-yellow-50'],
  [/\bamber-100\b/g, 'lpm-yellow-100'],
  [/\bamber-200\b/g, 'lpm-yellow-200'],
  [/\bamber-300\b/g, 'lpm-yellow-200'],
  [/\bamber-400\b/g, 'lpm-yellow-400'],
  [/\bamber-500\b/g, 'lpm-yellow-500'],
  [/\bamber-600\b/g, 'lpm-yellow-600'],
  [/\bamber-700\b/g, 'lpm-yellow-700'],
  [/\bamber-800\b/g, 'lpm-yellow-800'],
  [/\bamber-900\b/g, 'lpm-yellow-800'],
  [/\byellow-\d{2,3}\b/g, 'lpm-yellow-400'],
];

const root = path.resolve('src');
const berkas = [];
(function jelajah(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) jelajah(p);
    else if (ent.name.endsWith('.tsx') || ent.name.endsWith('.ts')) berkas.push(p);
  }
})(root);

let diubah = 0;
const ringkasan = new Map();

for (const f of berkas) {
  const asli = fs.readFileSync(f, 'utf8');
  let baru = asli;
  for (const [pola, ganti] of PETA) {
    baru = baru.replace(pola, ganti);
  }
  if (baru !== asli) {
    fs.writeFileSync(f, baru);
    diubah++;
    ringkasan.set(path.basename(f), (asli.match(/emerald|green|blue-|amber|purple|violet|indigo|teal/g) || []).length);
  }
}

console.log(`${diubah} berkas dipetakan ulang.`);
