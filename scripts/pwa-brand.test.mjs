import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { appNameFromHost, injectGrokPwaHead, renderWebManifest } from "./grok-pwa-shared.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

test("PRODUCTION_HOST is waha.hajdah.com", () => {
  const source = read("src/lib/host.ts");
  const shared = read("scripts/grok-pwa-shared.mjs");
  assert.match(source, /PRODUCTION_HOST = "waha\.hajdah\.com"/);
  assert.match(shared, /PRODUCTION_HOST = "waha\.hajdah\.com"/);
  assert.doesNotMatch(source, /PRODUCTION_HOST = "waha\.alhajda\.com"/);
  assert.doesNotMatch(source, /grok\.me/);
});

test("PWA name is واحة, not Grok App", () => {
  const head = read("src/routes/__root.tsx");
  const manifest = JSON.parse(read("public/manifest.webmanifest"));

  assert.match(head, /apple-mobile-web-app-title[\s\S]*واحة/);
  assert.match(head, /rel:\s*"manifest",\s*href:\s*"\/manifest\.webmanifest"/);
  assert.match(head, /apple-touch-icon[\s\S]*\/icon-180\.png/);
  assert.doesNotMatch(head, /__grok/);
  assert.doesNotMatch(head, /Grok App/i);
  assert.equal(manifest.name, "واحة");
  assert.equal(manifest.short_name, "واحة");
  assert.doesNotMatch(JSON.stringify(manifest), /grok/i);
});

test("production host names the leftover grok manifest واحة", () => {
  assert.equal(appNameFromHost("waha.hajdah.com"), "واحة");
  const fallback = JSON.parse(renderWebManifest("waha.hajdah.com"));
  assert.equal(fallback.name, "واحة");
  assert.equal(fallback.short_name, "واحة");
  assert.equal(fallback.icons[0].src, "/icon-180.png");
  assert.doesNotMatch(JSON.stringify(fallback), /grok/i);
});

test("PWA icons resolve on the production host", () => {
  const manifest = JSON.parse(read("public/manifest.webmanifest"));
  const srcs = manifest.icons.map((icon) => icon.src);
  assert.deepEqual(srcs, ["/icon-192.png", "/icon-512.png"]);
  assert.ok(existsSync(join(root, "public/icon-180.png")));
  assert.ok(existsSync(join(root, "public/icon-192.png")));
  assert.ok(existsSync(join(root, "public/icon-512.png")));
  for (const src of srcs) {
    assert.equal(new URL(src, "https://waha.hajdah.com").host, "waha.hajdah.com");
  }
});

test("platform injector keeps واحة and does not restore __grok", () => {
  const injected = injectGrokPwaHead(
    `<html><head>
      <link rel="manifest" href="/manifest.webmanifest" />
      <link rel="apple-touch-icon" href="/icon-180.png" />
      <meta name="apple-mobile-web-app-title" content="واحة" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="theme-color" content="#0c0d0c" />
    </head><body></body></html>`,
  );
  assert.match(injected, /href="\/manifest\.webmanifest"/);
  assert.match(injected, /apple-mobile-web-app-title" content="واحة"/);
  assert.doesNotMatch(injected, /__grok\/manifest/);
  assert.doesNotMatch(injected, /__grok\/icon-180/);
  assert.doesNotMatch(injected, /Grok App/);
});
