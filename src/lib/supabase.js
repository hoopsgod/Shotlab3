const baseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
  const url = new URL(`${baseUrl}/rest/v1/${table}`);

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
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    return {
      data: null,
      error: data ?? { message: `Request failed with status ${response.status}` },
    };
  }

  return { data, error: null };
};

export const supabase = {
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
