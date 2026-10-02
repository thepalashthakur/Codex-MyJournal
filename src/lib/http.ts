import { NextRequest } from "next/server";
export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}
export function privateJson(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
}
