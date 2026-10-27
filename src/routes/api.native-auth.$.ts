import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "node:crypto";
import { authAvailability } from "@/lib/auth/availability.server";

/**
 * Native (Capacitor) Google / Apple sign-in handoff.
 *
 * Google refuses OAuth inside embedded WebViews, and Apple wants the system
 * sheet, so the app opens the flow in the SYSTEM browser (SFSafariViewController
 * / Chrome Custom Tab via @capacitor/browser). That browser has its own cookie
 * jar, so once sign-in completes there we hand the session back to the WebView:
 *
 *   1. App makes a random secret `nonce`, sends only `h = sha256(nonce)` to
 *      `GET /api/native-auth/start?provider=google&h=…` (system browser).
 *   2. OAuth runs; the provider returns to `/api/native-auth/done?h=…`, which
 *      mints a 3-minute hashed one-time token and parks it under `h`.
 *   3. The WebView polls `POST /api/native-auth/claim {nonce}`; the server
 *      hashes the nonce, consumes the parked token once, and verifies it, which
 *      sets the normal session cookie on the WebView. The app closes the browser.
 *
 * Only the holder of `nonce` (the WebView that started the flow) can claim.
 */
const HASH_RE = /^[a-f0-9]{64}$/;
const PROVIDERS = new Set(["google", "apple"]);
const noStore = { "Cache-Control": "no-store" };
const handoffId = (h: string) => `native-handoff:${h}`;

function page(title: string, body: string, ok: boolean, status = 200) {
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${title}</title><style>
body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#0c0d0c;color:#eef1ec;font-family:system-ui,-apple-system,"Segoe UI",Tahoma,sans-serif}
main{max-width:22rem;padding:2rem;text-align:center}.i{font-size:3rem}h1{font-size:1.4rem;margin:.5rem 0}p{line-height:1.8;color:#c5d0c4}
</style></head><body><main><div class="i" aria-hidden="true">${ok ? "✓" : "!"}</div><h1>${title}</h1><p>${body}</p></main></body></html>`;
  return new Response(html, {
    status,
    headers: { ...noStore, "Content-Type": "text/html; charset=utf-8" },
  });
}

async function start(request: Request, url: URL) {
  const provider = url.searchParams.get("provider") ?? "";
  const h = url.searchParams.get("h") ?? "";
  const availability = authAvailability();
  const enabled =
    (provider === "google" && availability.google) || (provider === "apple" && availability.apple);
  if (!PROVIDERS.has(provider) || !HASH_RE.test(h) || !enabled) {
    return page("تعذّر بدء الدخول", "هذه الطريقة غير متاحة الآن. ارجع إلى واحة وجرّب طريقة أخرى.", false, 400);
  }
  const { auth } = await import("@/lib/auth/server");
  const response = await auth.api.signInSocial({
    body: {
      provider: provider as "google" | "apple",
      callbackURL: `/api/native-auth/done?h=${h}`,
      errorCallbackURL: `/api/native-auth/done?h=${h}&error=1`,
      disableRedirect: true,
    },
    headers: request.headers,
    asResponse: true,
  });
  const data = (await response.clone().json().catch(() => null)) as { url?: string } | null;
  if (!response.ok || !data?.url) {
    return page("تعذّر بدء الدخول", "حدث خطأ أثناء التحويل. ارجع إلى واحة وأعد المحاولة.", false, 502);
  }
  const headers = new Headers({ ...noStore, Location: data.url });
  for (const cookie of response.headers.getSetCookie()) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 302, headers });
}

async function done(request: Request, url: URL) {
  const h = url.searchParams.get("h") ?? "";
  if (!HASH_RE.test(h) || url.searchParams.has("error")) {
    return page("لم يكتمل الدخول", "أُلغي الدخول أو انتهت صلاحيته. أغلق هذه النافذة وأعد المحاولة من واحة.", false);
  }
  const { auth } = await import("@/lib/auth/server");
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return page("لم يكتمل الدخول", "لم نتمكن من تأكيد حسابك. أغلق هذه النافذة وأعد المحاولة.", false);
  }
  const { token } = await auth.api.generateOneTimeToken({ headers: request.headers });
  const ctx = await auth.$context;
  await ctx.internalAdapter.createVerificationValue({
    identifier: handoffId(h),
    value: token,
    expiresAt: new Date(Date.now() + 3 * 60 * 1000),
  });
  return page("تم تسجيل الدخول", "عُد إلى واحة، سيكتمل الدخول تلقائيًا خلال لحظات.", true);
}

async function claim(request: Request) {
  const body = (await request.json().catch(() => null)) as { nonce?: unknown } | null;
  const nonce = typeof body?.nonce === "string" ? body.nonce : "";
  if (!/^[a-f0-9]{64}$/.test(nonce)) {
    return Response.json({ error: "bad_request" }, { status: 400, headers: noStore });
  }
  const h = createHash("sha256").update(nonce).digest("hex");
  const { auth } = await import("@/lib/auth/server");
  const ctx = await auth.$context;
  const parked = await ctx.internalAdapter.consumeVerificationValue(handoffId(h));
  if (!parked || new Date(parked.expiresAt) < new Date()) {
    return Response.json({ pending: true }, { status: 202, headers: noStore });
  }
  const response = await auth.api.verifyOneTimeToken({
    body: { token: parked.value },
    headers: request.headers,
    asResponse: true,
  });
  const headers = new Headers({ ...noStore, "Content-Type": "application/json" });
  for (const cookie of response.headers.getSetCookie()) headers.append("Set-Cookie", cookie);
  return new Response(JSON.stringify({ ok: response.ok }), {
    status: response.ok ? 200 : 400,
    headers,
  });
}

async function handle({ request }: { request: Request }) {
  const url = new URL(request.url);
  const action = url.pathname.replace(/^\/api\/native-auth\/?/, "");
  if (request.method === "GET" && action === "start") return start(request, url);
  if (request.method === "GET" && action === "done") return done(request, url);
  if (request.method === "POST" && action === "claim") return claim(request);
  return Response.json({ error: "not_found" }, { status: 404, headers: noStore });
}

export const Route = createFileRoute("/api/native-auth/$")({
  server: { handlers: { GET: handle, POST: handle } },
});
