import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("the homepage body has no actions", () => {
  const home = read("../components/leap-home.tsx");
  const display = read("../components/home-display.tsx");
  assert.match(home, /data-home-display="only"/);
  assert.doesNotMatch(home, /<(Link|a|button)\b|onClick|to=|geolocation/);
  assert.doesNotMatch(display, /<(Link|a|button)\b|onClick|to=|geolocation/);
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
