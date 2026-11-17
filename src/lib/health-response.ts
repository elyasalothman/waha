/** Public liveness response. Keep this independent of credentials and databases. */
export function healthResponse(): Response {
  return Response.json(
    { status: "ok" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
