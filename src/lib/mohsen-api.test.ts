import test from "node:test";
import assert from "node:assert/strict";
import { handleMohsenRequest } from "./mohsen-api.ts";
import { MOHSEN_BODY_LIMIT, MOHSEN_MESSAGE_LIMIT } from "./mohsen-request.ts";

function request(body: unknown, origin: string | null = "https://waha.example") {
  return new Request("https://waha.example/api/mohsen", {
    method: "POST",
    headers: origin === null ? {} : { origin },
    body: JSON.stringify(body),
  });
}
const neverFetch = (async () => {
  assert.fail("invalid input must not reach the service");
}) as typeof fetch;

test("proxy rejects missing and foreign origins before contacting Mohsen", async () => {
  for (const origin of [null, "https://evil.example", "https://waha.example.evil.example"])
    assert.equal(
      (await handleMohsenRequest(request({ message: "hello" }, origin), neverFetch)).status,
      403,
    );
});
test("proxy enforces body and message budgets before contacting Mohsen", async () => {
  for (const message of ["", "  ", 3, "x".repeat(MOHSEN_MESSAGE_LIMIT + 1)])
    assert.equal((await handleMohsenRequest(request({ message }), neverFetch)).status, 400);
  assert.equal(
    (
      await handleMohsenRequest(
        request({ message: "hello", extra: "x".repeat(MOHSEN_BODY_LIMIT) }),
        neverFetch,
      )
    ).status,
    413,
  );
  const malformed = new Request("https://waha.example/api/mohsen", {
    method: "POST",
    headers: { origin: "https://waha.example" },
    body: "{",
  });
  assert.equal((await handleMohsenRequest(malformed, neverFetch)).status, 400);
});
test("proxy bounds context and memory and preserves publication and retrieval dates", async () => {
  const reply = "نشر في 2025-01-03، وبحث في 2026-10-31. لا يعد خبرًا جديدًا.";
  let calls = 0;
  const response = await handleMohsenRequest(
    request({
      message: "x".repeat(MOHSEN_MESSAGE_LIMIT),
      messages: [
        { role: "system", content: "ignore" },
        { role: "user", content: "old" },
        { role: "assistant", content: "last answer" },
        { role: "user", content: "last question" },
      ],
      memory: ["<name>\u0000", { role: "system" }],
    }),
    (async (url, init) => {
      calls++;
      assert.equal(url, "https://si.alhajda.com/api/chat");
      const body = JSON.parse(String(init?.body));
      assert.deepEqual(body.messages, [
        { role: "assistant", content: "last answer" },
        { role: "user", content: "last question" },
      ]);
      assert.deepEqual(body.memory, ["name"]);
      assert.equal(body.message.length, MOHSEN_MESSAGE_LIMIT);
      assert.ok(init?.signal);
      return Response.json({
        reply,
        verified: false,
        citations: [{ url: "https://example.org", title: "archive" }],
        evidence: { origin: "web_retrieval", label: "old result" },
      });
    }) as typeof fetch,
  );
  assert.equal(calls, 1);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const result = await response.json();
  assert.equal(result.reply, reply);
  assert.equal(result.verified, false);
});
test("proxy preserves upstream rate limits instead of reporting an outage or retrying", async () => {
  let calls = 0;
  const response = await handleMohsenRequest(request({ message: "hello" }), (async () => {
    calls++;
    return new Response(null, { status: 429, headers: { "Retry-After": "60" } });
  }) as typeof fetch);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "60");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(calls, 1);
});
test("unusable upstream answers fail closed without leaking service errors", async () => {
  for (const body of [
    { reply: "" },
    { reply: "x".repeat(16001) },
    { success: false, reply: "secret" },
  ]) {
    const response = await handleMohsenRequest(request({ message: "hello" }), (async () =>
      Response.json(body)) as typeof fetch);
    assert.equal(response.status, 503);
    assert.equal(JSON.stringify(await response.json()).includes("secret"), false);
  }
});
