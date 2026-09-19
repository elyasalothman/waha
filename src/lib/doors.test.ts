import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ALHAJDA_SITES_INDEX,
  DOORS,
  PRIMARY_LAUNCHER_IDS,
  directoryDoors,
  doorHref,
  getDoor,
  isExternalDoor,
  launcherDoors,
  primaryLauncherDoors,
} from "./doors.ts";

describe("Alhajda doors", () => {
  it("keeps the three required launcher doors with real product URLs", () => {
    const tahajjud = getDoor("tahajjud");
    const midad = getDoor("midad");
    const sites = getDoor("sites");

    assert.equal(tahajjud?.href, "https://tahajjud.alhajda.com");
    assert.equal(midad?.href, "https://midad.alhajda.com");
    assert.equal(sites?.launcher, true);
    assert.equal(isExternalDoor(sites!), false);
    assert.equal(doorHref(sites!), "/app/sites");

    const ids = launcherDoors().map((d) => d.id);
    assert.deepEqual(
      PRIMARY_LAUNCHER_IDS.filter((id) => ids.includes(id)),
      ["tahajjud", "midad", "sites"],
    );
    assert.deepEqual(
      primaryLauncherDoors().map((d) => d.id),
      ["tahajjud", "midad", "sites"],
    );
  });

  it("opens house products in the same tab via https — never an iframe src", () => {
    for (const door of launcherDoors()) {
      if (door.id === "sites") {
        assert.equal(door.href, "");
        continue;
      }
      assert.match(door.href, /^https:\/\/[a-z0-9.-]+\.alhajda\.com$/);
      assert.equal(doorHref(door), door.href);
    }
    assert.equal(
      DOORS.some((d) => /iframe|embed/i.test(`${d.href}${d.blurb.ar}${d.blurb.en}`)),
      false,
    );
  });

  it("lists the short مواقعنا directory and the full /sites index", () => {
    assert.equal(ALHAJDA_SITES_INDEX, "https://alhajda.com/sites");
    assert.deepEqual(
      directoryDoors().map((d) => d.id),
      ["tahajjud", "midad", "mohsin", "luma", "alhajda-tools", "agent", "hissati"],
    );
    assert.equal(getDoor("hissati")?.href, "https://hissati.alhajda.com");
    assert.equal(getDoor("mohsin")?.href, "https://ai.alhajda.com");
    assert.equal(getDoor("luma")?.href, "https://games.alhajda.com");
    assert.equal(getDoor("alhajda-tools")?.href, "https://tools.alhajda.com");
    assert.equal(getDoor("agent")?.href, "https://agent.alhajda.com");
  });
});
