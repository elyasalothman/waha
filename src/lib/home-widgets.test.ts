import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_HOME_WIDGETS,
  HOME_WIDGET_CATALOG,
  addHomeWidget,
  moveHomeWidget,
  removeHomeWidget,
} from "./home-widgets.ts";
import { defaultSettings, loadSettings, parseSettings, saveSettings } from "./settings.ts";

test("a fresh visitor sees the reading sections, and a saved list is not extended", () => {
  assert.deepEqual(
    [...DEFAULT_HOME_WIDGETS],
    ["reading", "continue", "saved", "picks", "research", "headlines", "weather"],
  );
  assert.deepEqual(defaultSettings.homeWidgets, [...DEFAULT_HOME_WIDGETS]);
  assert.deepEqual(parseSettings({}).homeWidgets, [...DEFAULT_HOME_WIDGETS]);
  assert.deepEqual(parseSettings({ homeWidgets: ["reading", "research", "headlines", "weather"] }).homeWidgets, [
    "reading",
    "research",
    "headlines",
    "weather",
  ]);
  assert.equal(defaultSettings.homeSize, "comfortable");
  assert.ok(DEFAULT_HOME_WIDGETS.length < HOME_WIDGET_CATALOG.length);
  assert.equal(HOME_WIDGET_CATALOG.length, 9);
  assert.equal(defaultSettings.location, "manual");
});

test("settings saved before widgets existed still open on the first-visit list", () => {
  const legacy = { ...defaultSettings } as Partial<typeof defaultSettings>;
  delete legacy.homeWidgets;
  assert.deepEqual(parseSettings(legacy).homeWidgets, [...DEFAULT_HOME_WIDGETS]);
  assert.deepEqual(parseSettings({ ...legacy, theme: "dark" }).theme, "dark");
});

test("an explicit empty selection survives reload and later edits", () => {
  assert.deepEqual(parseSettings({ homeWidgets: [] }).homeWidgets, []);
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) || null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  saveSettings(storage, defaultSettings, { homeWidgets: [] });
  assert.deepEqual(loadSettings(storage).homeWidgets, []);
  const next = saveSettings(storage, loadSettings(storage), { theme: "dark" });
  assert.deepEqual(next.homeWidgets, []);
  assert.equal(next.theme, "dark");
});

test("order is the user's, and unknown or duplicate widgets are refused", () => {
  assert.deepEqual(
    parseSettings({ homeWidgets: ["weather", "headlines", "reading", "research"] }).homeWidgets,
    ["weather", "headlines", "reading", "research"],
  );
  assert.deepEqual(parseSettings({ homeWidgets: ["hijri", "prayer"] }).homeWidgets, [
    "hijri",
    "prayer",
  ]);
  assert.deepEqual(addHomeWidget(["weather"], "prayer"), ["weather", "prayer"]);
  assert.deepEqual(addHomeWidget(["weather"], "weather"), ["weather"]);
  assert.deepEqual(removeHomeWidget(["weather", "headlines"], "weather"), ["headlines"]);
  assert.deepEqual(removeHomeWidget(["weather"], "weather"), []);
  assert.deepEqual(moveHomeWidget(["weather", "headlines", "prayer"], 2, -1), [
    "weather",
    "prayer",
    "headlines",
  ]);
  assert.throws(() => parseSettings({ homeWidgets: ["weather", "weather"] }));
  assert.throws(() => parseSettings({ homeWidgets: ["spend"] }));
  assert.throws(() =>
    parseSettings({
      homeWidgets: ["weather", "headlines", "reading", "research", "prayer", "hijri", "weather"],
    }),
  );
});
