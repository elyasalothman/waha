import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("the homepage body keeps a single customization entry and no privacy footer", () => {
  const home = read("../components/leap-home.tsx");
  const display = read("../components/home-display.tsx");
  const shell = read("../components/layout/shell.tsx");
  assert.match(home, /data-home-display="only"/);
  assert.match(home, /تخصيص/);
  assert.equal(home.match(/<Link\b/g)?.length, 1);
  assert.doesNotMatch(home, /<button\b|geolocation|الخصوصية|حذف الحساب/);
  assert.match(display, /to="\/books\/library\/\$id"/);
  assert.match(display, /to="\/app\/\$id"/);
  assert.doesNotMatch(display, /<button\b|onClick|geolocation|الخصوصية|حذف الحساب/);
  assert.doesNotMatch(shell, /حذف الحساب والبيانات/);
  assert.match(shell, /data-app-header="name"/);
  assert.doesNotMatch(home, /اسأل محسن|كل الخدمات|رف كتبك/);
});

test("Muhsin is its own full-height chat without the services bar", () => {
  const shell = read("../components/layout/shell.tsx");
  const chat = read("../components/mohsen-chat.tsx");
  assert.match(shell, /pathname === "\/mohsen"/);
  assert.match(chat, /data-mohsen-layout="chat"/);
  assert.match(chat, /visualViewport/);
  assert.doesNotMatch(chat, /MOHSEN_STARTERS|فرص ودعم|بلا حساب/);
});
