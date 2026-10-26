import { test } from "node:test";
import assert from "node:assert/strict";
import { plan, splitCommands, executePlan } from "./planner.ts";
import { validateCommand, registry, requiresConfirmation } from "./registry.ts";
import { readFileSync } from "node:fs";
import { parseIntent } from "./intents.ts";
test("Arabic multi-step and city context", () => {
  const p = plan("افتح الطقس بجدة وبعدين ذكرني الساعة ٥ أشرب موية");
  assert.equal(p.steps.length, 2);
  assert.equal(p.steps[0].command.tool, "weather");
  assert.equal(p.steps[1].command.tool, "add_reminder");
  assert.deepEqual(plan("طقس", { city: "جدة" }).steps[0].command.args, { city: "جدة" });
});
test("book titles and math are not split on ordinary waw", () => {
  assert.equal(splitCommands("افتح كتاب الحرب والسلام").length, 1);
  assert.equal(splitCommands("افتح كتاب كذا ثم كذا").length, 1);
  assert.equal(splitCommands("احسب ٢ و ٣").length, 1);
  assert.equal(splitCommands("افتح الحاسبة وافتح الكتب").length, 2);
});
test("sequential execution pauses before changing action and resumes once", async () => {
  const called: string[] = [];
  const host = {
    execute: async (command: { tool: string }) => {
      called.push(command.tool);
      return "ok";
    },
  };
  const p = plan("افتح الحاسبة ثم اضف ملاحظة اختبار ثم افتح الكتب");
  const stopped = await executePlan(p, host);
  assert.deepEqual(called, ["open_app"]);
  assert.equal(stopped.steps[1].status, "confirmation");
  const done = await executePlan(stopped, host, { confirmedStepIds: ["step-2"] });
  assert.deepEqual(called, ["open_app", "add_note", "open_app"]);
  assert.ok(done.steps.every((s) => s.status === "done"));
});
test("failure stops later steps and uncertainty is inert", async () => {
  let calls = 0;
  const host = {
    execute: async () => {
      calls++;
      throw new Error("فشل");
    },
  };
  const result = await executePlan(plan("افتح الحاسبة ثم افتح الكتب"), host);
  assert.equal(calls, 1);
  assert.equal(result.steps[0].status, "failed");
  const ambiguous = plan("حاجة مش واضحة");
  assert.ok(ambiguous.suggestions.length >= 2);
  await executePlan(ambiguous, host);
  assert.equal(calls, 1);
});
test("strict tool schemas reject forbidden actions extra args and unsafe URLs", () => {
  for (const tool of ["buy", "publish", "send_message", "delete_all"])
    assert.throws(() => validateCommand({ tool, args: {} }));
  assert.throws(() => validateCommand({ tool: "math", args: { expr: "2+2", code: "evil" } }));
  for (const url of ["http://example.com", "javascript:alert(1)", "https://user:pass@example.com"])
    assert.throws(() => validateCommand({ tool: "open_url", args: { url } }));
  assert.equal(registry.open_url.changing, true);
});
test("Arabic evaluation accuracy >=95%, at least 150 examples", () => {
  const cases = JSON.parse(
    readFileSync(new URL("./eval/phrases.json", import.meta.url), "utf8"),
  ) as { text: string; tool: string; args: object }[];
  assert.ok(cases.length >= 150);
  let correct = 0;
  for (const row of cases) {
    try {
      const cmd = parseIntent(row.text);
      if (cmd?.tool === row.tool && JSON.stringify(cmd.args) === JSON.stringify(row.args))
        correct++;
    } catch {
      /* Invalid parse counts as a failed evaluation case. */
    }
  }
  assert.ok(correct / cases.length >= 0.95, `${correct}/${cases.length}`);
});

test("external catalog apps pause for confirmation", async () => {
  const { CATALOG } = await import("../catalog.ts");
  // Current house destinations are internal; model a future external catalog item.
  const fixture = { ...CATALOG[0], id: "external-test", href: "https://example.com" };
  CATALOG.push(fixture);
  try {
    const command = validateCommand({ tool: "open_app", args: { id: fixture.id } });
    assert.equal(requiresConfirmation(command), true);
    let calls = 0;
    const input = plan(`افتح ${fixture.id}`);
    const stopped = await executePlan(input, {
      execute: async () => {
        calls++;
      },
    });
    assert.equal(stopped.steps[0].status, "confirmation");
    assert.equal(calls, 0);
    await executePlan(
      stopped,
      {
        execute: async () => {
          calls++;
        },
      },
      { confirmedStepIds: [stopped.steps[0].id] },
    );
    assert.equal(calls, 1);
    assert.equal(
      requiresConfirmation(validateCommand({ tool: "open_app", args: { id: "calc" } })),
      false,
    );
  } finally {
    CATALOG.splice(CATALOG.indexOf(fixture), 1);
  }
});

test("Saudi commands and vocalized verbs split without altering original text", () => {
  for (const second of [
    "شغل البث",
    "ودني الكتب",
    "وش تذكر عني",
    "انسَ اسمي",
    "تذكّر أن مدينتي جدة",
  ]) {
    const text = `افتح الحاسبة ثم ${second}`;
    assert.deepEqual(splitCommands(text), ["افتح الحاسبة", second]);
    const p = plan(text);
    assert.equal(p.steps.length, 2, text);
    assert.equal(p.steps[0].command.tool, "open_app", text);
  }
  assert.deepEqual(splitCommands("افتح كتاب الشرق ثم الغرب"), ["افتح كتاب الشرق ثم الغرب"]);
  assert.deepEqual(splitCommands("افتح كتاب كيف نقرأ ونكتب"), ["افتح كتاب كيف نقرأ ونكتب"]);
  assert.deepEqual(splitCommands("افتح الحاسبة وشغل البث"), ["افتح الحاسبة", "شغل البث"]);
});

test("knowledge questions using كم are remote while bare equations stay local", () => {
  assert.equal(plan("كم عدد سكان السعودية").steps[0].command.tool, "ask_mohsen");
  assert.equal(plan("كم ٢٥×٤").steps[0].command.tool, "calculate");
  assert.equal(plan("x^2-5x+6=0").steps[0].command.tool, "math");
});
test("deletion in a multi-step plan keeps its own confirmation gate", async () => {
  const p = plan("افتح الحاسبة ثم احذف ملاحظة abc");
  const calls: string[] = [];
  const result = await executePlan(p, {
    execute: async (c) => {
      calls.push(c.tool);
    },
  });
  assert.deepEqual(calls, ["open_app"]);
  assert.equal(result.steps[1].status, "confirmation");
});

test("weekday reminder preserves the requested hour through intent parsing", async () => {
  const { parseArabicTime } = await import("./local.ts");
  const command = parseIntent("ذكرني يوم الخميس ٥ العصر أشرب موية");
  assert.equal(command?.tool, "add_reminder");
  if (command?.tool !== "add_reminder") throw new Error("wrong tool");
  assert.equal(new Date(parseArabicTime(command.args.when!)!.dueAt).getHours(), 17);
});
