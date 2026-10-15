/** Read-only mobile smoke audit. Usage: node scripts/audit-mobile.mjs [base URL] [output directory] */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.argv[2] || "https://waha.hajdah.com";
const output = process.argv[3] || "/tmp/waha-mobile-audit";
const proxyUrl = process.env.HTTPS_PROXY ? new URL(process.env.HTTPS_PROXY) : null;
const browser = await chromium.launch({
  headless: true,
  ...(proxyUrl
    ? {
        proxy: {
          server: proxyUrl.origin,
          username: decodeURIComponent(proxyUrl.username),
          password: decodeURIComponent(proxyUrl.password),
          bypass: "localhost,127.0.0.1",
        },
      }
    : {}),
});
await mkdir(output, { recursive: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 1,
  // Explicit opt-in only, for environments whose inspecting proxy has a private CA.
  ignoreHTTPSErrors: process.env.AUDIT_IGNORE_HTTPS_ERRORS === "1",
});
await context.addInitScript(() => {
  window.__auditVitals = { lcp: 0, cls: 0 };
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) window.__auditVitals.lcp = entry.startTime;
  }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) window.__auditVitals.cls += entry.value;
    }
  }).observe({ type: "layout-shift", buffered: true });
});
const results = [];
try {
  for (const path of ["/", "/books", "/books/alhajda", "/games", "/life", "/money"]) {
    const page = await context.newPage();
    const errors = [],
      failedResponses = [],
      failedRequests = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("response", (response) => {
      if (response.status() >= 400)
        failedResponses.push({ url: response.url(), status: response.status() });
    });
    page.on("requestfailed", (request) =>
      failedRequests.push({ url: request.url(), error: request.failure()?.errorText }),
    );
    const response = await page.goto(new URL(path, base).href, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForTimeout(1200);
    const metrics = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: 390,
      vitals: window.__auditVitals,
      loadMs: performance.getEntriesByType("navigation")[0].loadEventEnd,
      transferredBytes: performance
        .getEntriesByType("resource")
        .reduce((sum, resource) => sum + resource.transferSize, 0),
      links: [
        ...new Set(
          [...document.querySelectorAll("a[href]")].map((link) => link.getAttribute("href")),
        ),
      ],
      smallTargets: [...document.querySelectorAll("button,a,input,select")]
        .filter((element) => !element.closest(".sr-only") && !element.disabled)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            label: (element.getAttribute("aria-label") || element.textContent || "")
              .trim()
              .slice(0, 70),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        })
        .filter(
          (target) =>
            target.width > 1 && target.height > 1 && (target.width < 44 || target.height < 44),
        ),
    }));
    await page.screenshot({
      path: `${output}/${path === "/" ? "home" : path.slice(1).replaceAll("/", "-")}.png`,
      fullPage: true,
    });
    results.push({
      path,
      status: response.status(),
      errors,
      failedResponses,
      failedRequests,
      ...metrics,
    });
    console.log(JSON.stringify(results.at(-1)));
    await page.close();
  }
  await writeFile(
    `${output}/report.json`,
    JSON.stringify(
      {
        base,
        viewport: "390×844",
        ignoreHTTPSErrors: process.env.AUDIT_IGNORE_HTTPS_ERRORS === "1",
        results,
      },
      null,
      2,
    ),
  );
  if (results.some((result) => result.status !== 200 || result.width > result.viewport))
    process.exitCode = 1;
} finally {
  await browser.close();
}
