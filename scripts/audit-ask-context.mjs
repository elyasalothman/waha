import { chromium, webkit } from "playwright";
import fs from "node:fs";
const u = new URL(process.env.HTTPS_PROXY),
  results = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const b = await type.launch({
    proxy: {
      server: u.origin,
      username: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
    },
  });
  const p = await b.newPage({
    ignoreHTTPSErrors: true,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  p.setDefaultTimeout(18000);
  try {
    for (const [path, label] of [
      ["/quran", "اسأل محسن عن التفسير"],
      ["/news", "اسأل محسن عن هذا الخبر"],
    ]) {
      await p.goto((process.argv[2] || "https://waha.hajdah.com") + path, {
        waitUntil: "domcontentloaded",
      });
      await p.getByRole("link", { name: label, exact: true }).first().click();
      await p.locator("textarea:not(:disabled)").waitFor();
      const q = await p.locator("textarea").inputValue();
      if (q.length < 10) throw new Error("Missing context");
      results.push({ engine, path, question: q });
      console.log("PASS", engine, path);
    }
  } finally {
    await b.close();
    fs.writeFileSync(
      process.argv[3] || "/tmp/context-links.json",
      JSON.stringify(results, null, 2),
    );
  }
}
