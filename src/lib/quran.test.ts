import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validPosition } from "./quran.ts";
test("Quran corpus contains all 114 surahs and 6236 ordered verses", () => {
  let total = 0;
  for (let n = 1; n <= 114; n++) {
    const s = JSON.parse(
      readFileSync(new URL(`../../public/quran/${n}.json`, import.meta.url), "utf8"),
    );
    assert.equal(s.number, n);
    assert.ok(s.name);
    s.ayahs.forEach((a: { number: number; text: string }, i: number) => {
      assert.equal(a.number, i + 1);
      assert.ok(a.text.trim());
    });
    total += s.ayahs.length;
  }
  assert.equal(total, 6236);
});
test("stored Quran position rejects invalid values", () => {
  assert.deepEqual(validPosition({ surah: 114, ayah: 6 }), { surah: 114, ayah: 6 });
  for (const p of [
    null,
    {},
    { surah: 0, ayah: 1 },
    { surah: 115, ayah: 1 },
    { surah: 1.5, ayah: 2 },
    { surah: 1, ayah: 0 },
    { surah: 1, ayah: "1" },
  ])
    assert.equal(validPosition(p), null);
});
