import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertHttpsUrl,
  HOUSE_DESTINATIONS,
  houseDestination,
  shouldOpenExternally,
} from "./native-browser.ts";

describe("house destinations", () => {
  it("lists تهجد / محسن / ألعاب / حياة on alhajda https hosts", () => {
    assert.deepEqual(
      HOUSE_DESTINATIONS.map((row) => row.id),
      ["tahajjud", "mohsen", "games", "hayat"],
    );
    assert.equal(houseDestination("tahajjud").href, "https://tahajjud.alhajda.com/");
    assert.equal(houseDestination("mohsen").href, "https://ai.alhajda.com/");
    assert.equal(houseDestination("games").href, "https://games.alhajda.com/");
    assert.equal(houseDestination("hayat").href, "https://hayat.alhajda.com/");
    for (const row of HOUSE_DESTINATIONS) {
      assert.equal(assertHttpsUrl(row.href), row.href);
      assert.match(row.href, /^https:\/\/[a-z0-9.-]+\.alhajda\.com\//);
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

describe("shouldOpenExternally", () => {
  const origin = "https://waha.alhajda.com";

  it("opens sister apps and gov portals outside the WKWebView", () => {
    assert.equal(shouldOpenExternally("https://tahajjud.alhajda.com/", origin), true);
    assert.equal(shouldOpenExternally("https://www.absher.sa", origin), true);
  });

  it("keeps in-app routes and tel/mailto inside واحة", () => {
    assert.equal(shouldOpenExternally("/life", origin), false);
    assert.equal(shouldOpenExternally("/games", origin), false);
    assert.equal(shouldOpenExternally("https://waha.alhajda.com/life", origin), false);
    assert.equal(shouldOpenExternally("tel:911", origin), false);
    assert.equal(shouldOpenExternally("#top", origin), false);
  });
});
