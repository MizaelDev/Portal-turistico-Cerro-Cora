import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("migration restringe limpeza do rate limit a administradores", () => {
  const migration = read("supabase/migrations/202610200001_security_followup.sql");

  assert.match(migration, /not public\.is_admin\(auth\.uid\(\)\)/);
  assert.match(migration, /security definer/i);
  assert.match(migration, /set search_path = public/i);
  assert.match(migration, /revoke all[\s\S]+from public, anon, authenticated/i);
});

test("otimizador não aceita AVIF nem wildcard Supabase", () => {
  const nextConfig = read("next.config.mjs");

  assert.doesNotMatch(nextConfig, /formats:\s*\[[^\]]*image\/avif/);
  assert.doesNotMatch(nextConfig, /hostname:\s*["']\*\.supabase\.co["']/);
  assert.match(nextConfig, /pathname:\s*["']\/storage\/v1\/object\/public\/tourism\/\*\*["']/);
});

test("Server Actions administrativas mantêm origem e sessão administrativa", () => {
  const actions = read("src/app/admin/actions.ts");
  const guardedActions = [
    "saveAdminDisplayOrder",
    "saveAdminItem",
    "deleteAdminItem",
    "uploadAdminImages",
  ];

  for (const action of guardedActions) {
    const start = actions.indexOf(`export async function ${action}`);
    assert.ok(start >= 0, `${action} deve existir`);
    const body = actions.slice(start, start + 900);
    assert.match(body, /await assertSameOrigin\(\)/, `${action} deve validar origem`);
    assert.match(body, /await requireAdmin\(\)/, `${action} deve exigir administrador`);
  }
});
