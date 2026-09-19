/**
 * Guest-safe handling for Better Auth `/api/auth/get-session`.
 *
 * On the live host the route is often missing (404 HTML). That must not paint
 * an error overlay or leave the Square pending — a guest just reads.
 */

export const EMPTY_SESSION = { session: null, user: null } as const;

const GET_SESSION_RE = /\/api\/auth\/get-session(?:\?|#|$)/;

export function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  if (typeof Request !== "undefined" && input instanceof Request) return input.url;
  return String(input);
}

export function isGetSessionRequest(input: RequestInfo | URL): boolean {
  return GET_SESSION_RE.test(requestUrl(input));
}

export function isQuietSessionStatus(status: number): boolean {
  return status === 404;
}

export function isQuietSessionMiss(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const status = "status" in error ? Number((error as { status?: unknown }).status) : NaN;
  if (Number.isFinite(status) && isQuietSessionStatus(status)) return true;
  const message = "message" in error ? String((error as { message?: unknown }).message) : "";
  return /get-session/i.test(message) && /404|not found/i.test(message);
}

export function quietGuestSessionResponse(): Response {
  return new Response(JSON.stringify(EMPTY_SESSION), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

/**
 * Same-origin fetch, except a missing `/get-session` (404 or network) becomes
 * an empty session so Better Auth never throws into the UI.
 */
export async function fetchSessionQuietly(
  input: RequestInfo | URL,
  init?: RequestInit,
  fetchImpl: FetchLike = fetch,
): Promise<Response> {
  if (!isGetSessionRequest(input)) return fetchImpl(input, init);
  try {
    const res = await fetchImpl(input, init);
    if (isQuietSessionStatus(res.status)) return quietGuestSessionResponse();
    return res;
  } catch {
    return quietGuestSessionResponse();
  }
}

export function isQuietGetSessionError(ctx: {
  request?: RequestInfo | URL;
  url?: string;
  response?: { status?: number } | null;
  error?: unknown;
}): boolean {
  const target = ctx.request ?? ctx.url;
  if (target && !isGetSessionRequest(target)) return false;
  if (ctx.response?.status != null && isQuietSessionStatus(ctx.response.status)) return true;
  return isQuietSessionMiss(ctx.error);
}

/**
 * Session probe result for the UI. A miss (404 or any leftover error) is a
 * guest — never leave `isPending` stuck and never surface an error overlay.
 */
export function resolveSessionPresence(input: {
  hasUser: boolean;
  isPending: boolean;
  error?: unknown;
}): { isPending: boolean; signedOut: boolean } {
  if (isQuietSessionMiss(input.error)) return { isPending: false, signedOut: true };
  if (input.isPending) return { isPending: true, signedOut: false };
  return { isPending: false, signedOut: !input.hasUser };
}
