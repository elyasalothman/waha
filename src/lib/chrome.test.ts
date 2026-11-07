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
  assert.match(shell, /waha-wordmark/);
  const wordmark = css.slice(css.indexOf(".waha-wordmark {"), css.indexOf(".waha-wordmark {") + 280);
  assert.match(wordmark, /letter-spacing:\s*normal/);
  assert.match(wordmark, /font-weight:\s*700/);
  assert.doesNotMatch(wordmark, /scaleX|letter-spacing:\s*0\./);
  assert.match(shell, /waha-tabbar/);
  assert.match(css, /\.waha-tabbar[\s\S]*64%/);
  const nav = readFileSync(new URL("./nav.ts", import.meta.url), "utf8");
  assert.match(nav, /to: "\/games", key: "games"/);
  assert.doesNotMatch(nav, /to: "\/research"/);
});
