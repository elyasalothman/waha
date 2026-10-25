import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { SERVICES } from "../src/lib/superapp.ts";
const base = process.argv[2] || "http://localhost:8081";
const out = process.argv[3] || "/tmp/polish-before";
await mkdir(out, { recursive: true });
const proxy = process.env.HTTPS_PROXY ? new URL(process.env.HTTPS_PROXY) : null;
const browser = await chromium.launch({
  headless: true,
  ...(proxy
    ? {
        proxy: {
          server: proxy.origin,
          username: decodeURIComponent(proxy.username),
          password: decodeURIComponent(proxy.password),
          bypass: "localhost,127.0.0.1",
        },
      }
    : {}),
});
const main = [
  "/",
  "/books",
  "/tools",
  "/games",
  "/me",
  "/settings",
  "/onboarding",
  "/welcome",
  "/books/alhajda",
  "/pro/pdf",
  "/money",
];
if (process.env.AUDIT_EXTRA) main.push(...process.env.AUDIT_EXTRA.split(","));
const rows = [];
for (const width of [390, 1280])
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 800 },
      colorScheme: theme,
      ignoreHTTPSErrors: true,
    });
    await context.addInitScript(() => {
      window.__vitals = { lcp: 0, cls: 0 };
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) window.__vitals.lcp = e.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (!e.hadRecentInput) window.__vitals.cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    const page = await context.newPage();
    let errors = [],
      consoles = [],
      http = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") consoles.push(m.text());
    });
    page.on("response", (r) => {
      if (r.status() >= 400) http.push({ url: r.url(), status: r.status() });
    });
    const routes =
      process.env.AUDIT_CATALOG === "1" && width === 390
        ? [...new Set([...main, ...SERVICES.map((s) => s.href)])]
        : main;
    for (const route of routes) {
      errors = [];
      consoles = [];
      http = [];
      try {
        const res = await page.goto(base + route, {
          waitUntil: "domcontentloaded",
          timeout: 45000,
        });
        await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
        await page.waitForTimeout(450);
        const metrics = await page.evaluate(() => ({
          width: document.documentElement.scrollWidth,
          text: document.body.innerText.length,
          links: [...document.querySelectorAll("a[href]")]
            .map((a) => a.href)
            .filter((h) => h.startsWith("http")),
          title: document.title,
          dark: document.documentElement.classList.contains("waha-dark"),
          ...window.__vitals,
          small: [...document.querySelectorAll("button,a,input,select,summary")]
            .filter(
              (e) =>
                e.checkVisibility() &&
                !e.classList.contains("sr-only") &&
                !e.closest(".sr-only") &&
                !(
                  e instanceof HTMLInputElement &&
                  ["checkbox", "radio"].includes(e.type) &&
                  [...(e.labels || [])].some((label) => {
                    const rect = label.getBoundingClientRect();
                    return rect.width >= 44 && rect.height >= 44;
                  })
                ) &&
                e.getBoundingClientRect().width > 1,
            )
            .filter((e) => {
              const r = e.getBoundingClientRect();
              return r.height < 43 || r.width < 43;
            })
            .map((e) => ({
              text: (e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 65),
              h: Math.round(e.getBoundingClientRect().height),
              w: Math.round(e.getBoundingClientRect().width),
            }))
            .slice(0, 25),
        }));
        const row = {
          route,
          viewport: width,
          theme,
          status: res?.status(),
          ...metrics,
          errors: [...errors],
          console: [...consoles],
          http: [...http],
        };
        row.pass = row.status === 200 && row.width <= width && !row.errors.length && row.text > 70;
        rows.push(row);
        if (main.includes(route) || width === 390)
          await page.screenshot({
            path: `${out}/${width}-${theme}-${route.replaceAll("/", "_") || "home"}.png`,
            fullPage: main.includes(route),
          });
        console.log(width, theme, route, row.pass ? "ok" : "FAIL", metrics.cls.toFixed(3));
      } catch (e) {
        rows.push({ route, viewport: width, theme, pass: false, error: String(e) });
        console.log(route, "FAIL", String(e).slice(0, 180));
      }
    }
    await context.close();
  }
await browser.close();
await writeFile(
  out + "/report.json",
  JSON.stringify({ base, at: new Date().toISOString(), rows }, null, 2),
);
if (rows.some((r) => !r.pass)) process.exitCode = 1;
