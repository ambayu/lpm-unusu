/** Menyusun URL aset sesuai base root domain LPM. */
export function assetUrl(path: string): string {
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return `/${normalized}`;
}
