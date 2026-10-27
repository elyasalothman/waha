import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { LEAP_SERVICES } from "../src/lib/leap-services.ts";
const rows = [];
for (const url of [
  ...new Set(LEAP_SERVICES.map((s) => s.href).filter((s) => s.startsWith("https://"))),
  "https://news.alhajda.com/api/analysts",
  "https://news.alhajda.com/api/analysts/roster",
  "https://wiki.alhajda.com/api/search?q=saudi",
  "https://si.alhajda.com/api/mm/quota",
]) {
  try {
    const result = execFileSync(
      "curl",
      [
        "-sS",
        "-L",
        "--max-time",
        "25",
        "-o",
        "/dev/null",
        "-w",
        "%{http_code} %{url_effective}",
        url,
      ],
      { encoding: "utf8" },
    );
    rows.push({ url, result });
  } catch {
    rows.push({ url, error: "network or timeout" });
  }
}
for (const origin of [
  "https://waha.hajdah.com",
  "https://waha.alhajda.com",
  "capacitor://localhost",
  "https://localhost",
  "http://localhost:8082",
]) {
  for (const path of ["/api/mm/analyze", "/api/haqqiq/cv"]) {
    try {
      const headers = execFileSync(
        "curl",
        [
          "-sSI",
          "--max-time",
          "20",
          "-X",
          "OPTIONS",
          "-H",
          `Origin: ${origin}`,
          `https://si.alhajda.com${path}`,
        ],
        { encoding: "utf8" },
      );
      rows.push({
        origin,
        path,
        headers: headers.split(/\r?\n/).filter((s) => /^HTTP|^access-control|^vary:/i.test(s)),
      });
    } catch {
      rows.push({ origin, path, error: "network" });
    }
  }
}
writeFileSync(
  "docs/audits/leap-sources.json",
  JSON.stringify({ date: new Date().toISOString(), rows }, null, 2),
);
console.log(JSON.stringify(rows));
