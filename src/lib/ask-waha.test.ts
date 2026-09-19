import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_CITY } from "./cities.ts";
import { shadowDayNow } from "./shadow-day.ts";
import {
  classifyAsk,
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

function failMohsen(): never {
  throw new Error("mohsen must not be called");
}

describe("ask waha §6 battery", () => {
  it("1. next prayer answers from shadowDayNow with مدعوم", async () => {
    const local = await day();
    let mohsenCalls = 0;
    const res = await runAskWaha({
      mode: "chat",
      lang: "ar",
      messages: [{ role: "user", content: "متى الصلاة التالية؟" }],
      city: DEFAULT_CITY,
      now: NOW,
      weather: WEATHER,
      askMohsen: async () => {
        mohsenCalls += 1;
        return failMohsen();
      },
    });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.trust, "مدعوم");
    assert.equal(res.usedDay, true);
    assert.equal(res.kind, "day");
    assert.equal(res.searched, false);
    assert.match(res.text, new RegExp(local.nextPrayerAr));
    assert.match(res.text, new RegExp(local.nextPrayerAtAr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.equal(mohsenCalls, 0);
    assert.equal(res.source, "يوم واحة");
  });

  it("2. temperature answers from shadowDayNow with مدعوم", async () => {
    const res = await runAskWaha({
      mode: "chat",
      lang: "ar",
      messages: [{ role: "user", content: "كم الحرارة؟" }],
      city: DEFAULT_CITY,
      now: NOW,
      weather: WEATHER,
      askMohsen: async () => failMohsen(),
    });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.trust, "مدعوم");
    assert.equal(res.kind, "day");
    assert.match(res.text, /37°م/);
    assert.match(res.text, /الرياض/);
  });

  it("3. knowledge without sources becomes لا أعرف", async () => {
    const unsourced: MohsenFields = {
      reply: "التنين أزرق بحسب تخيّل شائع.",
      action: "من_النموذج_المفتوح",
      via: "open-model",
      source: "",
      citations: [],
      searched: true,
    };
    const res = await runAskWaha({
      mode: "chat",
      lang: "ar",
      messages: [{ role: "user", content: "ما لون التنين الذي يسكن قاع بئر زمزم سنة 3122؟" }],
      city: DEFAULT_CITY,
      now: NOW,
      weather: WEATHER,
      askMohsen: async () => unsourced,
    });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.trust, "لا أعرف");
    assert.equal(res.kind, "knowledge");
    assert.equal(res.citations, undefined);
    assert.match(res.text, /لا أعرف/);
    assert.doesNotMatch(res.text, /أزرق/);
  });

  it("4. mixed day + knowledge is جزئي", async () => {
    const res = await runAskWaha({
      mode: "chat",
      lang: "ar",
      messages: [{ role: "user", content: "متى الصلاة التالية ومن اخترع الهاتف؟" }],
      city: DEFAULT_CITY,
      now: NOW,
      weather: WEATHER,
      askMohsen: async () => ({
        reply: "لا مصدر موثوق للاختراع في هذه الجولة.",
        action: "لا_أعرف",
        via: "search-miss",
        source: "",
        citations: [],
        searched: true,
      }),
    });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.trust, "جزئي");
    assert.equal(res.kind, "mixed");
    assert.equal(res.usedDay, true);
    const local = await day();
    assert.match(res.text, new RegExp(local.nextPrayerAr));
    assert.match(res.text, /لا أعرف/);
  });

  it("5. greeting stays natural without a heavy badge", async () => {
    const res = await runAskWaha({
      mode: "chat",
      lang: "ar",
      messages: [{ role: "user", content: "مرحبا" }],
      city: DEFAULT_CITY,
      now: NOW,
      weather: WEATHER,
      askMohsen: async () => failMohsen(),
    });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.kind, "greeting");
    assert.equal(res.usedDay, true);
    assert.match(res.text, /حياك/);
    assert.doesNotMatch(res.text, /مدعوم|جزئي|لا أعرف/);
  });
});

describe("ask waha contracts", () => {
  it("cuts market LLM: translate/write stay unavailable", async () => {
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

  it("mohsen failure is an honest لا أعرف, not a silent grok fallback", async () => {
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
    assert.doesNotMatch(res.text, /992211/);
  });

  it("maps mohsen fields per spec", () => {
    assert.equal(mapMohsenTrust({ action: "من_المتن", via: "law", source: "", citations: [] }), "مدعوم");
    assert.equal(
      mapMohsenTrust({
        action: "جلب_حي",
        via: "search",
        source: "https://ar.wikipedia.org/wiki/x",
        citations: [{ title: "x", url: "https://ar.wikipedia.org/wiki/x" }],
      }),
      "مدعوم",
    );
    assert.equal(mapMohsenTrust({ action: "من_النموذج_المفتوح", via: "open-model", source: "", citations: [], searched: true }), "لا أعرف");
    assert.equal(mapMohsenTrust({ action: "لا_أعرف", via: "search-miss", source: "", citations: [] }), "لا أعرف");
  });

  it("classifies the five intents", () => {
    assert.equal(classifyAsk("متى الصلاة التالية؟"), "day");
    assert.equal(classifyAsk("كم الحرارة؟"), "day");
    assert.equal(classifyAsk("ما لون التنين الذي يسكن قاع بئر زمزم سنة 3122؟"), "knowledge");
    assert.equal(classifyAsk("متى الصلاة التالية ومن اخترع الهاتف؟"), "mixed");
    assert.equal(classifyAsk("مرحبا"), "greeting");
  });

  it("knowledge path does not call a market LLM", async () => {
    const { readFileSync } = await import("node:fs");
    const ai = readFileSync(new URL("./ai.ts", import.meta.url), "utf8");
    const core = readFileSync(new URL("./ask-waha.ts", import.meta.url), "utf8");
    assert.doesNotMatch(ai, /XAI_API_KEY|grok-4|https:\/\/api\.x\.ai/);
    assert.doesNotMatch(core, /XAI_API_KEY|grok-4|https:\/\/api\.x\.ai/);
    assert.match(core, /ai\.alhajda\.com\/api\/chat/);
  });
});
