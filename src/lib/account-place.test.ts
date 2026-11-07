import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { defaultSettings, loadSettings, saveSettings } from "./settings.ts";
import { PERSONAL_NAV } from "./nav.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("account and settings share one entry and the language control stays on that page", () => {
  const shell = read("../components/layout/shell.tsx");
  const more = read("../routes/more.tsx");
  const chat = read("../components/mohsen-chat.tsx");
  const settings = read("../components/settings-page.tsx");
  const me = read("../routes/me.tsx");
  const account = read("../components/account-panel.tsx");
  for (const source of [shell, more, chat]) {
    assert.equal(source.match(/to="\/settings"/g)?.length, 1);
    assert.match(source, /الحساب والإعدادات/);
    assert.doesNotMatch(source, /LangToggle|to="\/me"/);
  }
  assert.match(settings, /AccountPanel/);
  assert.match(settings, /\["en", "English"\]/);
  assert.match(me, /component: SettingsPage/);
  assert.doesNotMatch(me, /redirect\(/);
  assert.match(account, /callbackURL: "\/me"/);
  assert.match(account, /أنت ضيف/);
  assert.match(account, /تسجيل الخروج/);
  assert.deepEqual(
    PERSONAL_NAV.map((item) => item.to),
    ["/", "/mohsen", "/books", "/games", "/more"],
  );
  assert.equal(PERSONAL_NAV.some((item) => item.to === "/today"), false);
});

test("the language choice survives a later settings edit", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const saved = saveSettings(storage, defaultSettings, { language: "en" });
  const next = saveSettings(storage, saved, { theme: "dark" });
  assert.equal(loadSettings(storage).language, "en");
  assert.equal(next.theme, "dark");
});

test("the old today address returns to the reading home and does not keep the legacy page", () => {
  const today = read("../routes/today.tsx");
  const index = read("../routes/index.tsx");
  assert.match(today, /redirect\(\{ to: "\/", replace: true \}\)/);
  assert.doesNotMatch(today, /SuperAppHome|يومك ومتابعتك/);
  assert.match(index, /LeapHome/);
});
