import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const files = [
  "../functions/v1/legacy-auth/register/index.js",
  "../functions/v1/legacy-auth/login/index.js",
  "../functions/v1/legacy-auth/restore/index.js",
  "../functions/v1/legacy-auth/update-profile/index.js",
];

for (const rel of files) {
  test(`legacy auth endpoint wraps POST errors safely: ${rel}`, async () => {
    const source = await readFile(new URL(rel, import.meta.url), "utf8");
    assert.match(source, /export\s+async\s+function\s+onRequestPost\s*\(\s*\{\s*request\s*,\s*env\s*\}\s*\)/);
    assert.match(source, /catch\s*\(\s*error\s*\)/);
    assert.match(source, /SUPABASE_URL_MISSING/);
    assert.match(source, /SUPABASE_SERVICE_ROLE_KEY_MISSING/);
    assert.match(source, /REST_legacy_auth_profiles_FAILED/);
    assert.match(source, /PGRST/);

    if (rel.includes("/register/")) {
      assert.match(source, /error:\s*safeCode/);
      assert.match(source, /stage/);
    } else {
      assert.match(source, /handleLegacyAuthError/);
      assert.match(source, /return\s+Response\.json\s*\(\s*\{\s*error:\s*safeCode/);
    }

    assert.doesNotMatch(source, /console\.error\([^\n]*password_hash/i);
    assert.doesNotMatch(source, /console\.error\([^\n]*password_salt/i);
  });
}
