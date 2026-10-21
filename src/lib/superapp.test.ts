import test from "node:test";
import assert from "node:assert/strict";
import {
  findServices,
  SERVICES,
  HOME_SERVICE_IDS,
  progressState,
  progressSummary,
} from "./superapp.ts";
import { CATALOG } from "./catalog.ts";
import { HOUSE_SITES } from "./house-sites.ts";
test("all tools and house services have unique internal destinations", () => {
  assert.equal(new Set(SERVICES.map((s) => s.id)).size, SERVICES.length);
  for (const service of SERVICES)
    assert.ok(service.href.startsWith("/") && !service.href.startsWith("//"), service.id);
  for (const item of [...CATALOG, ...HOUSE_SITES])
    assert.ok(
      SERVICES.some((s) => s.id === item.id),
      item.id,
    );
});
test("Arabic search ignores diacritics and hamza and uses all query words", () => {
  assert.ok(findServices("قَفْز الدله").some((s) => s.id === "dallah"));
  assert.ok(findServices("أَخْبار").some((s) => s.id === "news"));
  assert.ok(findServices("١٦ مسار").some((s) => s.id === "hissati"));
  assert.ok(findServices("Hissati").some((s) => s.id === "hissati"));
  assert.ok(findServices("لمعة", "fun").length > 0);
  assert.equal(findServices("غيرموجودabcdef").length, 0);
});
test("XP counts distinct valid completed days, streak accepts yesterday but breaks after a gap", () => {
  const progress = progressState({
    days: ["2026-10-16", "2026-10-17", "2026-10-17", null, "oops", "2026-99-99"],
  });
  assert.deepEqual(progressSummary(progress, "2026-10-18"), { xp: 20, streak: 2, done: false });
  assert.deepEqual(progressSummary({ days: [...progress.days, "2026-10-18"] }, "2026-10-18"), {
    xp: 30,
    streak: 3,
    done: true,
  });
  assert.equal(progressSummary(progress, "2026-10-19").streak, 0);
  assert.equal(progressSummary({ days: ["2099-01-01"] }, "2026-10-18").xp, 0);
  assert.deepEqual(progressState(null), { days: [] });
});

test("home shortcuts stay small and all services fit the four browse sections", () => {
  assert.ok(HOME_SERVICE_IDS.length >= 6 && HOME_SERVICE_IDS.length <= 8);
  assert.equal(new Set(HOME_SERVICE_IDS).size, HOME_SERVICE_IDS.length);
  for (const id of HOME_SERVICE_IDS)
    assert.ok(
      SERVICES.some((service) => service.id === id),
      id,
    );
  for (const service of SERVICES)
    assert.ok(["faith", "learn", "news", "fun"].includes(service.pillar), service.id);
});
