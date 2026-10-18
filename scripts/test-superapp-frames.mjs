import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";
import { writeFile, mkdir } from "node:fs/promises";
const base = process.argv[2] || "https://waha.hajdah.com",
  out = process.argv[3] || "/tmp/waha-frames";
await mkdir(out, { recursive: true });
const results = [];
for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
  if (process.env.FRAME_ENGINE && process.env.FRAME_ENGINE !== engine) continue;
  const proxy = new URL(process.env.HTTPS_PROXY);
  const browser = await launcher.launch({
    headless: true,
    proxy: {
      server: proxy.origin,
      username: decodeURIComponent(proxy.username),
      password: decodeURIComponent(proxy.password),
      bypass: "localhost,127.0.0.1",
    },
  });
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
    ignoreHTTPSErrors: true,
  });
  const p = await context.newPage();
  p.setDefaultTimeout(30000);
  for (const type of ["hissati", "dallah", "hayat-world"]) {
    try {
      await p.goto(base + (type === "hissati" ? "/app/hissati" : "/play/" + type), {
        waitUntil: "networkidle",
      });
      await p
        .getByRole("button", {
          name: type === "hissati" ? "ابدأ حصتي داخل واحة" : "ابدأ اللعب",
          exact: true,
        })
        .click();
      const frame = p.frameLocator("iframe");
      if (type === "hissati") {
        await frame.getByText("الذكاء الاصطناعي", { exact: true }).first().waitFor();
        assert.match(await frame.locator("body").innerText(), /١٦/);
      }
      if (type === "dallah") {
        await frame.locator("#play").click();
        await frame.locator("#pause:not(:disabled)").waitFor();
        await frame.locator("canvas").tap();
        const advanced = await frame.locator("#time").evaluate(async (node) => {
          const start = Date.now();
          while (Number(node.textContent) >= 90 && Date.now() - start < 12000)
            await new Promise((resolve) => setTimeout(resolve, 200));
          return Number(node.textContent) < 90;
        });
        assert.ok(advanced, "Game timer must advance after play and jump");
      }
      if (type === "hayat-world") {
        await frame.locator("canvas").first().waitFor();
        await p.waitForTimeout(2500);
      }
      await p.screenshot({ path: `${out}/${engine}-${type}.png`, fullPage: true });
      results.push({
        engine,
        type,
        pass: true,
        proof:
          type === "dallah"
            ? "play, jump and running timer"
            : type === "hissati"
              ? "encyclopedia body with 16 paths"
              : "canvas present; world completion and saving untested",
      });
    } catch (e) {
      results.push({ engine, type, pass: false, error: e.message });
      await p
        .screenshot({ path: `${out}/${engine}-${type}-failure.png`, fullPage: true })
        .catch(() => {});
    }
    await writeFile(`${out}/report.json`, JSON.stringify(results, null, 2));
  }
  await browser.close();
}
console.log(JSON.stringify(results));
if (results.some((r) => !r.pass)) process.exitCode = 1;
