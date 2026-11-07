import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import {
  MARKET_LIVE_PAGE,
  MARKET_LIVE_PLAYLIST,
  browserCanPlayHls,
  pictureFollow,
  pictureHeld,
  playbackPlan,
} from "./market-live.ts";

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
  assert.match(page, /تشغيل الصورة/);
  assert.match(page, /تشغيل الصوت/);
  assert.match(page, /hls\.js/);
  assert.match(page, /صفحة البث على منضدة السوق/);
  assert.doesNotMatch(page, /autoPlay|autoplay|إعادة الاتصال|الصورة تعمل/);
  assert.equal(playbackPlan({ playlistReadable: true, mse: true, nativeHls: true }), "mse");
  assert.equal(playbackPlan({ playlistReadable: false, mse: true, nativeHls: true }), "native");
  assert.equal(playbackPlan({ playlistReadable: false, mse: false, nativeHls: false }), "unavailable");
  assert.equal(pictureHeld(null, { time: 0, width: 0 }, 1000), "wait");
  assert.equal(pictureHeld(10, { time: 12.1, width: 1280 }, 4000), "playing");
  assert.equal(pictureHeld(null, { time: 0, width: 0 }, 12000), "failed");
  assert.equal(
    pictureFollow({ time: 12, at: 0 }, { time: 14, width: 1280, error: false, ended: false }, 2000),
    "playing",
  );
  assert.equal(
    pictureFollow({ time: 14, at: 0 }, { time: 14, width: 1280, error: false, ended: false }, 1000),
    "playing",
  );
  assert.equal(
    pictureFollow({ time: 14, at: 0 }, { time: 14, width: 0, error: false, ended: false }, 8000),
    "stalled",
  );
  assert.equal(
    pictureFollow({ time: 14, at: 0 }, { time: 14, width: 1280, error: true, ended: false }, 100),
    "ended",
  );
  assert.match(page, /pictureFollow/);
  assert.match(page, /AbortSignal\.timeout|abort\(/);
  assert.match(page, /import\("hls\.js"\)/);
  assert.doesNotMatch(page, /بلا مستوى مسموع|المقطع عند المصدر بلا/);
});
