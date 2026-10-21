import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultSettings,
  parseSettings,
  settingChange,
  loadSettings,
  saveSettings,
  SETTINGS_KEY,
} from "./settings.ts";
test("إعدادات افتراضية قابلة للاستعادة من JSON", () =>
  assert.deepEqual(parseSettings(JSON.parse(JSON.stringify(defaultSettings))), defaultSettings));
test("استيراد جزئي يملأ الافتراضيات", () => {
  const s = parseSettings({ theme: "dark", newsWidget: false });
  assert.equal(s.theme, "dark");
  assert.equal(s.newsWidget, false);
  assert.equal(s.tabs.length, 5);
});
test("استيراد غير صالح يرفض كاملًا", () => {
  for (const v of [
    null,
    [],
    { theme: "purple" },
    { fontSize: 99 },
    { agentEnabled: "yes" },
    { extra: true },
    { tabs: ["/books"] },
    { tabs: ["/", "/"] },
    { shortcuts: [] },
    { shortcuts: Array(9).fill("calc") },
  ])
    assert.throws(() => parseSettings(v));
});
test("تغيير إعداد صحيح", () => assert.equal(settingChange("temperature", "F").temperature, "F"));
test("رفض مفتاح غير معروف", () => assert.throws(() => settingChange("secret", "x")));

test("حفظ الإعدادات واستعادتها دون فقد بقية التفضيلات", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (k: string) => values.get(k) || null,
    setItem: (k: string, v: string) => {
      values.set(k, v);
    },
  };
  const next = saveSettings(storage, defaultSettings, {
    theme: "dark",
    shortcuts: ["quran", "calc"],
  });
  assert.deepEqual(loadSettings(storage), next);
  assert.equal(next.language, defaultSettings.language);
  values.set(SETTINGS_KEY, "{broken");
  assert.deepEqual(loadSettings(storage), defaultSettings);
});
test("فشل التخزين أو الاستيراد لا يغيّر الحالة السابقة", () => {
  const current = { ...defaultSettings };
  const storage = {
    getItem: () => null,
    setItem: () => {
      throw new Error("quota");
    },
  };
  assert.throws(() => saveSettings(storage, current, { theme: "dark" }));
  assert.equal(current.theme, "auto");
  assert.throws(() => saveSettings(storage, current, { theme: "invalid" as "dark" }));
});
