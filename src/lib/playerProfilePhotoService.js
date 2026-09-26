import { buildApiIdentityHeaders } from "./apiIdentityHeaders.js";
import { isDemoAccount } from "./demoMode.js";

export async function savePlayerProfilePhoto(id, file) {
  if (isDemoAccount(id)) return URL.createObjectURL(file);
  const body = new FormData();
  body.append("file", file);
  body.append("player_email", id);
  const data = await (await fetch("/v1/player-photo", { method: "POST", headers: buildApiIdentityHeaders(), body })).json();
  if (!data.photo_url) throw Error();
  return data.photo_url;
}
