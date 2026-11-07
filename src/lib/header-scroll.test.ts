import test from "node:test";
import assert from "node:assert/strict";
import { nextHeaderHidden } from "./header-scroll.ts";

test("the name bar stays at the top and ignores tiny scroll jitter", () => {
  assert.deepEqual(nextHeaderHidden(true, 0, 40, 40), { hidden: false, acc: 0 });
  assert.deepEqual(nextHeaderHidden(false, 40, 4, 0), { hidden: false, acc: 4 });
  assert.deepEqual(nextHeaderHidden(false, 80, -4, 10), { hidden: false, acc: -4 });
});

test("scrolling down hides the bar and scrolling up shows it again", () => {
  const down = nextHeaderHidden(false, 120, 30, 0);
  assert.equal(down.hidden, true);
  const up = nextHeaderHidden(true, 80, -30, 0);
  assert.equal(up.hidden, false);
});
