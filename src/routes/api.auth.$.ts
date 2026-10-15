import { createFileRoute } from "@tanstack/react-router";
import { authAvailability } from "@/lib/auth/availability.server";

async function handle({ request }: { request: Request }) {
  // Deployed identities must persist in Postgres; never fall back to an ephemeral
  // preview database or mint a guest identity in production.
  const path = new URL(request.url).pathname;
  const hasSession =
    request.headers.has("authorization") ||
    /(?:^|;\s*)(?:__Host-|__Secure-)?grok-auth\./.test(request.headers.get("cookie") ?? "");
  const availability = authAvailability();
  const configured = /\/oauth2(?:\/|$)/.test(path) ? availability.google : availability.email;
  if (path === "/api/auth/request-password-reset" && !availability.passwordReset) {
    return Response.json(
      {
        code: "RESET_NOT_CONFIGURED",
        message: "استعادة كلمة المرور غير متاحة حاليًا. خدمة البريد لم تُهيأ بعد.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (
    import.meta.env.PROD &&
    !configured &&
    !(request.method === "GET" && path === "/api/auth/get-session" && !hasSession)
  ) {
    return Response.json(
      {
        code: "AUTH_NOT_CONFIGURED",
        message: "تسجيل الدخول غير متاح مؤقتًا. يمكنك تجربة واحة بدون حساب.",
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
