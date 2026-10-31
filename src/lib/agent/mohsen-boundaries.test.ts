import test from "node:test";
import assert from "node:assert/strict";
import { parseMohsenReply, requestMohsen } from "./mohsen.ts";
import { plan, executePlan } from "./planner.ts";

const citation = { url: "https://www.spa.gov.sa/news", title: "واس" };
test("an explicit failed verification gate cannot be overridden by retrieval provenance", () => {
  for (const origin of ["web_retrieval", "owned_content"]) {
    const result = parseMohsenReply({
      reply: "لم أجد جوابًا متعلقًا بالسؤال",
      verified: false,
      citations: [citation],
      evidence: { origin, label: "retrieved but irrelevant" },
    });
    assert.equal(result.verified, false);
    assert.deepEqual(result.citations, [citation]);
  }
});

test("citations reject unsafe URLs, retain safe labels, and bound untrusted metadata", () => {
  const result = parseMohsenReply({
    reply: " جواب ",
    verified: true,
    source: "s".repeat(501),
    evidence: { label: "e".repeat(2001) },
    citations: [
      null,
      {},
      { url: "javascript:alert(1)" },
      { url: "http://example.org" },
      { url: "https://user:pass@example.org" },
      { url: "not a URL" },
      { url: "https://example.org", title: "t".repeat(301) },
      { url: "https://example.net" },
    ],
  });
  assert.equal(result.reply, "جواب");
  assert.deepEqual(result.citations, [
    { url: "https://example.org/", title: "t".repeat(300) },
    { url: "https://example.net/", title: "example.net" },
  ]);
  assert.equal(result.source?.length, 500);
  assert.equal(result.evidence?.length, 2000);
  assert.equal(
    parseMohsenReply({ reply: "جواب", verified: true, citations: [{ url: "http://example.org" }] })
      .verified,
    false,
  );
  assert.equal(
    parseMohsenReply({ reply: "جواب", citations: Array(30).fill(citation) }).citations.length,
    20,
  );
});

test("dated search prose survives transport without becoming verified just because it has links", async () => {
  const reply = "نُشر في 2025-01-03؛ تاريخ البحث 2026-10-31. هذه نتيجة قديمة.";
  const response = await requestMohsen("آخر الأخبار اليوم", (async () =>
    Response.json({
      reply,
      citations: [citation],
      source: "web",
      evidence: { origin: "model", label: "unverified" },
    })) as typeof fetch);
  const body = await response.json();
  assert.equal(body.reply, reply);
  assert.equal(body.verified, false);
});

test("specialist intents reach their specific tools instead of generic remote chat", () => {
  for (const [text, tool] of [
    ["ارسم قطة", "generate_image"],
    ["سو لي مقطع عن البحر", "make_clip"],
    ["حلل الملف", "analyze_file"],
    ["حسن سيرتي", "haqqiq_cv"],
    ["دربني على مقابلة", "haqqiq_interview"],
    ["خطط لهدفي", "haqqiq_plan"],
    ["كم عدد سكان السعودية", "ask_mohsen"],
    ["كم ٢٥×٤", "calculate"],
  ]) {
    const result = plan(text);
    assert.equal(result.steps.length, 1, text);
    assert.equal(result.steps[0].command.tool, tool, text);
  }
});

test("mixed understood and ambiguous requests never partially execute", async () => {
  const input = plan("افتح الحاسبة ثم افتح حاجة مجهولة");
  let calls = 0;
  const result = await executePlan(input, {
    execute: async () => {
      calls++;
    },
  });
  assert.equal(calls, 0);
  assert.ok(result.confidence < 0.5);
});
