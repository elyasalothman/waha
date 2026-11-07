import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  APPLE_CALLBACK_PATH,
  GOOGLE_CALLBACK_PATH,
  IOS_BUNDLE_ID,
  NATIVE_AUTH_PATHS,
  oauthCallbackUrls,
  oauthHandoffProvider,
  oauthHandoffUrl,
  productionAuthBase,
  productionTrustedOrigins,
} from "./public-origins.ts";

test("OAuth uses the configured base, and alhajda hands off without a custom redirect", () => {
  assert.deepEqual(oauthCallbackUrls(), [
    "https://waha.hajdah.com/api/auth/callback/google",
    "https://waha.hajdah.com/api/auth/callback/apple",
    "https://waha.alhajda.com/api/auth/callback/google",
    "https://waha.alhajda.com/api/auth/callback/apple",
  ]);
  assert.equal(productionAuthBase("https://waha.hajdah.com/"), "https://waha.hajdah.com");
  assert.equal(oauthHandoffUrl("https://waha.hajdah.com", "google"), null);
  assert.equal(
    oauthHandoffUrl("https://waha.alhajda.com", "apple"),
    "https://waha.hajdah.com/me?start=apple",
  );
  assert.equal(
    oauthHandoffProvider(
      "https://waha.hajdah.com",
      "?start=google",
      "https://waha.alhajda.com/me",
    ),
    "google",
  );
  assert.equal(
    oauthHandoffProvider("https://waha.hajdah.com", "?start=google", "https://evil.example/"),
    null,
  );
  assert.equal(
    oauthHandoffProvider("https://waha.alhajda.com", "?start=google", "https://waha.alhajda.com/"),
    null,
  );
  assert.ok(
    productionTrustedOrigins("https://waha.hajdah.com", ["http://localhost:8080"]).includes(
      "https://waha.alhajda.com",
    ),
  );
  assert.equal(GOOGLE_CALLBACK_PATH.endsWith("/google"), true);
  assert.equal(APPLE_CALLBACK_PATH.endsWith("/apple"), true);
});

test("native sign-in uses the iOS bundle id and HTTPS handoff, not a second scheme", () => {
  const capacitor = readFileSync(new URL("../../../capacitor.config.ts", import.meta.url), "utf8");
  assert.match(capacitor, new RegExp(`appId: "${IOS_BUNDLE_ID}"`));
  assert.deepEqual(NATIVE_AUTH_PATHS, [
    "/api/native-auth/start",
    "/api/native-auth/done",
    "/api/native-auth/claim",
  ]);
  assert.equal(IOS_BUNDLE_ID.includes("web"), false);
});
