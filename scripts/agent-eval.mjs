import { spawnSync } from "node:child_process";
if (!process.execArgv.includes("--experimental-strip-types")) {
  const result = spawnSync(process.execPath, ["--experimental-strip-types", import.meta.filename], {
    stdio: "inherit",
  });
  process.exit(result.status ?? 1);
}
const { readFile } = await import("node:fs/promises");
const { parseIntent } = await import("../src/lib/agent/intents.ts");
const cases = JSON.parse(
  await readFile(new URL("../src/lib/agent/eval/phrases.json", import.meta.url), "utf8"),
);
const results = new Map();
let passed = 0;
for (const row of cases) {
  let actual;
  try {
    actual = parseIntent(row.text);
  } catch {
    actual = null;
  }
  const ok = actual?.tool === row.tool && JSON.stringify(actual?.args) === JSON.stringify(row.args);
  passed += Number(ok);
  const counts = results.get(row.tool) || [0, 0];
  counts[0] += Number(ok);
  counts[1]++;
  results.set(row.tool, counts);
  if (!ok) console.error(JSON.stringify({ phrase: row.text, expected: row, actual }));
}
for (const [tool, [ok, total]] of results) console.log(`${tool}: ${ok}/${total}`);
console.log(`Accuracy: ${passed}/${cases.length} (${((100 * passed) / cases.length).toFixed(1)}%)`);
if (cases.length < 150 || passed / cases.length < 0.95) process.exitCode = 1;
