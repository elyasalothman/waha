import { createFileRoute } from "@tanstack/react-router";

async function handle({ request }: { request: Request }) {
  // Deployed identities must persist in Postgres; never fall back to an ephemeral
  // preview database or mint a guest identity in production.
  const path = new URL(request.url).pathname;
  const hasSession =
    request.headers.has("authorization") ||
    /(?:^|;\s*)(?:__Host-|__Secure-)?grok-auth\./.test(request.headers.get("cookie") ?? "");
  const configured = [
    "DATABASE_URL",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
    "GROK_AUTH_CLIENT_ID",
    "GROK_AUTH_CLIENT_SECRET",
  ].every((key) => process.env[key]?.trim());
  if (
    import.meta.env.PROD &&
    !configured &&
    !(request.method === "GET" && path === "/api/auth/get-session" && !hasSession)
  ) {
    return Response.json(
      {
        code: "AUTH_NOT_CONFIGURED",
        message: "تسجيل الدخول غير متاح مؤقتًا. يمكنك استخدام كتبك المحلية.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  const { auth } = await import("@/lib/auth/server");
  const response = await auth.handler(request);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const Route = createFileRoute("/api/auth/$")({
  server: { handlers: { GET: handle, POST: handle } },
});
