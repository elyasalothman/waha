import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { HOUSE_SITES } from "./house-sites.ts";
import { HOUSE_INTEGRATIONS, internalHouseHref } from "./house-integrations.ts";

describe("house destinations stay inside Waha", () => {
  it("covers every catalog record, including source URL variants", () => {
    for (const site of HOUSE_SITES) {
      assert.match(HOUSE_INTEGRATIONS[site.id], /^\/(?!\/)/, site.id);
      assert.equal(internalHouseHref(site.href), HOUSE_INTEGRATIONS[site.id], site.id);
      const url = new URL(site.href);
      url.search = "from=ios";
      url.hash = "feature";
      assert.equal(internalHouseHref(url.href), HOUSE_INTEGRATIONS[site.id], site.id);
    }
  });
  it("does not mistake news sources or lookalike domains for house apps", () => {
    for (const href of [
      "https://reuters.com",
      "https://games.alhajda.com.evil.test",
      "javascript:alert(1)",
      "//evil.test",
      "invalid",
    ])
      assert.equal(internalHouseHref(href), undefined);
    assert.equal(internalHouseHref("https://alhajda.com/sites"), "/app/sites");
    assert.equal(internalHouseHref("https://hissati.alhajda.com/app/grades"), "/app/hissati");
  });
});
