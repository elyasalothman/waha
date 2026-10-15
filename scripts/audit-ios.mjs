import { webkit } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
const base = process.argv[2] || "http://127.0.0.1:8080";
const out = process.argv[3] || "/tmp/waha-ios-audit";
await mkdir(out, { recursive: true });
const proxy = process.env.HTTPS_PROXY ? new URL(process.env.HTTPS_PROXY) : null;
const browser = await webkit.launch({
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
const results = [];
const context = await browser.newContext({
  viewport: { width: 393, height: 852 },
  hasTouch: true,
  isMobile: true,
  ignoreHTTPSErrors: true,
});
const errors = [];
context.on("page", (page) => page.on("pageerror", (e) => errors.push(e.message)));
try {
  const page = await context.newPage();
  for (const route of ["/today", "/app/baloot", "/ask", "/worship", "/teacher", "/books"]) {
    const response = await page.goto(base + route, { waitUntil: "networkidle" });
    assert.equal(response.status(), 200, route);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
      route,
    );
    await page.screenshot({
      path: join(out, `web-${route.replaceAll("/", "_")}.png`),
      fullPage: true,
    });
    results.push({ name: route, viewport: "393x852", pass: true });
  }
  await context.addInitScript(() => {
    window.CapacitorCustomPlatform = { name: "ios" };
    window.__nativeCalls = [];
    window.__reminders = [];
    const headers = {
      HouseDoorBrowser: ["open", "selection"],
      StatusBar: ["setStyle", "setOverlaysWebView"],
      Keyboard: ["setStyle", "setResizeMode"],
      LocalNotifications: ["getPending", "requestPermissions", "schedule", "cancel"],
    };
    window.Capacitor = {
      isNativePlatform: () => true,
      PluginHeaders: Object.entries(headers).map(([name, methods]) => ({
        name,
        methods: methods.map((name) => ({ name, rtype: "promise" })),
      })),
      nativePromise: async (plugin, method, options) => {
        window.__nativeCalls.push({ plugin, method, options });
        if (method === "getPending") return { notifications: window.__reminders };
        if (method === "requestPermissions")
          return { display: window.__denyPermission ? "denied" : "granted" };
        if (method === "schedule") window.__reminders.push(...options.notifications);
        if (method === "cancel")
          window.__reminders = window.__reminders.filter(
            (n) => !options.notifications.some((row) => row.id === n.id),
          );
        return {};
      },
    };
  });
  await page.goto(base + "/today", { waitUntil: "networkidle" });
  await page.locator("html.native-ios").waitFor();
  await page.emulateMedia({ colorScheme: "dark" });
  await page.locator("html.native-dark").waitFor();
  await page.emulateMedia({ colorScheme: "light" });
  await page.waitForFunction(() => !document.documentElement.classList.contains("native-dark"));
  await page.getByText("تذكيرات iPhone", { exact: true }).click();
  assert.equal(
    await page.evaluate(() => window.__nativeCalls.some((c) => c.method === "requestPermissions")),
    false,
  );
  await page.evaluate(() => {
    window.__denyPermission = true;
  });
  await page.getByRole("button", { name: /الورد ٨ مساءً/ }).click();
  await page.getByText("اسمح بإشعارات واحة", { exact: false }).waitFor();
  assert.equal(await page.evaluate(() => window.__reminders.length), 0);
  await page.evaluate(() => {
    window.__denyPermission = false;
  });
  await page.getByRole("button", { name: /الورد ٨ مساءً/ }).click();
  await page.getByRole("button", { name: /الورد ٨ مساءً: مفعّل/ }).waitFor();
  await page.getByRole("button", { name: /الموجز ٨ صباحًا/ }).click();
  await page.getByRole("button", { name: /الموجز ٨ صباحًا: مفعّل/ }).waitFor();
  assert.equal(await page.evaluate(() => window.__reminders.length), 2);
  await page.getByRole("button", { name: /الورد ٨ مساءً/ }).click();
  await page.getByRole("button", { name: /الورد ٨ مساءً: متوقف/ }).waitFor();
  assert.equal(await page.evaluate(() => window.__reminders.length), 1);
  await page.locator(".native-safe-bottom a").last().click();
  await page.waitForFunction(() => window.__nativeCalls.some((c) => c.method === "selection"));
  results.push({
    name: "Native bridge simulation: appearance, opt-in/denied reminders, repeat schedules, cancellation, haptics",
    pass: true,
    simulated: true,
  });
  await page.goto(base + "/today", { waitUntil: "networkidle" });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.screenshot({ path: join(out, "native-dark.png"), fullPage: true });

  const offline = await browser.newContext({
    viewport: { width: 393, height: 852 },
    hasTouch: true,
    isMobile: true,
  });
  const local = await offline.newPage();
  await local.goto("http://127.0.0.1:8082/");
  await offline.setOffline(true);
  await local.getByLabel("ملاحظة محفوظة على الجهاز").fill("ملاحظتي محفوظة دون شبكة");
  await local.getByLabel("قرأت وردي").check();
  await local.getByRole("button", { name: "تسبيح: 0", exact: true }).click();
  await local.getByRole("button", { name: "تسبيح: 1", exact: true }).waitFor();
  await offline.setOffline(false);
  await local.reload();
  await offline.setOffline(true);
  assert.equal(
    await local.getByLabel("ملاحظة محفوظة على الجهاز").inputValue(),
    "ملاحظتي محفوظة دون شبكة",
  );
  assert.equal(await local.getByLabel("قرأت وردي").isChecked(), true);
  assert.equal(
    await local.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
  );
  await local.screenshot({ path: join(out, "offline.png"), fullPage: true });
  results.push({
    name: "Bundled tools: network disabled during interaction; local-server reload for notes/checklist persistence, counter, 393px",
    pass: true,
    localServerReload: true,
  });
  await offline.close();
  assert.deepEqual(errors, []);
} finally {
  await writeFile(
    join(out, "report.json"),
    JSON.stringify(
      { base, engine: "WebKit Linux", results, errors, nativeDeviceTested: false },
      null,
      2,
    ),
  );
  await browser.close();
}
console.log(JSON.stringify(results));
