import test from "node:test";
import assert from "node:assert/strict";
import { RESEARCH_LINKS } from "./research-catalog.ts";

test("research cards repeat only metadata printed on the public pages", () => {
  const raw = JSON.stringify(RESEARCH_LINKS);
  assert.doesNotMatch(raw, /doi|DOI|10\.\d{4}/);
  assert.equal(RESEARCH_LINKS.find((item) => item.id === "research-humanoid")?.updated, "2026-10-29");
  const bitcoin = RESEARCH_LINKS.find((item) => item.id === "research-bitcoin");
  assert.equal(bitcoin?.href, "https://lab.alhajda.com/research/big-questions/bitcoin/");
  assert.match(bitcoin?.title ?? "", /البيتكوين/);
  assert.equal(bitcoin?.stated, "41 مصدرًا مؤرخًا");
  assert.equal(RESEARCH_LINKS.find((item) => item.id === "research")?.updated, null);
  for (const item of RESEARCH_LINKS) assert.equal("author" in item, false);
});
