import { test } from "node:test";
import assert from "node:assert/strict";
import { searchDirectoryServices, LEAP_SERVICES } from "./leap-services.ts";

test("directory search tolerates Arabic marks and surrounding whitespace", () => {
  assert.deepEqual(
    searchDirectoryServices("  حِصّتي  ").map((s) => s.id),
    ["hissati-explore"],
  );
  assert.deepEqual(
    searchDirectoryServices("موسوعه").map((s) => s.id),
    ["wiki"],
  );
  assert.deepEqual(
    searchDirectoryServices("ابحاث").map((s) => s.id),
    ["research"],
  );
});

test("directory search matches all words in any order and keeps the full empty-query directory", () => {
  assert.deepEqual(
    searchDirectoryServices("الدروس   حصتي").map((s) => s.id),
    ["hissati-explore"],
  );
  assert.deepEqual(searchDirectoryServices("   "), LEAP_SERVICES);
  assert.deepEqual(searchDirectoryServices("خدمةغيرموجودة"), []);
});
