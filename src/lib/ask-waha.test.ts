import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_CITY } from "./cities.ts";
import { shadowDayNow } from "./shadow-day.ts";
import {
  composeMohsenMessage,
  isGreetingOnly,
  looksLikePrivateDocument,
  mapMohsenTrust,
  runAskWaha,
  safeCitations,
  type MohsenFields,
} from "./ask-waha.ts";

const NOW = new Date("2026-09-19T14:10:00+03:00");
const WEATHER = { c: 37, labelAr: "صافٍ", labelEn: "Clear" };

async function day() {
  return shadowDayNow({ city: DEFAULT_CITY, now: NOW, weather: WEATHER });
}

describe("ask waha §5 smoke", () => {
  it("1. هوية/بيت → مدعوم (متن محسن)", async () => {
    let sent = "";
    const res = await runAskWaha({
      mode: "chat",
      lang: "ar",
      messages: [{ role: "user", content: "من أنت؟" }],
      city: DEFAULT_CITY,
      now: NOW,
      weather: WEATHER,
      askMohsen: async (input) => {
        sent = input.message;
        return {
          reply: "أنا محسن، مساعد عربي من بيت الهجدة.",
          action: "من_المتن",
          via: "law",
          source: "",
          citations: [],
          searched: false,
        };
      },
    });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.trust, "مدعوم");
    assert.equal(res.usedDay, true);
    assert.match(sent, /يوم المستخدم/);
    assert.match(sent, /من أنت؟/);
    assert.match(res.text, /محسن|الهجدة|واحة/);
  });

  it("2. صلاة تالية / طقس مع يوم في السياق → مدعوم ورقم منطقي", async () => {
    const local = await day();
    let sent = "";
    const prayer = await runAskWaha({
      mode: "chat",
      lang: "ar",
      messages: [{ role: "user", content: "متى الصلاة التالية؟" }],
      city: DEFAULT_CITY,
      now: NOW,
      weather: WEATHER,
      askMohsen: async (input) => {
        sent = input.message;
        return {
          reply: `الصلاة التالية ${local.nextPrayerAr} الساعة ${local.nextPrayerAtAr}.`,
          action: "حساب_مباشر",
          via: "calc",
          source: "",
          citations: [],
          searched: false,
        };
      },
    });
    assert.equal(prayer.ok, true);
    if (!prayer.ok) return;
    assert.equal(prayer.trust, "مدعوم");
    assert.equal(prayer.usedDay, true);
    assert.match(sent, /يوم المستخدم/);
    assert.match(sent, new RegExp(local.nextPrayerAr));
    assert.match(prayer.text, new RegExp(local.nextPrayerAr));
    assert.match(prayer.text, /\d|٠|١|٢|٣|٤|٥|٦|٧|٨|٩/);

    const weather = await runAskWaha({
      mode: "chat",
      lang: "ar",
      messages: [{ role: "user", content: "كم الحرارة؟" }],
      city: DEFAULT_CITY,
      now: NOW,
      weather: WEATHER,
      askMohsen: async () => ({
        reply: `الحرارة في الرياض ${WEATHER.c}°م.`,
        action: "من_النموذج_المفتوح",
        via: "open-model",
        source: "",
        citations: [],
        searched: false,
      }),
    });
    assert.equal(weather.ok, true);
    if (!weather.ok) return;
    assert.equal(weather.trust, "مدعوم");
    assert.match(weather.text, /37/);
  });

  it("3. سؤال عبثي/بلا دليل بعد بحث → لا أعرف (لا اختلاق)", async () => {
    const res = await runAskWaha({
      mode: "chat",
      lang: "ar",
      messages: [{ role: "user", content: "ما لون التنين الذي يسكن قاع بئر زمزم سنة 3122؟" }],
      city: DEFAULT_CITY,
      now: NOW,
      weather: WEATHER,
      askMohsen: async () => ({
        reply: "لا أعرف لون تنين في بئر زمزم.",
        action: "لا_أعرف",
        via: "search-miss",
        source: "",
        citations: [],
        searched: true,
      }),
    });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.trust, "لا أعرف");
    assert.match(res.text, /لا أعرف/);
    assert.doesNotMatch(res.text, /أزرق|أخضر|أحمر/);
  });

  it("4. بلا XAI_API_KEY يعمل الشات (لم يعد يعتمد عليه)", async () => {
    delete process.env.XAI_API_KEY;
    const res = await runAskWaha({
      mode: "chat",
      lang: "ar",
      messages: [{ role: "user", content: "من أنت؟" }],
      city: DEFAULT_CITY,
      now: NOW,
      weather: WEATHER,
      askMohsen: async () => ({
        reply: "أنا واحة عبر محسن.",
        action: "من_المتن",
        via: "law",
        source: "",
        citations: [],
        searched: false,
      }),
    });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.trust, "مدعوم");
    const { readFileSync } = await import("node:fs");
    const ai = readFileSync(new URL("./ai.ts", import.meta.url), "utf8");
    const core = readFileSync(new URL("./ask-waha.ts", import.meta.url), "utf8");
    assert.doesNotMatch(ai, /XAI_API_KEY|grok-4|https:\/\/api\.x\.ai/);
    assert.doesNotMatch(core, /XAI_API_KEY|grok-4|https:\/\/api\.x\.ai/);
    assert.match(core, /ai\.alhajda\.com\/api\/chat/);
  });

  it("5. فشل محسن → عجز صادق + لا أعرف، بلا رجوع لـ Grok", async () => {
    const res = await runAskWaha({
      mode: "chat",
      lang: "ar",
      messages: [{ role: "user", content: "من بنى الأهرامات؟" }],
      city: DEFAULT_CITY,
      now: NOW,
      weather: WEATHER,
      askMohsen: async () => {
        throw new Error("network");
      },
    });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.trust, "لا أعرف");
    assert.match(res.text, /لا أعرف|تعذّر/);
    assert.doesNotMatch(res.text, /Grok|xAI|grok/i);
  });
});

describe("ask waha contracts", () => {
  it("translate/write stay unavailable with no market LLM fallback", async () => {
    const tr = await runAskWaha({
      mode: "translate",
      lang: "ar",
      messages: [{ role: "user", content: "ترجم مرحبا" }],
    });
    const wr = await runAskWaha({
      mode: "write",
      lang: "ar",
      messages: [{ role: "user", content: "اكتب رسالة" }],
    });
    assert.deepEqual(tr, { ok: false, error: "unavailable" });
    assert.deepEqual(wr, { ok: false, error: "unavailable" });
  });

  it("maps action/via per spec table", () => {
    assert.equal(mapMohsenTrust({ action: "من_المتن", via: "law" }), "مدعوم");
    assert.equal(mapMohsenTrust({ action: "جلب_حي", via: "live", source: "https://example.com" }), "مدعوم");
    assert.equal(mapMohsenTrust({ action: "جلب_حي", via: "search", source: "https://example.com" }), "مدعوم");
    assert.equal(mapMohsenTrust({ action: "حساب_مباشر", via: "calc" }), "مدعوم");
    assert.equal(mapMohsenTrust({ action: "من_النموذج_المفتوح", via: "open-model", searched: true }), "جزئي");
    assert.equal(mapMohsenTrust({ action: "توضيح", via: "clarify" }), "جزئي");
    assert.equal(mapMohsenTrust({ action: "من_المتن", via: "open-model", searched: true }), "جزئي");
    assert.equal(mapMohsenTrust({ action: "لا_أعرف", via: "search-miss" }), "لا أعرف");
    assert.equal(mapMohsenTrust({ action: "ارفض", via: "law" }), "لا أعرف");
    assert.equal(mapMohsenTrust({ action: "من_المتن", via: "paused" }), "لا أعرف");
  });

  it("never fabricates citation URLs", () => {
    assert.deepEqual(safeCitations("not-an-array", "javascript:alert(1)"), []);
    assert.deepEqual(safeCitations([{ title: "x", url: "notaurl" }], undefined), []);
    assert.deepEqual(safeCitations([{ title: "Wiki", url: "https://ar.wikipedia.org/wiki/Oasis" }], undefined), [
      { title: "Wiki", url: "https://ar.wikipedia.org/wiki/Oasis" },
    ]);
  });

  it("does not ship private documents to mohsen", async () => {
    const doc =
      "فاتورة رقم 992211 وهوية وطنية 1234567890 وجواز سفر A1234567 وتفاصيل بنود طويلة ".repeat(8);
    assert.equal(looksLikePrivateDocument(doc), true);
    let sent = "";
    const res = await runAskWaha({
      mode: "chat",
      lang: "ar",
      messages: [{ role: "user", content: doc }],
      city: DEFAULT_CITY,
      now: NOW,
      weather: WEATHER,
      askMohsen: async (input) => {
        sent = input.message;
        return { reply: "ok", action: "من_المتن", via: "law", source: "", citations: [], searched: false };
      },
    });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(sent, "");
    assert.match(res.text, /وثيق/);
  });

  it("hides a heavy badge on a simple greeting", async () => {
    assert.equal(isGreetingOnly("مرحبا"), true);
    const res = await runAskWaha({
      mode: "chat",
      lang: "ar",
      messages: [{ role: "user", content: "مرحبا" }],
      city: DEFAULT_CITY,
      now: NOW,
      weather: WEATHER,
      askMohsen: async () => ({
        reply: "يا هلا وسهلا! كيف أقدر أساعدك؟",
        action: "من_المتن",
        via: "greet",
        source: "",
        citations: [],
        searched: false,
      }),
    });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.kind, "greeting");
    assert.doesNotMatch(res.text, /مدعوم|جزئي/);
  });

  it("chat always posts day context to mohsen", async () => {
    const local = await day();
    const expected = composeMohsenMessage(local, "من أنت؟");
    let sent = "";
    await runAskWaha({
      mode: "chat",
      lang: "ar",
      messages: [{ role: "user", content: "من أنت؟" }],
      city: DEFAULT_CITY,
      now: NOW,
      weather: WEATHER,
      askMohsen: async (input) => {
        sent = input.message;
        return { reply: "متن", action: "من_المتن", via: "law", source: "", citations: [], searched: false };
      },
    });
    assert.equal(sent, expected);
    assert.match(sent, /يوم المستخدم:/);
  });
});
