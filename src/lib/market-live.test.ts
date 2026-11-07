import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { MARKET_LIVE_PAGE, MARKET_LIVE_PLAYLIST, browserCanPlayHls } from "./market-live.ts";

test("the broadcast is the public Hudoo TV playlist, not a quote page", () => {
  assert.equal(MARKET_LIVE_PAGE, "https://market.alhajda.com/live");
  assert.equal(MARKET_LIVE_PLAYLIST, "https://tv.alhajda.com/hls/tv.m3u8");
  assert.equal(browserCanPlayHls({ canPlayType: () => "" }), false);
  assert.equal(browserCanPlayHls({ canPlayType: () => "maybe" }), true);
});

test("Waha does not iframe the market page", () => {
  const page = readFileSync(new URL("../routes/live.tsx", import.meta.url), "utf8");
  assert.match(page, /MARKET_LIVE_PLAYLIST/);
  assert.doesNotMatch(page, /<iframe/);
  assert.match(page, /muted/);
  assert.match(page, /تجربة واحدة صامتة/);
  assert.match(page, /فتح البث على منضدة السوق/);
  assert.doesNotMatch(page, /autoPlay|autoplay|إعادة الاتصال|الصورة تعمل/);
});
