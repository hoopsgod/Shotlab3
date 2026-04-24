const baseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasConfig = Boolean(baseUrl && anonKey);

const buildHeaders = ({ upsert = false, onConflict } = {}) => {
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    "Content-Type": "application/json",
  };

  if (upsert) {
    headers.Prefer = "resolution=merge-duplicates,return=representation";
  }

  return headers;
};

const request = async (table, { method = "GET", body, upsert = false, onConflict } = {}) => {
  if (!hasConfig) {
    return {
      data: null,
      error: {
        code: "config_missing",
        message:
          "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.",
      },
    };
  }

  let url;
  try {
    url = new URL(`${baseUrl}/rest/v1/${table}`);
  } catch (error) {
    return {
      data: null,
      error: {
        code: "config_invalid",
        message: `Supabase URL is invalid: ${String(baseUrl)}`,
      },
    };
  }

  if (method === "GET") {
    url.searchParams.set("select", "*");
  }

  if (onConflict) {
    url.searchParams.set("on_conflict", onConflict);
  }

  const response = await fetch(url, {
    method,
    headers: buildHeaders({ upsert, onConflict }),
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (!response.ok) {
        return {
          data: null,
          error: {
            code: "invalid_json_error_response",
            message: "Supabase returned an invalid error payload.",
          },
        };
      }
      return {
        data: null,
        error: {
          code: "invalid_json_success_response",
          message: "Supabase returned an invalid success payload.",
        },
      };
    }
  }

  if (!response.ok) {
    return {
      data: null,
      error: data ?? { message: `Request failed with status ${response.status}` },
    };
  }

  return { data, error: null };
};

export const supabase = {
  isConfigured: hasConfig,
  from(table) {
    return {
      select() {
        return request(table);
      },
      upsert(values, options = {}) {
        return request(table, {
          method: "POST",
          body: Array.isArray(values) ? values : [values],
          upsert: true,
          onConflict: options.onConflict,
        });
      },
    };
  },
};
