import { copy, loc, type Lang } from "@/lib/locale";

export type Headline = { title: string; source: string; href: string };

const FALLBACK: Headline[] = [
  {
    title: "البيت — الهجدة حيث تُبنى الأشياء في هدوء الليل",
    source: "الهجدة",
    href: "https://alhajda.com",
  },
  {
    title: "تهجد — مواقيت أم القرى وأذكار ومصحف بلا حساب",
    source: "تهجد",
    href: "https://tahajjud.alhajda.com",
  },
  {
    title: "محسن — أجب بصدق: مدعوم أو جزئي أو لا أعرف",
    source: "محسن",
    href: "https://ai.alhajda.com",
  },
];

type Feed = { source: string; url: string };

const FEEDS: Feed[] = [
  { source: "الجزيرة", url: "https://www.aljazeera.net/xml/rss/all.xml" },
  { source: "BBC عربي", url: "https://feeds.bbci.co.uk/arabic/rss.xml" },
];

function strip(xml: string) {
  return xml.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "").trim();
}

function itemsFromRss(xml: string, source: string, limit: number): Headline[] {
  const blocks = xml.split(/<item[\s>]/i).slice(1, limit + 1);
  return blocks
    .map((block) => {
      const title = strip((block.match(/<title>([\s\S]*?)<\/title>/i) ?? [])[1] ?? "");
      const href = strip((block.match(/<link>([\s\S]*?)<\/link>/i) ?? [])[1] ?? "");
      if (!title) return null;
      return { title, source, href: href || "https://alhajda.com" };
    })
    .filter((x): x is Headline => x != null);
}

export async function fetchHeadlines(): Promise<Headline[]> {
  const out: Headline[] = [];
  await Promise.all(
    FEEDS.map(async (feed) => {
      try {
        const res = await fetch(feed.url, { signal: AbortSignal.timeout(6000) });
        if (!res.ok) return;
        const xml = await res.text();
        out.push(...itemsFromRss(xml, feed.source, 3));
      } catch {
        /* keep fallback */
      }
    }),
  );
  return out.length ? out.slice(0, 6) : FALLBACK;
}

export function headlineTitle(lang: Lang, h: Headline) {
  if (lang === "ar") return h.title;
  return h.title;
}

export function newsEmptyCopy(lang: Lang) {
  return loc(
    lang,
    copy(
      "أبواب البيت إن تأخرت العناوين",
      "House doors if headlines lag",
      "若新闻延迟则显示家园之门",
      "Puertas de la casa si fallan los titulares",
      "Portes de la maison si l’actu tarde",
      "शीर्षक न हों तो घर के द्वार",
    ),
  );
}
