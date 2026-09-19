import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DOORS } from "./doors.ts";
import { HOUSE_SITES, type HouseSiteId } from "./house-sites.ts";
import { HOUSE_SITES as MADAR_SITES } from "./madar.ts";

const CANONICAL_HREFS: Record<HouseSiteId, string> = {
  tahajjud: "https://tahajjud.alhajda.com",
  midad: "https://midad.alhajda.com/library",
  sites: "https://alhajda.com/sites",
  mohsin: "https://ai.alhajda.com",
  luma: "https://games.alhajda.com",
  "alhajda-tools": "https://tools.alhajda.com",
  agent: "https://agent.alhajda.com",
  hissati: "https://hissati.alhajda.com",
};

const HOUSE_PRODUCT_HOSTS = [
  "tahajjud.alhajda.com",
  "midad.alhajda.com",
  "ai.alhajda.com",
  "games.alhajda.com",
  "agent.alhajda.com",
  "hissati.alhajda.com",
];

describe("house-sites catalog", () => {
  it("owns one canonical live https set shared by doors and madar", () => {
    const hrefs = Object.fromEntries(HOUSE_SITES.map((site) => [site.id, site.href]));
    assert.deepEqual(hrefs, CANONICAL_HREFS);
    assert.equal(DOORS, HOUSE_SITES);
    assert.equal(MADAR_SITES, HOUSE_SITES);
    for (const site of HOUSE_SITES) {
      assert.match(site.href, /^https:\/\/([a-z0-9-]+\.)?alhajda\.com(\/.*)?$/);
      assert.equal(site.host, new URL(site.href).hostname);
      assert.equal(site.href.includes("/life"), false);
      assert.equal(site.href.includes("/app/"), false);
    }
  });

  it("does not keep a second hard-coded https house list in madar.ts", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const madar = readFileSync(join(here, "madar.ts"), "utf8");
    assert.match(madar, /from ["']\.\/house-sites\.ts["']/);
    assert.doesNotMatch(madar, /export const HOUSE_SITES\s*[:=]\s*\[/);
    for (const host of HOUSE_PRODUCT_HOSTS) {
      assert.equal(madar.includes(`https://${host}`), false, host);
    }
  });
});
