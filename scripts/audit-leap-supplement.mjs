import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
import { composeClip } from "../src/lib/mohsen-v4.ts";
const base = process.argv[2] || "http://localhost:8082",
  rows = [];
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
try {
  const page = await browser.newPage({
    ignoreHTTPSErrors: true,
    viewport: { width: 390, height: 844 },
  });
  await page.addInitScript(() => {
    localStorage.setItem(
      "waha:directory:v2",
      JSON.stringify({ recent: ["wiki", "phones"], favorites: ["bench", "skills"] }),
    );
  });
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  rows.push({ name: "الرئيسية المخصصة في شاشتين", height, ok: height <= 1688 });
  await page.screenshot({
    path: "/workspace/work/waha-leap-shots/personalized-home-390.png",
    fullPage: true,
  });
  await page.goto(base + "/mohsen");
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "سيرتي", exact: true }).click();
  rows.push({
    name: "نموذج سيرتي داخل واحة",
    ok: await page.getByText("خبرتك أو سيرتك (30 حرفًا على الأقل)", { exact: true }).isVisible(),
  });
  await page.getByRole("button", { name: "المقابلة", exact: true }).click();
  rows.push({
    name: "نموذج المقابلة",
    ok: await page
      .getByText("جوابك للتقييم عن «حدثنا عن خبرتك» (اختياري)", { exact: true })
      .isVisible(),
  });
  const fixture = await browser.newPage();
  await fixture.goto("about:blank");
  await fixture.addScriptTag({ content: `window.composeClip=${composeClip.toString()}` });
  const result = await fixture.evaluate(async () => {
    const c = document.createElement("canvas");
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext("2d");
    const urls = ["#146455", "#e8cba0", "#477d94"].map((color) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 32, 32);
      return c.toDataURL("image/png");
    });
    const clip = await window.composeClip(urls, new AbortController().signal);
    let size = 0;
    if (clip) {
      size = (await (await fetch(clip)).blob()).size;
      URL.revokeObjectURL(clip);
    }
    const saved = window.MediaRecorder;
    window.MediaRecorder = undefined;
    const fallback = await window.composeClip(urls, new AbortController().signal);
    window.MediaRecorder = saved;
    return { size, fallback, canRecord: !!saved };
  });
  rows.push({
    name: "تركيب WebM من 3 صور اصطناعية دون استهلاك الحصة + fallback",
    ...result,
    ok: (!result.canRecord || result.size > 0) && result.fallback === null,
  });
  await fixture.close();
  await page.close();
} catch (e) {
  rows.push({ name: "supplement", ok: false, error: e.message });
} finally {
  await browser.close();
  await writeFile("docs/audits/leap-supplement.json", JSON.stringify({ base, rows }, null, 2));
  console.log(JSON.stringify(rows));
}
if (rows.some((x) => !x.ok)) process.exitCode = 1;
