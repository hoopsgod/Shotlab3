import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  onRequestGet as getTrainingCatalog,
  onRequestPost as syncTrainingCatalog,
} from "../functions/v1/training-catalog/index.js";
import {
  createTrainingCatalogPersistenceService,
  customTrainingCatalog,
  splitTrainingCatalog,
} from "../src/lib/trainingCatalogPersistenceService.js";

const ENV = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  SUPABASE_ANON_KEY: "anon-key",
};

const CUSTOM_HOME = {
  id: "custom-home-1",
  team_id: "team-a",
  mode: "home",
  name: "Arc Shooting",
  desc: "Five spots",
  instructions: "Make ten at each spot.",
  max: 50,
  icon: "3p",
  sortOrder: 0,
};

const CUSTOM_PROGRAM = {
  id: "custom-program-1",
  team_id: "team-a",
  mode: "program",
  name: "Pressure Free Throws",
  desc: "Team standard",
  instructions: "Two sets of ten.",
  max: 20,
  icon: "ft",
  sortOrder: 0,
};

function context({ method = "GET", path = "/v1/training-catalog", body, headers = {}, host = "shotlab.test" } = {}) {
  return {
    request: new Request(`https://${host}${path}`, {
      method,
      headers: { ...(body === undefined ? {} : { "content-type": "application/json" }), ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
    env: ENV,
  };
}

function eqValue(value) {
  const raw = String(value || "");
  return decodeURIComponent(raw.startsWith("eq.") ? raw.slice(3) : raw);
}

function matches(row, url) {
  for (const [key, value] of url.searchParams.entries()) {
    if (["select", "order", "limit", "on_conflict"].includes(key)) continue;
    if (String(row?.[key] ?? "") !== eqValue(value)) return false;
  }
  return true;
}

function installBackend({ requester = "coach@example.com", role = "coach", teamId = "team-a", drills = [CUSTOM_HOME] } = {}) {
  const originalFetch = global.fetch;
  const calls = [];
  const state = { training_drills: drills.map((row) => ({
    team_id: row.team_id,
    id: row.id,
    mode: row.mode,
    name: row.name,
    description: row.desc,
    instructions: row.instructions,
    max_score: row.max,
    icon: row.icon,
    sort_order: row.sortOrder,
    updated_by: requester,
  })) };

  global.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ url: url.toString(), method, body });

    if (url.pathname.endsWith("/rpc/resolve_app_user_uuid")) return Response.json(`uuid-${requester.split("@")[0]}`);
    if (url.pathname.endsWith("/legacy_auth_profiles")) return Response.json([{ team_id: teamId, role }]);
    if (url.pathname.endsWith("/team_memberships")) return Response.json([{ team_id: teamId, role, status: "active" }]);
    if (url.pathname.endsWith("/teams")) return Response.json(role === "coach" ? [{ id: teamId, coach_user_id: `uuid-${requester.split("@")[0]}` }] : []);
    if (url.pathname.endsWith("/training_drills")) {
      const rows = state.training_drills;
      if (method === "GET") return Response.json(rows.filter((row) => matches(row, url)));
      if (method === "POST") {
        const incoming = Array.isArray(body) ? body : [body];
        for (const row of incoming) {
          const index = rows.findIndex((existing) => existing.team_id === row.team_id && existing.id === row.id);
          if (index >= 0) rows[index] = { ...rows[index], ...row };
          else rows.push({ ...row });
        }
        return Response.json(incoming, { status: 201 });
      }
      if (method === "DELETE") {
        const removed = rows.filter((row) => matches(row, url));
        state.training_drills = rows.filter((row) => !matches(row, url));
        return Response.json(removed);
      }
    }
    return Response.json([]);
  };

  return { calls, state, restore() { global.fetch = originalFetch; } };
}

function memoryStorage(entries = []) {
  const values = new Map(entries);
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
  };
}

test("production email headers are not accepted as training-catalog identity proof", async () => {
  const response = await getTrainingCatalog(context({
    host: "app.shotlab.com",
    headers: { "x-user-id": "coach@example.com" },
  }));
  assert.equal(response.status, 401);
});

test("players may read their team catalog but only coaches may replace it", async () => {
  const backend = installBackend({ requester: "player@example.com", role: "player" });
  try {
    const read = await getTrainingCatalog(context({
      path: "/v1/training-catalog?team_id=team-a",
      headers: { "x-user-id": "player@example.com" },
    }));
    assert.equal(read.status, 200);
    assert.equal((await read.json()).drills[0].id, CUSTOM_HOME.id);

    const crossTeam = await getTrainingCatalog(context({
      path: "/v1/training-catalog?team_id=team-b",
      headers: { "x-user-id": "player@example.com" },
    }));
    assert.equal(crossTeam.status, 403);

    const write = await syncTrainingCatalog(context({
      method: "POST",
      headers: { "x-user-id": "player@example.com" },
      body: { team_id: "team-a", drills: [CUSTOM_PROGRAM] },
    }));
    assert.equal(write.status, 403);
    assert.deepEqual(backend.state.training_drills.map((row) => row.id), [CUSTOM_HOME.id]);
  } finally {
    backend.restore();
  }
});

test("coach synchronization is team-scoped and removes only omitted custom drills", async () => {
  const backend = installBackend({ drills: [CUSTOM_HOME, CUSTOM_PROGRAM] });
  try {
    const sync = await syncTrainingCatalog(context({
      method: "POST",
      headers: { "x-user-id": "coach@example.com" },
      body: {
        team_id: "team-a",
        drills: [{ ...CUSTOM_PROGRAM, name: "Pressure Free Throws Updated" }],
      },
    }));
    assert.equal(sync.status, 200);
    const body = await sync.json();
    assert.equal(body.deleted_count, 1);
    assert.deepEqual(backend.state.training_drills.map((row) => row.id), [CUSTOM_PROGRAM.id]);
    assert.equal(backend.state.training_drills[0].name, "Pressure Free Throws Updated");
    assert.equal(backend.state.training_drills[0].updated_by, "coach@example.com");
  } finally {
    backend.restore();
  }
});

test("client promotion preserves existing local custom drills and never uploads static defaults", async () => {
  const storage = memoryStorage([
    ["sl:session", JSON.stringify({ email: "coach@example.com", teamId: "team-a", role: "coach" })],
    ["sl:players", JSON.stringify([{ email: "coach@example.com", teamId: "team-a", role: "coach" }])],
    ["sl:supabase-session", JSON.stringify({ access_token: "user-token" })],
  ]);
  const requests = [];
  const service = createTrainingCatalogPersistenceService({
    storage,
    fetchImpl: async (input, init = {}) => {
      requests.push({ input: String(input), init });
      if (String(init.method || "GET").toUpperCase() === "GET") {
        return Response.json({ ok: true, storage_mode: "signed_api", team_id: "team-a", can_write: true, drills: [] });
      }
      const body = JSON.parse(init.body);
      return Response.json({ ok: true, storage_mode: "signed_api", team_id: "team-a", drills: body.drills });
    },
  });
  const defaultHome = { id: "demo-home-1", name: "Static default", mode: "home", isDefaultDemo: true };
  const result = await service.hydrateCatalog({
    localHomeDrills: [defaultHome, CUSTOM_HOME],
    localProgramDrills: [CUSTOM_PROGRAM],
  });
  assert.equal(result.promotedLocalCatalog, true);
  assert.deepEqual(result.homeDrills.map((row) => row.id), [CUSTOM_HOME.id]);
  assert.deepEqual(result.programDrills.map((row) => row.id), [CUSTOM_PROGRAM.id]);
  const posted = JSON.parse(requests[1].init.body);
  assert.deepEqual(posted.drills.map((row) => row.id).sort(), [CUSTOM_HOME.id, CUSTOM_PROGRAM.id].sort());
  assert.equal(posted.drills.some((row) => row.id === defaultHome.id), false);
  assert.equal(new Headers(requests[1].init.headers).get("authorization"), "Bearer user-token");
});

test("malformed successful responses never replace the local training catalog", async () => {
  const service = createTrainingCatalogPersistenceService({
    storage: memoryStorage([
      ["sl:session", JSON.stringify({ email: "player@example.com", teamId: "team-a", role: "player" })],
    ]),
    fetchImpl: async () => new Response("<!doctype html><title>ShotLab</title>", {
      status: 200,
      headers: { "content-type": "text/html" },
    }),
  });

  await assert.rejects(
    service.hydrateCatalog({
      localHomeDrills: [CUSTOM_HOME],
      localProgramDrills: [CUSTOM_PROGRAM],
    }),
    (error) => error?.code === "training_catalog_load_failed",
  );
});

test("catalog helpers partition modes and filter default definitions", () => {
  assert.deepEqual(splitTrainingCatalog([CUSTOM_HOME, CUSTOM_PROGRAM]), {
    homeDrills: [CUSTOM_HOME],
    programDrills: [CUSTOM_PROGRAM],
  });
  const rows = customTrainingCatalog(
    [{ id: "default", isDefaultDemo: true }, CUSTOM_HOME],
    [CUSTOM_PROGRAM],
  );
  assert.deepEqual(rows.map((row) => row.mode), ["home", "program"]);
  assert.equal(rows.some((row) => row.id === "default"), false);
});

test("migration and App integration enforce signed catalog persistence", () => {
  const migration = fs.readFileSync(new URL("../migrations/051_training_catalog_signed_api.sql", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(migration, /create table if not exists public\.training_drills/i);
  assert.match(migration, /primary key \(team_id, id\)/i);
  assert.match(migration, /alter table public\.training_drills enable row level security/i);
  assert.match(migration, /revoke all privileges on table public\.training_drills from public, anon, authenticated/i);
  assert.match(migration, /grant select, insert, update, delete on table public\.training_drills to service_role/i);
  assert.doesNotMatch(migration, /create policy/i);
  assert.match(app, /trainingCatalogPersistence\.hydrateCatalog/);
  assert.match(app, /trainingCatalogPersistence\.syncCatalog/);
  assert.match(app, /persistTrainingCatalog/);
});
