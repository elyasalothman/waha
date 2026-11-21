import test from "node:test";
import assert from "node:assert/strict";
import { deepLinkPath } from "./deep-link.ts";

test("waha:// links open in-app paths only", () => {
  assert.equal(deepLinkPath("waha://app/budget#sms=abc"), "/app/budget#sms=abc");
  assert.equal(deepLinkPath("waha:///app/budget?merchant=x&amount=1"), "/app/budget?merchant=x&amount=1");
  assert.equal(deepLinkPath("waha://"), "/");
  assert.equal(deepLinkPath("waha://evil.com/x"), null);
  assert.equal(deepLinkPath("waha:////evil.com"), null);
  assert.equal(deepLinkPath("waha://javascript:alert(1)"), null);
  assert.equal(deepLinkPath("https://waha.hajdah.com/app/budget"), null);
});
