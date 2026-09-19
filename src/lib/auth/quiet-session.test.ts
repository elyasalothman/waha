import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_SESSION,
  fetchSessionQuietly,
  isGetSessionRequest,
  isQuietGetSessionError,
  isQuietSessionMiss,
  isQuietSessionStatus,
  quietGuestSessionResponse,
  resolveSessionPresence,
} from "./quiet-session.ts";

describe("quiet get-session — guest, not an error", () => {
  it("recognizes only the get-session path", () => {
    assert.equal(isGetSessionRequest("/api/auth/get-session"), true);
    assert.equal(isGetSessionRequest("https://waha.hajdah.com/api/auth/get-session?foo=1"), true);
    assert.equal(isGetSessionRequest("/api/auth/sign-out"), false);
    assert.equal(isGetSessionRequest("/api/auth/ok"), false);
  });

  it("treats 404 as a quiet miss", () => {
    assert.equal(isQuietSessionStatus(404), true);
    assert.equal(isQuietSessionStatus(200), false);
    assert.equal(isQuietSessionStatus(500), false);
    assert.equal(isQuietSessionMiss({ status: 404 }), true);
    assert.equal(isQuietSessionMiss({ message: "GET /api/auth/get-session 404" }), true);
    assert.equal(isQuietSessionMiss({ status: 500 }), false);
    assert.equal(isQuietSessionMiss(null), false);
  });

  it("rewrites get-session 404 HTML to an empty session", async () => {
    const res = await fetchSessionQuietly(
      "https://waha.hajdah.com/api/auth/get-session",
      undefined,
      async () =>
        new Response("<!doctype html>", {
          status: 404,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
    );
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), EMPTY_SESSION);
  });

  it("passes a real session through unchanged", async () => {
    const body = { session: { id: "s1" }, user: { id: "u1", name: "Elyas" } };
    const res = await fetchSessionQuietly("/api/auth/get-session", undefined, async () =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), body);
  });

  it("does not rewrite other auth 404s", async () => {
    const res = await fetchSessionQuietly("/api/auth/sign-out", undefined, async () =>
      new Response("no", { status: 404 }),
    );
    assert.equal(res.status, 404);
  });

  it("swallows a dropped get-session as an empty session", async () => {
    const res = await fetchSessionQuietly("/api/auth/get-session", undefined, async () => {
      throw new TypeError("Failed to fetch");
    });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), EMPTY_SESSION);
  });

  it("swallows a 404 get-session error context", () => {
    assert.equal(
      isQuietGetSessionError({
        request: "/api/auth/get-session",
        response: { status: 404 },
      }),
      true,
    );
    assert.equal(
      isQuietGetSessionError({
        request: "/api/auth/sign-out",
        response: { status: 404 },
      }),
      false,
    );
  });

  it("empty guest response is JSON 200", async () => {
    const res = quietGuestSessionResponse();
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type") ?? "", /json/);
    assert.deepEqual(await res.json(), { session: null, user: null });
  });

  it("resolves a 404 session into a signed-out guest — never pending", () => {
    assert.deepEqual(
      resolveSessionPresence({
        hasUser: false,
        isPending: true,
        error: { status: 404, message: "Not Found" },
      }),
      { isPending: false, signedOut: true },
    );
    assert.deepEqual(resolveSessionPresence({ hasUser: false, isPending: false }), {
      isPending: false,
      signedOut: true,
    });
    assert.deepEqual(resolveSessionPresence({ hasUser: true, isPending: false }), {
      isPending: false,
      signedOut: false,
    });
    assert.deepEqual(resolveSessionPresence({ hasUser: false, isPending: true }), {
      isPending: true,
      signedOut: false,
    });
  });
});
