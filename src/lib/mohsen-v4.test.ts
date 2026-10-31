import test from "node:test";
import assert from "node:assert/strict";
import { validateUpload, mmRequest, readThreads, serviceError } from "./mohsen-v4.ts";

const limit = 10 * 1024 * 1024;
test("file analysis accepts supported extensions at the exact byte limit", () => {
  for (const extension of [
    "png",
    "JPG",
    "jpeg",
    "webp",
    "PDF",
    "docx",
    "xlsx",
    "txt",
    "csv",
    "md",
    "json",
  ]) {
    assert.doesNotThrow(() => validateUpload({ name: `report.${extension}`, size: limit }));
  }
});
test("file analysis rejects empty, oversized, invalid-size and disguised uploads", () => {
  for (const size of [0, -1, NaN, Infinity, limit + 1])
    assert.throws(() => validateUpload({ name: "report.pdf", size }), String(size));
  for (const name of ["report", "report.pdf.exe", "report.svg", "report.pdf\n"])
    assert.throws(() => validateUpload({ name, size: 1 }), name);
});
test("restored history drops unsafe citations while retaining valid evidence", () => {
  const threads = readThreads(
    JSON.stringify([
      {
        id: "one",
        title: "chat",
        messages: [
          {
            role: "assistant",
            content: "answer",
            verified: true,
            citations: [{ url: "javascript:alert(1)", title: "unsafe" }],
          },
          {
            role: "assistant",
            content: "answer",
            verified: true,
            citations: [{ url: "https://example.org", title: "source" }],
          },
        ],
      },
    ]),
  );
  assert.deepEqual(threads[0].messages[0].citations, []);
  assert.equal(threads[0].messages[1].verified, true);
});
test("multimodal rate limits surface quota guidance and never trigger an automatic retry", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    calls++;
    assert.equal(url, "https://si.alhajda.com/api/mm/analyze");
    assert.equal(init.credentials, "omit");
    assert.equal(init.cache, "no-store");
    assert.ok(init.signal);
    assert.ok(init.body instanceof FormData);
    assert.equal(new Headers(init.headers).has("content-type"), false);
    return new Response(null, { status: 429 });
  });
  await assert.rejects(mmRequest("/api/mm/analyze", new FormData()), {
    message: serviceError(429),
  });
  assert.equal(calls, 1);
});
test("multimodal cancellation and timeout have distinct actionable failures", async (t) => {
  const controller = new AbortController();
  controller.abort();
  t.mock.method(globalThis, "fetch", async () => {
    throw new DOMException("aborted", "AbortError");
  });
  await assert.rejects(mmRequest("/api/mm/analyze", {}, controller.signal), /توقف الطلب/);
  t.mock.method(globalThis, "fetch", async () => {
    throw new DOMException("timeout", "TimeoutError");
  });
  await assert.rejects(mmRequest("/api/mm/analyze", {}), /طال انتظار/);
});
