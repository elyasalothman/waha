import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ASK_MEDIA_BADGE,
  ASK_MEDIA_SOURCE,
  inspectMediaPolicy,
  mediaFailMessage,
  runAskMedia,
  sanitizeVisibleError,
  toUserMediaResult,
} from "./ask-media.ts";

const ADULT = "واحة هادئة عند الغروب، نخل وظل بالغ";

describe("ask media wave 1", () => {
  it("adult prompt calls Mohsen and returns badge + source محسن only", async () => {
    let called = 0;
    let body = "";
    const res = await runAskMedia({
      kind: "image",
      prompt: ADULT,
      lang: "ar",
      askMohsenMedia: async (input) => {
        called += 1;
        body = JSON.stringify(input);
        return {
          type: "json",
          status: 200,
          body: {
            ok: true,
            kind: "image",
            mime: "image/png",
            url: "https://ai.alhajda.com/media/oasis.png",
            provider: "fal",
            model: "hidden",
          },
        };
      },
    });
    assert.equal(called, 1);
    assert.match(body, /image/);
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.badge, ASK_MEDIA_BADGE);
    assert.equal(res.source_label, ASK_MEDIA_SOURCE);
    assert.equal(res.mime, "image/png");
    assert.equal(res.url, "https://ai.alhajda.com/media/oasis.png");
    assert.equal("provider" in res, false);
    assert.equal("model" in res, false);
    assert.doesNotMatch(JSON.stringify(res), /fal|replicate|xai|FAL_KEY/i);
  });

  it("minor prompt is policy_minor with no Mohsen call", async () => {
    let called = 0;
    const res = await runAskMedia({
      kind: "image",
      prompt: "طفل في السادسة يجلس في حديقة",
      lang: "ar",
      askMohsenMedia: async () => {
        called += 1;
        return { type: "json", status: 200, body: { ok: true, mime: "image/png", url: "https://example.com/x.png" } };
      },
    });
    assert.equal(called, 0);
    assert.equal(res.ok, false);
    if (res.ok) return;
    assert.equal(res.code, "policy_minor");
    assert.match(res.error, /قاصر/);
    assert.doesNotMatch(res.error, /fal|replicate/i);
  });

  it("video is stub from Mohsen with no provider call", async () => {
    let called = 0;
    const res = await runAskMedia({
      kind: "video",
      prompt: ADULT,
      lang: "ar",
      askMohsenMedia: async () => {
        called += 1;
        return { type: "json", status: 200, body: { ok: true } };
      },
    });
    assert.equal(called, 0);
    assert.equal(res.ok, false);
    if (res.ok) return;
    assert.equal(res.code, "stub");
    assert.equal(res.error, "قريباً من محسن");
  });

  it("missing engine is no_backend, not a vendor name", async () => {
    const res = await runAskMedia({
      kind: "image",
      prompt: ADULT,
      lang: "ar",
      askMohsenMedia: async () => ({
        type: "json",
        status: 503,
        body: { ok: false, code: "no_backend", error: "FAL_KEY missing on Fal" },
      }),
    });
    assert.equal(res.ok, false);
    if (res.ok) return;
    assert.equal(res.code, "no_backend");
    assert.doesNotMatch(res.error, /fal|replicate|FAL_KEY/i);
    assert.match(res.error, /البيت|محسن|غير متاح/);
  });

  it("no_provider stays honest without a fake URL", async () => {
    const res = await runAskMedia({
      kind: "image",
      prompt: ADULT,
      lang: "ar",
      askMohsenMedia: async () => ({
        type: "json",
        status: 200,
        body: { ok: false, code: "no_provider", error: "no engine" },
      }),
    });
    assert.equal(res.ok, false);
    if (res.ok) return;
    assert.equal(res.code, "no_provider");
    assert.equal("url" in res, false);
  });

  it("strips vendor names from visible errors", () => {
    assert.doesNotMatch(sanitizeVisibleError("upstream fal replicate xAI", "upstream"), /fal|replicate|xAI/i);
    assert.equal(inspectMediaPolicy("تعرية صورته المرفقة"), "policy_person_undress");
    assert.equal(inspectMediaPolicy(ADULT), null);
    assert.equal(mediaFailMessage("stub"), "قريباً من محسن");
  });

  it("drops provider/model before the user bubble", () => {
    const res = toUserMediaResult(
      {
        ok: true,
        kind: "image",
        mime: "image/webp",
        url: "https://cdn.example/a.webp",
        provider: "replicate",
        model: "secret",
      },
      "image",
    );
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.badge, "مولَّد بمحسن");
    assert.equal(res.source_label, "محسن");
    assert.doesNotMatch(JSON.stringify(res), /replicate|fal|secret/i);
  });

  it("client and UI never ship keys, xAI, Fal, or a Mohsen iframe", () => {
    const ai = readFileSync(new URL("./ai.ts", import.meta.url), "utf8");
    const core = readFileSync(new URL("./ask-media.ts", import.meta.url), "utf8");
    const chat = readFileSync(new URL("../apps/studio/chat.tsx", import.meta.url), "utf8");
    const home = readFileSync(new URL("../routes/index.tsx", import.meta.url), "utf8");
    const i18n = readFileSync(new URL("./i18n.ts", import.meta.url), "utf8");

    for (const src of [ai, core, chat]) {
      assert.doesNotMatch(src, /XAI_API_KEY|grok-4|https:\/\/api\.x\.ai/);
    }
    assert.match(core, /ai\.alhajda\.com\/api\/media\/generate/);
    assert.match(ai, /generateAskMedia/);
    assert.doesNotMatch(ai, /FAL_KEY|REPLICATE_API|fal\.ai|replicate\.com/);
    assert.match(chat, /generateAskMedia/);
    assert.match(chat, /ASK_MEDIA_BADGE/);
    assert.match(chat, /askLook/);
    assert.match(chat, /askImage/);
    assert.match(chat, /askVideo/);
    assert.doesNotMatch(chat, /<iframe/);
    assert.doesNotMatch(chat, /\bfal\b|\breplicate\b/i);
    assert.doesNotMatch(home, /askLook|askImage|أنشئ صورة/);
    assert.match(i18n, /مولَّد بمحسن/);
  });

  it("empty prompt is bad_request/empty without a network call", async () => {
    let called = 0;
    const res = await runAskMedia({
      kind: "image",
      prompt: "   ",
      askMohsenMedia: async () => {
        called += 1;
        return { type: "json", status: 200, body: { ok: true } };
      },
    });
    assert.equal(called, 0);
    assert.equal(res.ok, false);
    if (res.ok) return;
    assert.equal(res.code, "empty");
  });
});
