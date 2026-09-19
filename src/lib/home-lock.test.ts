import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { forSeriousHome, isPlayItem } from "./home-lock.ts";
import { primaryLauncherDoors } from "./doors.ts";

describe("serious home lock", () => {
  it("drops games and Luma from the first-screen list", () => {
    const kept = forSeriousHome([
      { id: "salah", category: "life", lane: "worship" },
      { id: "baloot", category: "games", lane: "play" },
      { id: "luma", category: "life", lane: "house" },
      { id: "midad", category: "life", lane: "house" },
    ]);
    assert.deepEqual(
      kept.map((item) => item.id),
      ["salah", "midad"],
    );
    assert.equal(isPlayItem({ id: "tetris", category: "games", lane: "play" }), true);
  });

  it("does not put Luma or games in the home door strip", () => {
    const ids = primaryLauncherDoors().map((d) => d.id);
    assert.deepEqual(ids, ["tahajjud", "midad", "sites"]);
    assert.equal(ids.includes("luma"), false);
  });

  it("binds / to a quiet ShadowDay — no Maydan line, no catalog hero", () => {
    const home = readFileSync(new URL("../routes/index.tsx", import.meta.url), "utf8");
    assert.match(home, /ShadowDay/);
    assert.equal(/SquarePage/.test(home), false);
    assert.equal(/Hub/.test(home), false);
    assert.equal(/byCategory|featuredFor/.test(home), false);
  });

  it("binds /maydan to the filled Square as a separate route", () => {
    const maydan = readFileSync(new URL("../routes/maydan.tsx", import.meta.url), "utf8");
    assert.match(maydan, /SquarePage/);
    assert.match(maydan, /createFileRoute\("\/maydan"\)/);
  });
});
