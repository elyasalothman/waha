import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { default: lighthouse } = await import(
  pathToFileURL(
    process.env.LIGHTHOUSE_MODULE || "/tmp/waha2-lighthouse/node_modules/lighthouse/core/index.js",
  ).href
);
const browser = await chromium.launch({
  headless: true,
  args: ["--remote-debugging-port=9224", "--ignore-certificate-errors"],
});
try {
  const result = await lighthouse(process.argv[2] || "http://localhost:8082/", {
    port: 9224,
    output: ["html"],
    logLevel: "error",
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    formFactor: "mobile",
    screenEmulation: {
      mobile: true,
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      disabled: false,
    },
    throttlingMethod: "simulate",
  });
  await writeFile("docs/audits/leap-lighthouse-mobile.json", JSON.stringify(result.lhr, null, 2));
  await writeFile(
    "docs/audits/leap-lighthouse-mobile.html",
    Array.isArray(result.report) ? result.report[0] : result.report,
  );
  const scores = Object.fromEntries(
    Object.entries(result.lhr.categories).map(([k, v]) => [k, Math.round(v.score * 100)]),
  );
  console.log(
    JSON.stringify({
      scores,
      lcp: result.lhr.audits["largest-contentful-paint"].numericValue,
      cls: result.lhr.audits["cumulative-layout-shift"].numericValue,
    }),
  );
  if (scores.performance < 82) process.exitCode = 1;
} finally {
  await browser.close();
}
