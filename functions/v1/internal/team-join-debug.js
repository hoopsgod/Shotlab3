import { readTeamJoinEvents } from "../../_utils/teamJoinTelemetry.js";
import { requireApiToken } from "../../_utils/security.js";

export async function onRequestGet(context) {
  const { request } = context;
  const auth = requireApiToken(request, context.env);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const limit = Number.parseInt(new URL(request.url).searchParams.get("limit") || "100", 10);
  const events = readTeamJoinEvents(Number.isFinite(limit) ? limit : 100);

  return Response.json({ events, count: events.length }, { status: 200 });
}
