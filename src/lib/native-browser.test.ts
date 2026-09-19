import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { BOOK_CARDS } from "./books/seed.ts";
import { PRIMARY_LAUNCHER_IDS, doorOpenHref, getDoor } from "./doors.ts";
import { HOUSE_SITES } from "./house-sites.ts";
import {
  assertHttpsUrl,
  HOUSE_DESTINATIONS,
  houseDestination,
  houseDoorChrome,
  isHouseDoorUrl,
  openExternalUrl,
  openHouseDoor,
  resolveNativeOpenPath,
  shouldOpenExternally,
  type NativeOpenPath,
} from "./native-browser.ts";

const here = dirname(fileURLToPath(import.meta.url));

describe("house destinations", () => {
  it("lists مداد with تهجد / محسن / ألعاب / حياة on alhajda https hosts", () => {
    assert.deepEqual(
      HOUSE_DESTINATIONS.map((row) => row.id),
      ["tahajjud", "midad", "mohsen", "games", "hayat"],
    );
    assert.equal(houseDestination("tahajjud").href, "https://tahajjud.alhajda.com/");
    assert.equal(houseDestination("midad").href, "https://midad.alhajda.com/library");
    assert.equal(houseDestination("mohsen").href, "https://ai.alhajda.com/");
    assert.equal(houseDestination("games").href, "https://games.alhajda.com/");
    assert.equal(houseDestination("hayat").href, "https://hayat.alhajda.com/");
    for (const row of HOUSE_DESTINATIONS) {
      assert.equal(assertHttpsUrl(row.href), row.href);
      assert.equal(isHouseDoorUrl(row.href), true);
      assert.match(row.href, /^https:\/\/[a-z0-9.-]+\.alhajda\.com(\/.*)?$/);
    }
  });
});

describe("assertHttpsUrl", () => {
  it("rejects non-https schemes", () => {
    assert.throws(() => assertHttpsUrl("javascript:alert(1)"), /https-only/);
    assert.throws(() => assertHttpsUrl("http://tahajjud.alhajda.com/"), /https-only/);
    assert.throws(() => assertHttpsUrl("not a url"), /invalid-url/);
  });
});

describe("isHouseDoorUrl", () => {
  it("keeps house-sites, PRIMARY, لُمعة, and مداد library paths inside the house set", () => {
    for (const site of HOUSE_SITES) {
      assert.equal(isHouseDoorUrl(site.href), true, site.id);
    }
    for (const id of PRIMARY_LAUNCHER_IDS) {
      const site = HOUSE_SITES.find((row) => row.id === id);
      assert.ok(site, id);
      assert.equal(isHouseDoorUrl(site!.href), true, id);
    }
    assert.equal(isHouseDoorUrl("https://midad.alhajda.com"), true);
    assert.equal(isHouseDoorUrl("https://midad.alhajda.com/library"), true);
    assert.equal(isHouseDoorUrl("https://midad.alhajda.com/library/how-to-read"), true);
    assert.equal(isHouseDoorUrl("https://luma.alhajda.com/"), true);
    assert.equal(isHouseDoorUrl("https://games.alhajda.com/"), true);
    assert.equal(isHouseDoorUrl("https://www.alhajda.com/sites"), true);
    assert.equal(isHouseDoorUrl("https://hayat.alhajda.com/"), true);
    assert.equal(isHouseDoorUrl("https://www.absher.sa"), false);
    assert.equal(isHouseDoorUrl("https://islamhouse.com/ar/books/231837/"), false);
    assert.equal(isHouseDoorUrl("https://waha.hajdah.com/life"), false);
  });
});

describe("shouldOpenExternally", () => {
  const origin = "https://waha.hajdah.com";

  it("treats sister apps and gov portals as leaving the واحة origin", () => {
    assert.equal(shouldOpenExternally("https://tahajjud.alhajda.com/", origin), true);
    assert.equal(shouldOpenExternally("https://midad.alhajda.com/library", origin), true);
    assert.equal(shouldOpenExternally("https://www.absher.sa", origin), true);
  });

  it("keeps in-app routes and tel/mailto inside واحة", () => {
    assert.equal(shouldOpenExternally("/life", origin), false);
    assert.equal(shouldOpenExternally("/books", origin), false);
    assert.equal(shouldOpenExternally("/games", origin), false);
    assert.equal(shouldOpenExternally("https://waha.hajdah.com/life", origin), false);
    assert.equal(shouldOpenExternally("tel:911", origin), false);
    assert.equal(shouldOpenExternally("#top", origin), false);
  });
});

describe("native open path", () => {
  it("sends تهجد / مداد / مواقعنا / لُمعة to the in-app WKWebView", () => {
    const rows: Array<[string, NativeOpenPath]> = [
      ["https://tahajjud.alhajda.com/", "inapp-webview"],
      ["https://midad.alhajda.com/library", "inapp-webview"],
      ["https://alhajda.com/sites", "inapp-webview"],
      ["https://games.alhajda.com/", "inapp-webview"],
      ["https://luma.alhajda.com/", "inapp-webview"],
      ["https://ai.alhajda.com/", "inapp-webview"],
      ["https://hayat.alhajda.com/", "inapp-webview"],
      ["https://www.absher.sa", "system-browser"],
      ["https://islamhouse.com/ar/books/231837/", "system-browser"],
    ];
    for (const [href, path] of rows) {
      assert.equal(resolveNativeOpenPath(href), path, href);
    }
  });

  it("keeps باب مداد on /books and live library URLs on the in-app path", () => {
    const midad = getDoor("midad");
    assert.ok(midad);
    assert.equal(doorOpenHref(midad), "/books");
    assert.equal(shouldOpenExternally("/books"), false);
    assert.equal(isHouseDoorUrl(midad.href), true);
    const midadBooks = BOOK_CARDS.filter((book) => book.sourceKind === "midad-original");
    assert.ok(midadBooks.length >= 1);
    for (const book of midadBooks) {
      assert.equal(resolveNativeOpenPath(book.url), "inapp-webview", book.id);
    }
  });

  it("chrome for مداد is Arabic title + رجوع لواحة", () => {
    const chrome = houseDoorChrome("https://midad.alhajda.com/library", "ar");
    assert.match(chrome.title, /مداد/);
    assert.equal(chrome.closeLabel, "رجوع لواحة");
    assert.equal(houseDoorChrome("https://luma.alhajda.com/", "ar").title, "لُمعة");
    assert.equal(houseDoorChrome("https://midad.alhajda.com/library", "en").closeLabel, "Back to Waha");
  });

  it("openHouseDoor / house openExternalUrl never call Capacitor Browser.open", async () => {
    const calls: string[] = [];
    const deps = {
      isNativeIos: () => true,
      openInAppWebView: async (opts: { url: string }) => {
        calls.push(`inapp:${opts.url}`);
      },
      openSystemBrowser: async (url: string) => {
        calls.push(`safari:${url}`);
      },
    };

    const midad = await openHouseDoor("https://midad.alhajda.com/library", deps);
    const book = await openExternalUrl("https://midad.alhajda.com/library/how-to-read", deps);
    const tahajjud = await openExternalUrl("https://tahajjud.alhajda.com/", deps);
    const sites = await openExternalUrl("https://alhajda.com/sites", deps);
    const luma = await openExternalUrl("https://luma.alhajda.com/", deps);
    const yard = await openExternalUrl("https://games.alhajda.com/", deps);
    const islamhouse = await openExternalUrl("https://islamhouse.com/ar/books/231837/", deps);
    const absher = await openExternalUrl("https://www.absher.sa/", deps);

    assert.equal(midad.path, "inapp-webview");
    assert.equal(book.path, "inapp-webview");
    assert.equal(tahajjud.path, "inapp-webview");
    assert.equal(sites.path, "inapp-webview");
    assert.equal(luma.path, "inapp-webview");
    assert.equal(yard.path, "inapp-webview");
    assert.equal(islamhouse.path, "system-browser");
    assert.equal(absher.path, "system-browser");
    assert.deepEqual(calls, [
      "inapp:https://midad.alhajda.com/library",
      "inapp:https://midad.alhajda.com/library/how-to-read",
      "inapp:https://tahajjud.alhajda.com/",
      "inapp:https://alhajda.com/sites",
      "inapp:https://luma.alhajda.com/",
      "inapp:https://games.alhajda.com/",
      "safari:https://islamhouse.com/ar/books/231837/",
      "safari:https://www.absher.sa/",
    ]);
    assert.equal(calls.some((row) => row.startsWith("safari:") && row.includes("alhajda.com")), false);
  });

  it("source routes house doors through HouseDoorBrowser, not Browser.open", () => {
    const source = readFileSync(join(here, "native-browser.ts"), "utf8");
    assert.match(source, /HouseDoorBrowser/);
    assert.match(source, /inapp-webview/);
    assert.match(source, /midad\.alhajda\.com/);
    assert.match(source, /رجوع لواحة/);
    assert.match(source, /@capacitor\/browser/);
    assert.doesNotMatch(source, /SFSafariViewController — not inside WKWebView/);
    const safariFn = source.indexOf("defaultOpenSystemBrowser");
    const browserOpen = source.indexOf("await Browser.open");
    const houseFn = source.indexOf("export async function openHouseDoor");
    assert.ok(safariFn >= 0 && browserOpen > safariFn);
    assert.ok(houseFn >= 0);
    assert.equal(source.slice(houseFn).includes("await Browser.open"), false);
  });
});
