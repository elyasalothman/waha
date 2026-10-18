import { test } from "node:test";
import assert from "node:assert/strict";
import { detectShieldPlatform, profileOpenHref, probeShield, checkDomain, SHIELD_PROFILE_URL } from "./dns-shield.ts";

const IPHONE_SAFARI = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const IPHONE_CHROME = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1";
const IPHONE_WEBVIEW = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const IPAD_DESKTOP = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const ANDROID = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Mobile Safari/537.36";
const WIN = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36 Edg/130";

test("platform detection routes iOS profile installs through Safari", () => {
  assert.equal(detectShieldPlatform(IPHONE_SAFARI), "ios-safari");
  assert.equal(detectShieldPlatform(IPHONE_SAFARI, { standalone: true }), "ios-other");
  assert.equal(detectShieldPlatform(IPHONE_CHROME), "ios-other");
  assert.equal(detectShieldPlatform(IPHONE_WEBVIEW), "ios-other");
  assert.equal(detectShieldPlatform(IPHONE_WEBVIEW, { native: true }), "ios-native");
  assert.equal(detectShieldPlatform(IPAD_DESKTOP, { maxTouchPoints: 5 }), "ios-safari");
  assert.equal(detectShieldPlatform(IPAD_DESKTOP, { maxTouchPoints: 0 }), "mac-safari");
  assert.equal(detectShieldPlatform(ANDROID), "android");
  assert.equal(detectShieldPlatform(WIN), "desktop");
});

test("profile link opens directly in Safari, hands off elsewhere on iOS", () => {
  assert.equal(profileOpenHref("ios-safari"), SHIELD_PROFILE_URL);
  assert.equal(profileOpenHref("ios-other"), "x-safari-https://dns.alhajda.com/alhajda-dns.mobileconfig");
  assert.equal(profileOpenHref("ios-native", true), "x-safari-https://dns.alhajda.com/alhajda-dns-family.mobileconfig");
});

test("canary probe: blocked ⇒ active, reachable ⇒ inactive, offline ⇒ unknown", async () => {
  const fail = (async () => { throw new TypeError("Load failed"); }) as unknown as typeof fetch;
  const ok = (async () => new Response("{}", { status: 200 })) as unknown as typeof fetch;
  assert.equal(await probeShield(fail, true), "active");
  assert.equal(await probeShield(ok, true), "inactive");
  assert.equal(await probeShield(ok, false), "unknown");
});

test("domain check cleans input and rejects junk", async () => {
  let seen = "";
  const f = (async (u: string) => { seen = u; return Response.json({ verdict: "block" }); }) as unknown as typeof fetch;
  assert.equal(await checkDomain(" https://Ads.Example.com/x?y ", f), "block");
  assert.match(seen, /name=ads\.example\.com$/);
  await assert.rejects(checkDomain("not a domain", f));
});
