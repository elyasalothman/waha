import test from "node:test";
import assert from "node:assert/strict";
import { adjust, autoEnhance, blackWhite, cropRect, fitWithin, moveItem, otsuThreshold } from "./pixels.ts";
import { anchorPoint, visualSize, visualToUser } from "./pdf-geometry.ts";
import { normalizeCv, sampleCv, splitList, lines, filledEntries } from "./cv.ts";

const px = (...v: number[]) => new Uint8ClampedArray(v.flatMap((x) => [x, x, x, 255]));

test("otsu splits a bimodal page and black-white maps ink/paper", () => {
  const d = px(20, 25, 30, 220, 230, 240);
  const t = otsuThreshold(d);
  assert.ok(t >= 30 && t < 220, String(t));
  blackWhite(d, 0);
  assert.deepEqual([d[0], d[4], d[8], d[12], d[16], d[20]], [0, 0, 0, 255, 255, 255]);
});
test("auto enhance stretches grey paper towards white and keeps flat images", () => {
  const d = px(...Array.from({ length: 100 }, (_, i) => 60 + i));
  autoEnhance(d);
  assert.ok(d[99 * 4] >= 250 && d[0] <= 5);
  const flat = px(128, 128, 129);
  autoEnhance(flat);
  assert.equal(flat[0], 128);
});
test("adjust is identity at zero and saturation -100 removes colour", () => {
  const d = new Uint8ClampedArray([200, 50, 10, 255]);
  adjust(d, {});
  assert.deepEqual([...d], [200, 50, 10, 255]);
  adjust(d, { saturation: -100 });
  assert.ok(Math.abs(d[0] - d[1]) <= 1 && Math.abs(d[1] - d[2]) <= 1);
});
test("crop, fit and move helpers stay in bounds", () => {
  assert.deepEqual(cropRect(1000, 500, { top: 10, right: 0, bottom: 10, left: 20 }), { x: 200, y: 50, w: 800, h: 400 });
  assert.equal(cropRect(10, 10, { top: 90, right: 90, bottom: 90, left: 90 }).w, 1);
  assert.deepEqual(fitWithin(4000, 2000, 2000, 2000), { w: 2000, h: 1000 });
  assert.deepEqual(fitWithin(100, 50, 2000, 2000), { w: 100, h: 50 });
  assert.deepEqual(moveItem([1, 2, 3], 0, -1), [1, 2, 3]);
  assert.deepEqual(moveItem([1, 2, 3], 1, 1), [1, 3, 2]);
});
test("pdf geometry maps visual corners to user space for every rotation", () => {
  const box = { x: 0, y: 0, width: 600, height: 800 };
  assert.deepEqual(visualSize(box, 90), { w: 800, h: 600 });
  assert.deepEqual(visualToUser(box, 0, 10, 20), { x: 10, y: 20 });
  // Visual origin (bottom-left as seen) for each rotation is a page corner.
  assert.deepEqual(visualToUser(box, 90, 0, 0), { x: 600, y: 0 });
  assert.deepEqual(visualToUser(box, 180, 0, 0), { x: 600, y: 800 });
  assert.deepEqual(visualToUser(box, 270, 0, 0), { x: 0, y: 800 });
  assert.deepEqual(anchorPoint(600, 800, 100, 50, "br", 20), { x: 480, y: 20 });
  assert.deepEqual(anchorPoint(600, 800, 100, 50, "tl", 20), { x: 20, y: 730 });
});
test("cv normalization rejects junk and keeps valid data", () => {
  const cv = normalizeCv({ lang: "en", template: "bogus", accent: "red", name: 5, experience: [{ title: "Dev" }, null] });
  assert.equal(cv.lang, "en");
  assert.equal(cv.template, "modern");
  assert.equal(cv.accent, "#146455");
  assert.equal(cv.name, "");
  assert.equal(cv.experience.length, 2);
  assert.equal(filledEntries(cv.experience).length, 1);
  assert.deepEqual(normalizeCv(sampleCv()), sampleCv());
  assert.deepEqual(splitList("SQL، Excel, Python\nR"), ["SQL", "Excel", "Python", "R"]);
  assert.deepEqual(lines("- one\n\n• two"), ["one", "two"]);
});
