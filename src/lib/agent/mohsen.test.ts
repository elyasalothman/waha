import test from "node:test";
import assert from "node:assert/strict";
import { requestMohsen, unavailableReply } from "./mohsen.ts";

const stub = (body: unknown, status = 200) =>
  (async () => Response.json(body, { status })) as typeof fetch;

test("محسن يستقبل السؤال الأصلي دون سجل أو تعليمات JSON ويعيد نصًا", async () => {
  const response = await requestMohsen("ما عاصمة السعودية؟", (async (url, init) => {
    assert.equal(url, "https://si.alhajda.com/api/chat");
    assert.deepEqual(JSON.parse(String(init?.body)), {
      message: "ما عاصمة السعودية؟",
      messages: [],
    });
    assert.ok(init?.signal);
    return Response.json({ success: true, reply: "الرياض." });
  }) as typeof fetch);
  assert.deepEqual(await response.json(), { reply: "الرياض." });
  assert.equal(response.headers.get("cache-control"), "no-store");
});
test("الأمر المنظم يبقى خاضعًا للتحقق", async () => {
  const response = await requestMohsen(
    "طلب",
    stub({ reply: '```json\n{"tool":"open_app","args":{"id":"calc"}}\n```' }),
  );
  assert.deepEqual(await response.json(), { command: { tool: "open_app", args: { id: "calc" } } });
});
for (const [label, fetcher] of [
  [
    "انقطاع",
    (async () => {
      throw new TypeError("network");
    }) as typeof fetch,
  ],
  [
    "مهلة",
    (async () => {
      throw new DOMException("timeout", "TimeoutError");
    }) as typeof fetch,
  ],
  ["خادم", stub({}, 503)],
  ["فشل معلن", stub({ success: false, reply: "خطأ" })],
  ["فارغ", stub({ reply: " " })],
  ["مسار داخلي", stub({ reply: "تعذّر المسار الداخلي" })],
  ["صيغة", stub({ reply: {} })],
  ["JSON تالف", stub({ reply: "{bad}" })],
  ["أداة ممنوعة", stub({ reply: '{"tool":"delete_data","args":{}}' })],
  ["حقول زائدة", stub({ reply: '{"tool":"live","args":{"url":"https://evil.test"}}' })],
] as const)
  test(`رجوع لطيف: ${label}`, async () => {
    const response = await requestMohsen("طلب", fetcher);
    assert.deepEqual(await response.json(), { reply: unavailableReply, unavailable: true });
  });
