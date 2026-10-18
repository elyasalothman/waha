import { chromium, webkit } from "playwright";
import { mkdir, writeFile, readFile } from "node:fs/promises";
const base = process.argv[2] || "https://waha.hajdah.com";
const out = process.argv[3] || "/tmp/waha-superapp";
await mkdir(out, { recursive: true });
const routes = [
  "/",
  "/welcome",
  "/today",
  "/more",
  "/more?view=square",
  "/ask",
  "/app/chat",
  "/madar",
  "/clips",
  "/forum",
  "/games",
  "/life",
  "/money",
  "/tools",
  "/studio",
  "/workspace",
  "/teacher",
  "/worship",
  "/quran",
  "/news",
  "/books",
  "/books/alhajda",
  "/compare",
  "/register",
  "/onboarding",
  "/app/sites",
  "/app/hissati",
  "/app/luma",
  "/app/hayat",
  "/app/samar",
  "/app/baloot",
  "/app/agent",
  "/app/amlak",
  "/app/manba",
  "/app/himaya",
  "/app/khazana",
  "/app/home",
  "/app/studio",
  "/app/hudoo",
  "/app/manteq",
];
const catalogSource = await readFile(new URL("../src/lib/catalog.ts", import.meta.url), "utf8");
for (const match of catalogSource
  .slice(
    catalogSource.indexOf("export const CATALOG"),
    catalogSource.indexOf("export const CATEGORIES"),
  )
  .matchAll(/\{ id: "([a-z0-9-]+)"/g)) {
  const route = `/app/${match[1]}`;
  if (!routes.includes(route)) routes.push(route);
}
for (const route of ["/me", "/play/dallah", "/play/hayat-world", "/admin"])
  if (!routes.includes(route)) routes.push(route);
const houseSource = await readFile(new URL("../src/lib/house-sites.ts", import.meta.url), "utf8");
for (const match of houseSource.matchAll(/id:\s*"([a-z0-9-]+)"/g)) {
  const route = `/app/${match[1]}`;
  if (!routes.includes(route)) routes.push(route);
}
const forumSource = await readFile(new URL("../src/lib/forum/seed.ts", import.meta.url), "utf8");
for (const match of forumSource.matchAll(/t\("(ft-[^"]+)", "([^"]+)"/g)) {
  for (const route of [`/forum/${match[2]}`, `/forum/${match[2]}/${match[1]}`])
    if (!routes.includes(route)) routes.push(route);
}
const results = [];
for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
  const proxy = process.env.HTTPS_PROXY ? new URL(process.env.HTTPS_PROXY) : null;
  const browser = await launcher.launch({
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
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  let errors = [],
    consoleErrors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  for (const route of routes) {
    errors = [];
    consoleErrors = [];
    const start = Date.now();
    try {
      const response = await page.goto(base + route, { waitUntil: "networkidle", timeout: 25000 });
      await page.waitForTimeout(300);
      const state = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        text: document.body.innerText.length,
        missing:
          /أداة غير موجودة|الصفحة غير موجودة|هذا التطبيق غير موجود|Page not found|This app does not exist/.test(
            document.body.innerText,
          ),
        exits: [...document.querySelectorAll('a[href^="http"]')].map((a) => a.href),
        headings: [...document.querySelectorAll("h1")].map((a) => a.textContent),
      }));
      const row = {
        engine,
        route,
        status: response.status(),
        ms: Date.now() - start,
        ...state,
        errors: [...errors],
        consoleErrors: [...consoleErrors],
      };
      row.pass =
        row.status === 200 &&
        row.width <= 393 &&
        row.text > 80 &&
        !row.missing &&
        !row.errors.length;
      row.health = !row.pass
        ? "broken"
        : row.consoleErrors.length
          ? "degraded"
          : row.ms > 5000
            ? "slow"
            : "healthy";
      results.push(row);
      if (!row.pass || ["/", "/today", "/more", "/app/hissati"].includes(route))
        await page.screenshot({
          path: `${out}/${engine}-${route.replace(/[^a-z0-9]/gi, "_")}.png`,
          fullPage: true,
        });
    } catch (e) {
      results.push({ engine, route, pass: false, error: e.message });
    }
    await writeFile(
      `${out}/report.json`,
      JSON.stringify(
        { base, viewport: "393x852", date: new Date().toISOString(), results },
        null,
        2,
      ),
    );
  }
  await browser.close();
}
console.log(
  JSON.stringify({
    total: results.length,
    failed: results
      .filter((r) => !r.pass)
      .map((r) => ({
        engine: r.engine,
        route: r.route,
        error: r.error,
        errors: r.errors,
        width: r.width,
      })),
  }),
);
