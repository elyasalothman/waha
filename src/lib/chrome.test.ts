import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

test("the name bar is translucent chrome and stays off the Muhsin page", () => {
  const shell = readFileSync(new URL("../components/layout/shell.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
  const mohsen = shell.indexOf('pathname === "/mohsen"');
  const header = shell.indexOf('data-app-header="name"');
  assert.ok(mohsen > 0 && header > mohsen);
  assert.match(shell.slice(mohsen, header), /return \(/);
  assert.doesNotMatch(shell.slice(mohsen, header), /data-app-header/);
  assert.match(shell, /waha-chrome/);
  assert.match(shell, />\s*واحة\s*</);
  assert.match(css, /prefers-reduced-transparency:\s*reduce/);
  assert.match(css, /backdrop-filter:\s*blur\(16px\)/);
  assert.match(css, /not Apple's Liquid Glass/);
});
