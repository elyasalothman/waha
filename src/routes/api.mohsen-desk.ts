import { createFileRoute } from "@tanstack/react-router";
import {
  DESK_DAILY_CAP,
  excerpt,
  htmlToText,
  printedPrices,
  publicPageUrl,
} from "@/lib/mohsen-desk";

const counts = new Map<string, { day: string; count: number }>();

async function readPage(url: URL) {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(8000),
    headers: { Accept: "text/html, text/plain" },
  });
  const finalUrl = publicPageUrl(response.url);
  if (!response.ok || !finalUrl) throw new Error("unavailable");
  const html = (await response.text()).slice(0, 500_000);
  const page = htmlToText(html);
  return { url: finalUrl.toString(), title: page.title, text: page.text, prices: printedPrices(page.text) };
}

export const Route = createFileRoute("/api/mohsen-desk")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as { urls?: unknown; device?: unknown; count?: unknown } | null;
        const device = typeof body?.device === "string" ? body.device.slice(0, 80) : "";
        const count = Number(body?.count);
        const day = new Date().toISOString().slice(0, 10);
        const prior = counts.get(device);
        const used = prior?.day === day ? prior.count : 0;
        if (!device || !Number.isInteger(count) || count < 0 || count >= DESK_DAILY_CAP || used >= DESK_DAILY_CAP) {
          return Response.json(
            { error: "وصلت حد اليوم. حاول غدًا.", cap: DESK_DAILY_CAP },
            { status: 429, headers: { "Cache-Control": "no-store" } },
          );
        }
        const urls = Array.isArray(body?.urls) ? body.urls.slice(0, 2) : [];
        const pages = [];
        for (const item of urls) {
          const url = typeof item === "string" ? publicPageUrl(item) : null;
          if (!url) {
            return Response.json(
              { error: "الرابط لازم يكون صفحة https عامة، بلا دخول ولا دفع." },
              { status: 400, headers: { "Cache-Control": "no-store" } },
            );
          }
          try {
            pages.push(await readPage(url));
          } catch {
            return Response.json(
              { error: "تعذّر فتح الصفحة العامة. ما فيه نتيجة بديلة." },
              { status: 502, headers: { "Cache-Control": "no-store" } },
            );
          }
        }
        if (!pages.length) {
          return Response.json({ error: "أرسل رابطًا عامًا واحدًا أو اثنين." }, { status: 400 });
        }
        counts.set(device, { day, count: used + 1 });
        return Response.json(
          {
            pages: pages.map((page) => ({
              url: page.url,
              title: page.title,
              excerpt: excerpt(page.text),
              prices: page.prices,
            })),
            note: "مقتطف من الصفحة كما نُشر. لا دخول لحساب، ولا دفع، ولا سعر غير مطبوع.",
          },
          { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } },
        );
      },
    },
  },
});
