import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { default: lighthouse } = await import(
  pathToFileURL(
    process.env.LIGHTHOUSE_MODULE || "/tmp/waha-polish-lh/node_modules/lighthouse/core/index.js",
  ).href
);
const base = process.argv[2] || "http://localhost:8081";
const out = process.argv[3] || "/tmp/polish-lighthouse-before";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  args: ["--remote-debugging-port=9223", "--ignore-certificate-errors"],
  headless: true,
});
const rows = [];
try {
  for (const mode of ["mobile", "desktop"])
    for (const route of process.env.LH_ROUTES
      ? process.env.LH_ROUTES.split(",")
      : ["/", "/books", "/tools", "/games", "/me", "/settings", "/books/alhajda"]) {
      try {
        const result = await lighthouse(base + route, {
          port: 9223,
          output: "json",
          logLevel: "error",
          onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
          formFactor: mode,
          screenEmulation: {
            mobile: mode === "mobile",
            width: mode === "mobile" ? 390 : 1280,
            height: mode === "mobile" ? 844 : 800,
            deviceScaleFactor: 1,
            disabled: false,
          },
          throttlingMethod: "simulate",
          ...(mode === "desktop"
            ? { throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 } }
            : {}),
        });
        const lhr = result.lhr;
        await writeFile(
          `${out}/${mode}-${route.replaceAll("/", "_") || "home"}.json`,
          JSON.stringify(lhr),
        );
        const row = {
          mode,
          route,
          scores: Object.fromEntries(
            Object.entries(lhr.categories).map(([k, v]) => [k, Math.round(v.score * 100)]),
          ),
          lcp: lhr.audits["largest-contentful-paint"].numericValue,
          cls: lhr.audits["cumulative-layout-shift"].numericValue,
          errors: lhr.runtimeError || null,
          failures: Object.values(lhr.audits)
            .filter((a) => a.score !== null && a.score < 1)
            .map((a) => ({
              id: a.id,
              title: a.title,
              display: a.displayValue,
              details: [
                "color-contrast",
                "button-name",
                "link-name",
                "label",
                "meta-description",
                "document-title",
              ].includes(a.id)
                ? a.details
                : undefined,
            })),
        };
        rows.push(row);
        console.log(mode, route, JSON.stringify(row.scores), row.lcp, row.cls);
        await writeFile(
          out + "/summary.json",
          JSON.stringify(
            {
              base,
              at: new Date().toISOString(),
              pwa: "Modern Lighthouse has no PWA category; verified separately with Playwright.",
              rows,
            },
            null,
            2,
          ),
        );
      } catch (e) {
        rows.push({ mode, route, error: String(e) });
        console.log("FAIL", mode, route, String(e));
      }
    }
} finally {
  await browser.close();
  await writeFile(out + "/summary.json", JSON.stringify({ base, rows }, null, 2));
}
