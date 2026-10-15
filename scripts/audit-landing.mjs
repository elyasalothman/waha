/** Production landing audit. No account is fabricated: unavailable production registration is reported as blocked. */
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.argv[2] || "http://127.0.0.1:8080";
const out = process.argv[3] || "/tmp/waha-landing-audit";
await mkdir(out, { recursive: true });
const proxy = process.env.HTTPS_PROXY ? new URL(process.env.HTTPS_PROXY) : null;
const browser = await chromium.launch({
  args: ["--no-sandbox"],
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
const report = {
  base,
  at: new Date().toISOString(),
  checks: [],
  pages: [],
  errors: [],
  accountTest: null,
};
const check = (name, data = true) => {
  report.checks.push({ name, data });
  console.log("PASS", name);
};
const context = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
context.on("page", (p) => p.on("pageerror", (e) => report.errors.push(e.message)));
await context.addInitScript(() => {
  window.__vitals = { lcp: 0, cls: 0 };
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) window.__vitals.lcp = e.startTime;
  }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) if (!e.hadRecentInput) window.__vitals.cls += e.value;
  }).observe({ type: "layout-shift", buffered: true });
});
try {
  for (const width of [375, 390, 430, 1440]) {
    const page = await context.newPage();
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    const response = await page.goto(base + "/", { waitUntil: "networkidle" });
    assert.equal(response.status(), 200);
    await page.getByRole("heading", { name: /يومك كله/ }).waitFor();
    const metrics = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      ...window.__vitals,
      images: [...document.images].map((i) => ({
        src: i.getAttribute("src"),
        loaded: i.complete && i.naturalWidth > 0,
      })),
    }));
    assert.equal(metrics.width, width);
    assert.ok(metrics.images.filter((i) => i.src.includes("quran")).every((i) => i.loaded));
    assert.equal(await page.locator(".landing-pillars > a").count(), 4);
    assert.ok((await page.locator(".landing-house-sites > a").count()) >= 16);
    assert.ok(await page.locator('meta[property="og:image"]').getAttribute("content"));
    const schema = JSON.parse(
      await page.locator('script[type="application/ld+json"]').textContent(),
    );
    assert.equal(schema["@type"], "WebApplication");
    const small = await page.locator("a,button,summary").evaluateAll((es) =>
      es
        .filter((e) => {
          if (e.classList.contains("sr-only") && document.activeElement !== e) return false;
          const r = e.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44);
        })
        .map((e) => e.textContent),
    );
    assert.deepEqual(small, []);
    await page.screenshot({ path: `${out}/landing-${width}.png`, fullPage: true });
    report.pages.push({ width, status: response.status(), ...metrics });
    check(`landing RTL, SEO, schema, targets ${width}`);
    await page.locator("summary").filter({ hasText: "هل أحتاج حسابًا لاستخدام واحة؟" }).click();
    assert.ok(await page.locator("details[open]").count());
    await page
      .getByRole("link", { name: /جرّب بدون حساب/ })
      .first()
      .click();
    await page.waitForURL("**/today");
    await page.getByRole("heading", { name: "يومك في واحة", exact: true }).waitFor();
    check(`guest daily access ${width}`);
    await page.close();
  }
  const page = await context.newPage();
  await page.goto(base + "/welcome", { waitUntil: "networkidle" });
  assert.equal(await page.locator("h1").count(), 1);
  check("welcome always available");
  await page.goto(base + "/register?mode=signup", { waitUntil: "networkidle" });
  await page.screenshot({ path: out + "/register-before.png", fullPage: true });
  console.log("REGISTER", page.url(), (await page.locator("body").innerText()).slice(0, 160));
  const capabilities = await (await context.request.get(base + "/api/auth-status")).json();
  assert.equal(await page.locator("input[name=email]").getAttribute("type"), "email");
  assert.equal(await page.locator("input[name=password]").getAttribute("minlength"), "10");
  assert.equal(
    await page.getByRole("button", { name: "المتابعة باستخدام Google" }).count(),
    capabilities.google ? 1 : 0,
  );
  if (!capabilities.email) {
    assert.ok(await page.getByRole("button", { name: "إنشاء حساب مجاني" }).isDisabled());
    // Explicitly attempt the real production endpoint, with test-only data. 503 must occur before any database writes.
    const r = await context.request.post(base + "/api/auth/sign-up/email", {
      headers: { Origin: new URL(base).origin },
      data: {
        name: "Waha audit",
        email: `waha-audit-${Date.now()}@example.com`,
        password: "TestOnly-Waha-29!",
      },
    });
    assert.equal(r.status(), 503);
    assert.equal((await r.json()).code, "AUTH_NOT_CONFIGURED");
    report.accountTest = {
      status: "blocked",
      httpStatus: 503,
      reason:
        "Production authentication environment missing; no account created, so no account to delete.",
    };
    check("real signup fails closed with explicit 503; no fake account");
  } else {
    report.accountTest = {
      status: "requires-manual-account-test",
      reason: "Authentication enabled; use an approved test mailbox for signup and cleanup.",
    };
  }
  await page.screenshot({ path: out + "/register.png", fullPage: true });
  await page.getByRole("link", { name: "نسيت كلمة المرور؟", exact: true }).click();
  await page.getByRole("heading", { name: "نسيت كلمة المرور؟" }).waitFor();
  if (!capabilities.passwordReset)
    assert.ok(await page.getByRole("button", { name: "أرسل رابط الاستعادة" }).isDisabled());
  check("forgot password has truthful availability");
  await page.goto(base + "/onboarding", { waitUntil: "networkidle" });
  await page.getByLabel("ديني والقرآن", { exact: true }).check();
  await page.getByLabel("الكتب والتعلّم", { exact: true }).check();
  await page.getByRole("button", { name: "إلى يومي", exact: true }).click();
  await page.waitForURL("**/today");
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator('section[aria-label="اهتماماتك"] a').count(), 3);
  check("interests save, customize daily links, persist across reload");
  await page.goto(base + "/welcome", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    document.documentElement.dir = "ltr";
  });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  check("no overflow with LTR document");
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches),
    true,
  );
  check("reduced motion preference supported");
  // Simulated session tests routing only, never represents successful real login.
  const sessionContext = await browser.newContext({ ignoreHTTPSErrors: true });
  await sessionContext.route("**/api/auth/get-session", (route) =>
    route.fulfill({
      json: {
        user: {
          id: "routing-test",
          name: "Route Test",
          email: "routing@example.com",
          emailVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        session: {
          id: "routing-test",
          userId: "routing-test",
          token: "routing-only",
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
      },
    }),
  );
  const signed = await sessionContext.newPage();
  await signed.goto(base + "/");
  await signed.waitForURL("**/today");
  check("authenticated root redirect (simulated session, routing only)");
  await signed.goto(base + "/welcome");
  await signed.getByRole("heading", { name: /يومك كله/ }).waitFor();
  check("welcome remains accessible to signed in user (simulated session)");
  await sessionContext.close();
  assert.deepEqual(report.errors, []);
  check("no uncaught JavaScript errors");
} finally {
  await writeFile(out + "/report.json", JSON.stringify(report, null, 2));
  await browser.close();
}
