import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { accountProviderView } from "./account-provider.ts";

test("a missing status response is not shown as confirmed-off providers", () => {
  assert.equal(accountProviderView({ phase: "checking" }), "checking");
  assert.equal(accountProviderView({ phase: "unknown" }), "unknown");
  assert.equal(accountProviderView({ phase: "ready", google: false, apple: false }), "off");
  assert.equal(accountProviderView({ phase: "ready", google: true, apple: false }), "on");
  const page = readFileSync(new URL("../../routes/me.tsx", import.meta.url), "utf8");
  assert.match(page, /جارٍ التحقق من تسجيل Google وApple/);
  assert.match(page, /تعذّر التحقق من تهيئة الدخول/);
  assert.match(page, /إعادة التحقق/);
  assert.match(page, /غير مهيأ على هذا الخادم/);
  assert.match(page, /accountProviderView/);
});
