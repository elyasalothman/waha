import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { dirname, resolve, relative } from "node:path";
const target = process.argv[2];
if (!target) throw new Error("Usage: node scripts/export-agent-core.mjs <destination>");
const root = resolve("src/lib");
const seen = new Set();
async function copy(file) {
  if (seen.has(file)) return;
  seen.add(file);
  const source = await readFile(file, "utf8");
  if (/from\s+["']@\//.test(source)) throw new Error(`Platform import: ${file}`);
  const dest = resolve(target, relative(root, file));
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, source);
  for (const match of source.matchAll(/from\s+["'](\.[^"']+)["']/g)) {
    const dep = resolve(dirname(file), match[1]);
    if (dep.endsWith(".ts") || dep.endsWith(".json")) await copy(dep);
  }
}
for (const name of ["registry.ts", "intents.ts", "planner.ts", "math.ts", "local.ts"]) {
  try {
    await copy(resolve(root, "agent", name));
  } catch (error) {
    if (name !== "math.ts" || error.code !== "ENOENT") throw error;
  }
}
await copyFile("docs/AGENT-CORE.md", resolve(target, "README.md"));
console.log(`Exported ${seen.size} portable core files to ${resolve(target)}`);
