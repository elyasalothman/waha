import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { primaryLauncherDoors } from "./doors.ts";
import { forSeriousHome, isPlayItem } from "./home-lock.ts";
import { kalimaOk, kalimaPool, pickKalima, scoreKalima } from "./games/kalima.ts";
import { abaarSafeCount, abaarWon, buildAbaar, floodAbaar } from "./games/abaar.ts";
import { generateMajra, majraSolved, rotateMajra, rotatePipe } from "./games/majra.ts";
import { canPlaceKutal, clearKutalLines, emptyKutal, kutalPlaceScore, placeKutal } from "./games/kutal.ts";
import { LUMA_HREF, WORKSHOP_GAME_IDS, lumaDoor, otherYardGames, workshopGames } from "./games-yard.ts";

const sample = [
  { id: "kalima", category: "games", lane: "play" },
  { id: "abaar", category: "games", lane: "play" },
  { id: "majra", category: "games", lane: "play" },
  { id: "kutal", category: "games", lane: "play" },
  { id: "memory", category: "games", lane: "play" },
  { id: "snake", category: "games", lane: "play" },
  { id: "salah", category: "life", lane: "worship" },
] as const;

describe("games stay off the first screen", () => {
  it("keeps workshop and Luma off home featured and home doors", () => {
    const home = forSeriousHome([
      { id: "salah", category: "life", lane: "worship" },
      { id: "kalima", category: "games", lane: "play" },
      { id: "abaar", category: "games", lane: "play" },
      { id: "luma", category: "life", lane: "house" },
    ]);
    assert.deepEqual(
      home.map((item) => item.id),
      ["salah"],
    );
    assert.equal(isPlayItem({ id: "kutal", category: "games", lane: "play" }), true);
    assert.equal(primaryLauncherDoors().some((d) => d.id === "luma"), false);
  });
});

describe("games yard", () => {
  it("opens Luma onto the live courtyard", () => {
    const luma = lumaDoor();
    assert.equal(luma.href, LUMA_HREF);
    assert.equal(luma.title.ar, "لُمعة");
    assert.match(luma.href, /^https:\/\/games\.alhajda\.com$/);
  });

  it("lists the Waha workshop games first, then the rest", () => {
    const workshop = workshopGames([...sample]);
    assert.deepEqual(
      workshop.map((g) => g.id),
      [...WORKSHOP_GAME_IDS],
    );
    const rest = otherYardGames([...sample]);
    assert.deepEqual(
      rest.map((g) => g.id),
      ["snake", "salah"],
    );
  });
});

describe("kalima engine", () => {
  it("scores a five-letter guess like Wordle", () => {
    assert.deepEqual(scoreKalima("مدرسة", "مدرسة"), ["correct", "correct", "correct", "correct", "correct"]);
    assert.deepEqual(scoreKalima("crane", "slate"), ["absent", "absent", "correct", "absent", "correct"]);
    assert.deepEqual(scoreKalima("plant", "slate"), ["absent", "correct", "correct", "absent", "present"]);
    assert.equal(kalimaPool("ar").every((w) => [...w].length === 5), true);
    assert.equal(kalimaOk("ar").has(pickKalima("ar", () => 0)), true);
  });
});

describe("abaar engine", () => {
  it("keeps the first tap and its ring free of pits", () => {
    const grid = buildAbaar(3, 3, () => 0.2);
    assert.equal(grid[3]![3]!.pit, false);
    const opened = floodAbaar(grid, 3, 3);
    assert.equal(opened[3]![3]!.open, true);
    assert.equal(opened[3]![3]!.pit, false);
    assert.equal(abaarSafeCount(), 54);
    const filled = opened.map((row) => row.map((cell) => ({ ...cell, open: !cell.pit })));
    assert.equal(abaarWon(filled), true);
  });
});

describe("majra engine", () => {
  it("flows when a vertical channel is aligned", () => {
    const grid = Array.from({ length: 6 }, () =>
      Array.from({ length: 6 }, (_, c) => (c === 2 ? { kind: "I" as const, rot: 0 as const } : { kind: "I" as const, rot: 1 as const })),
    );
    assert.equal(majraSolved(grid), true);
    const twisted = rotateMajra(grid, 2, 2);
    assert.equal(majraSolved(twisted), false);
    assert.equal(rotatePipe({ kind: "I", rot: 0 }).rot, 1);
    const generated = generateMajra(() => 0);
    let walk = generated;
    for (let spin = 0; spin < 4 && !majraSolved(walk); spin++) {
      walk = walk.map((row) => row.map((cell) => rotatePipe(cell)));
    }
    assert.equal(majraSolved(walk), true);
  });
});

describe("kutal engine", () => {
  it("places a block and clears a full row", () => {
    let board = emptyKutal();
    const bar = { cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7]] as [number, number][] };
    assert.equal(canPlaceKutal(board, bar, 0, 0), true);
    board = placeKutal(board, bar, 0, 0, 1)!;
    const cleared = clearKutalLines(board);
    assert.equal(cleared.cleared, 1);
    assert.equal(cleared.board[0]!.every((v) => v === 0), true);
    assert.equal(kutalPlaceScore(8, 2) > kutalPlaceScore(8, 1), true);
  });
});
