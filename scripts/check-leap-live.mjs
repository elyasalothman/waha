import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const rows = [];
const routes = [
  "/",
  "/mohsen",
  "/ask?q=test",
  "/services",
  "/analysts",
  "/service/hissati-explore",
  "/privacy",
  "/delete-account",
  "/settings",
  "/books",
  "/games",
  "/api/auth/get-session",
  "/sw.js",
  "/manifest.webmanifest",
  "/sitemap.xml",
];
for (const host of ["waha.hajdah.com", "waha.alhajda.com"]) {
  for (const route of routes) {
    try {
      const raw = execFileSync(
        "curl",
        ["-sS", "-L", "--max-time", "20", "-w", "\n%{http_code}", `https://${host}${route}`],
        { encoding: "utf8", maxBuffer: 6 * 1024 * 1024 },
      );
      const last = raw.lastIndexOf("\n");
      const body = raw.slice(0, last),
        status = Number(raw.slice(last + 1));
      const row = { host, route, status, ok: status === 200 };
      if (route === "/api/auth/get-session") {
        row.guestIsNull = body.trim() === "null";
        row.ok &&= row.guestIsNull;
      }
      if (route === "/sw.js") {
        row.sha256 = createHash("sha256").update(body).digest("hex");
        row.matchesSource = body === readFileSync("public/sw.js", "utf8");
        row.ok &&= row.matchesSource;
      }
      rows.push(row);
    } catch {
      rows.push({ host, route, ok: false, error: "network or timeout" });
    }
  }
}
writeFileSync(
  "docs/audits/leap-http-live.json",
  JSON.stringify({ date: new Date().toISOString(), rows }, null, 2),
);
console.log(
  JSON.stringify({
    passed: rows.filter((r) => r.ok).length,
    total: rows.length,
    failed: rows.filter((r) => !r.ok),
  }),
);
if (rows.some((r) => !r.ok)) process.exitCode = 1;
