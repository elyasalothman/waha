import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { CLASSIC_IDS, GAME_COVERS, SIGNATURE_IDS, YARD_GAMES } from "./doors.ts";
import { PUBLIC_GAME_IDS, isPublicGame } from "./public-catalog.ts";

test("the public games page lists only played in-app games", () => {
  const known = new Set<string>([...SIGNATURE_IDS, ...CLASSIC_IDS]);
  for (const id of PUBLIC_GAME_IDS) {
    assert.equal(isPublicGame(id), true);
    assert.ok(known.has(id), id);
  }
  assert.equal(isPublicGame("hayat-world"), false);
  assert.equal(isPublicGame("luma"), false);
  const page = readFileSync(new URL("../../components/games-hub.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(page, /hayat\.alhajda\.com|HayatCard|GAME_DOORS/);
  assert.match(page, /isPublicGame/);
  assert.match(page, /ArmyCard/);
  assert.match(page, /GAME_COVERS\[item\.id\]/);
  assert.match(page, /YARD_GAMES/);
  assert.match(page, /game\.cover/);
  for (const id of PUBLIC_GAME_IDS) assert.ok(GAME_COVERS[id], id);
  assert.deepEqual(
    YARD_GAMES.map((game) => game.href),
    [
      "https://games.alhajda.com/matam-alwaha/",
      "https://games.alhajda.com/mazraat-alwaha/",
      "https://games.alhajda.com/ghazw-alabraj/",
    ],
  );
});
