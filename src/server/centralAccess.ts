export class CentralAccessError extends Error {
  constructor(public readonly status: 403 | 503, message: string) {
    super(message);
  }
}

export interface CentralAccess {
  allowed: boolean;
  roles: string[];
}

export function parseCentralAccess(payload: unknown): CentralAccess {
  if (typeof payload !== "object" || payload === null || !("status" in payload) || payload.status !== true || !("data" in payload)) {
    throw new CentralAccessError(503, "Respons akses ONE UNUSU tidak valid.");
  }
  const data = payload.data;
  if (typeof data !== "object" || data === null || !("allowed" in data) || typeof data.allowed !== "boolean" || !("roles" in data) || !Array.isArray(data.roles) || !data.roles.every((role: unknown) => typeof role === "string")) {
    throw new CentralAccessError(503, "Respons akses ONE UNUSU tidak valid.");
  }
  return { allowed: data.allowed, roles: data.roles };
}

export async function checkCentralAccess(verifyUrl: string, clientId: string, clientKey: string, userId: number, request: typeof fetch = fetch): Promise<CentralAccess> {
  if (!Number.isSafeInteger(userId) || userId <= 0) throw new CentralAccessError(403, "Identitas sesi tidak valid.");
  if (!clientId || !clientKey || !verifyUrl.endsWith("/verify-token")) throw new CentralAccessError(503, "Konfigurasi akses ONE UNUSU tidak valid.");
  try {
    const response = await request(verifyUrl.replace(/\/verify-token$/, "/check-access"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, client_key: clientKey, user_id: userId }),
      signal: AbortSignal.timeout(5000),
    });
    if (response.status === 403) throw new CentralAccessError(403, "Akses ONE UNUSU ditolak.");
    if (!response.ok) throw new CentralAccessError(503, "Pemeriksa akses ONE UNUSU tidak tersedia.");
    const access = parseCentralAccess(await response.json());
    if (!access.allowed) throw new CentralAccessError(403, "Akses aplikasi dicabut di ONE UNUSU.");
    return access;
  } catch (error: unknown) {
    if (error instanceof CentralAccessError) throw error;
    throw new CentralAccessError(503, "Gagal memverifikasi akses ONE UNUSU.");
  }
}

export function effectiveSsoRole(access: CentralAccess): string {
  return access.roles.includes("SUPERADMIN") ? "SUPERADMIN" : access.roles[0] ?? "";
}

export function localFeaturesEnabled(status: string | null): boolean {
  return status === "Aktif";
}
