function getConfig(env) {
  const supabaseUrl = env?.SUPABASE_URL || env?.VITE_SUPABASE_URL;
  const serviceRoleKey = env?.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) throw new Error("SUPABASE_URL_MISSING");
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY_MISSING");

  return { supabaseUrl, serviceRoleKey };
}

export async function callRpc(env, fnName, params = {}) {
  const { supabaseUrl, serviceRoleKey } = getConfig(env);
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${fnName}`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(params),
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = json?.message || json?.hint || `RPC_${fnName}_FAILED`;
    const error = new Error(message);
    error.status = response.status;
    error.details = json;
    throw error;
  }

  return json;
}

export function readUserId(request) {
  const userId = request.headers.get("x-user-id") || request.headers.get("x-user-email");
  return userId ? userId.trim() : "";
}
