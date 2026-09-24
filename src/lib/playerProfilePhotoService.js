import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";
import { isDemoAccount } from "./demoMode.js";

export async function savePlayerProfilePhoto(id, file) {
  if (isDemoAccount(id)) return URL.createObjectURL(file);
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/v1/player-photo", { method: "POST", headers: buildApiIdentityHeaders({ requester: id }), body });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.photo_url) throw Error(data.message || "Upload failed.");
  return data.photo_url;
}
