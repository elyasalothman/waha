import { test } from "node:test";
import assert from "node:assert/strict";
import { isReaderToggleTap } from "./reader-interaction.ts";
const middle = { x: 195, y: 422, width: 390, height: 844, interactive: false, selection: "" };
test("reader center tap reveals controls on mobile and desktop", () => {
  assert.equal(isReaderToggleTap(middle), true);
  assert.equal(isReaderToggleTap({ ...middle, x: 720, y: 450, width: 1440, height: 900 }), true);
});
test("reader tap preserves interactive controls, text selection and scrolling", () => {
  assert.equal(isReaderToggleTap({ ...middle, interactive: true }), false);
  assert.equal(isReaderToggleTap({ ...middle, selection: "نص للنسخ" }), false);
  assert.equal(isReaderToggleTap({ ...middle, start: { x: 195, y: 300 } }), false);
  assert.equal(isReaderToggleTap({ ...middle, start: { x: 190, y: 419 } }), true);
});
test("reader edges and safe area do not accidentally toggle controls", () => {
  for (const point of [{ x: 10 }, { x: 380 }, { y: 10 }, { y: 830 }])
    assert.equal(isReaderToggleTap({ ...middle, ...point }), false);
  assert.equal(isReaderToggleTap({ ...middle, width: 0 }), false);
});
