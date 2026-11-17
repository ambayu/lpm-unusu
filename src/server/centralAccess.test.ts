import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { CentralAccessError, checkCentralAccess, effectiveSsoRole, localFeaturesEnabled, parseCentralAccess } from "./centralAccess.js";

const url = "https://one.example/sso/api/v2/website/verify-token";
const fake = (payload: unknown, status = 200): typeof fetch => async (input, init) => {
  assert.equal(input, url.replace("verify-token", "check-access"));
  assert.deepEqual(JSON.parse(String(init?.body)), { client_id: "client", client_key: "key", user_id: 7 });
  assert.ok(init?.signal);
  return new Response(JSON.stringify(payload), { status });
};
const allowed = { status: true, data: { allowed: true, roles: ["DOSEN", "SUPERADMIN"] } };
assert.equal(effectiveSsoRole(await checkCentralAccess(url, "client", "key", 7, fake(allowed))), "SUPERADMIN");
for (const [payload, status, expected] of [
  [{ status: true, data: { allowed: false, roles: ["SUPERADMIN"] } }, 200, 403],
  [{ status: true, data: { allowed: "true", roles: [] } }, 200, 503],
  [{ status: true, data: { allowed: true, roles: [3] } }, 200, 503],
  [{}, 403, 403], [{}, 401, 503], [{}, 500, 503],
] as const) {
  await assert.rejects(checkCentralAccess(url, "client", "key", 7, fake(payload, status)), (error: unknown) => error instanceof CentralAccessError && error.status === expected);
}
await assert.rejects(checkCentralAccess(url, "client", "key", 7, async () => { throw new Error("offline"); }), (error: unknown) => error instanceof CentralAccessError && error.status === 503);
assert.throws(() => parseCentralAccess(null), CentralAccessError);
assert.equal(localFeaturesEnabled(null), false);
assert.equal(localFeaturesEnabled("Nonaktif"), false);

// Jalankan fungsi keputusan produksi tanpa menyalakan server atau mengakses DB.
const source = readFileSync(new URL("./index.ts", import.meta.url), "utf8");
const decision = source.match(/const putuskanAkses = \(params:[\s\S]*?\n};/)?.[0];
const level = source.match(/const tingkatMasukDari = \(roles:[\s\S]*?\n};/)?.[0];
assert.ok(decision && level);
const code = ts.transpileModule(`${level}\n${decision}\nresult = putuskanAkses;`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
const context = { result: undefined as undefined | ((params: { ssoRole: string; roles: string[]; statusAkun: string | null }) => { allowed: boolean; tingkat: string | null; isAppAdmin: boolean; izin: string[] }), APP_CODE: "lpm-unusu", APP_NAME: "LPM UNUSU", ROLE_LABEL_SSO: {}, LABEL_TINGKAT: { admin: "Admin" }, localFeaturesEnabled };
runInNewContext(code, context);
assert.ok(context.result);
for (const statusAkun of [null, "Nonaktif", "Aktif"]) {
  const access = context.result({ ssoRole: "ADMIN_LPM", roles: statusAkun === "Nonaktif" ? ["admin"] : [], statusAkun });
  assert.equal(access.allowed, true);
  assert.equal(access.tingkat, null);
  assert.equal(access.isAppAdmin, false);
  assert.equal(access.izin.length, 0);
}
assert.equal(context.result({ ssoRole: "SUPERADMIN", roles: [], statusAkun: null }).isAppAdmin, true);
assert.equal(context.result({ ssoRole: effectiveSsoRole({ allowed: true, roles: ["DOSEN"] }), roles: [], statusAkun: null }).isAppAdmin, false);
assert.match(source, /where: \{ userId \}/);
assert.doesNotMatch(source, /OR: \[\s*\{ userId \}/);
const loader = source.match(/const ambilIzinPengguna = async \([\s\S]*?\n};/)?.[0];
assert.ok(loader);
for (const member of [null, { status: "Nonaktif", peran: [{ role: { kode: "admin", izin: [{ permission: { kunci: "users:delete" } }] } }] }]) {
  const sandbox = { localFeaturesEnabled, prisma: { lpmUser: { findFirst: async (args: { where: { userId: number } }) => { assert.deepEqual(args.where.userId, 7); return member; } } }, result: undefined as undefined | ((id: number, role: string) => Promise<{ izin: Set<string>; roles: string[] }>) };
  runInNewContext(ts.transpileModule(`${loader}\nresult = ambilIzinPengguna;`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, sandbox);
  assert.ok(sandbox.result);
  const local = await sandbox.result(7, "ADMIN_LPM");
  assert.equal(local.izin.size, 0);
  assert.equal(local.roles.length, 0);
}
console.log("central access checks passed");
