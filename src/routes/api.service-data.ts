import { createFileRoute } from "@tanstack/react-router";
const SOURCES: Record<string, string> = {
  phones: "https://phones.alhajda.com/api/phones",
  bench: "https://bench.alhajda.com/data/results.json",
  wiki: "https://wiki.alhajda.com/api/search",
};
export const Route = createFileRoute("/api/service-data")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const id = url.searchParams.get("id") || "";
        const source = SOURCES[id];
        if (!source) return Response.json({ error: "خدمة غير معروفة" }, { status: 400 });
        try {
          const target = new URL(source);
          if (id === "wiki")
            target.searchParams.set("q", (url.searchParams.get("q") || "السعودية").slice(0, 120));
          const response = await fetch(target, { signal: AbortSignal.timeout(10000) });
          if (!response.ok) throw new Error();
          const data = await response.json();
          const items =
            id === "wiki"
              ? (data.results || [])
                  .slice(0, 8)
                  .map((r: { title: string; slug: string; snippet: string }) => ({
                    id: r.slug,
                    title: r.title,
                    detail: r.snippet,
                    href: `https://wiki.alhajda.com/a/${encodeURIComponent(r.slug)}`,
                  }))
              : id === "bench"
                ? (data.models || [])
                    .slice(0, 20)
                    .map((m: { id: string; name: string; overall: number; date: string }) => ({
                      id: m.id,
                      title: m.name,
                      detail: `نتيجة ${m.overall}% على مجموعة المقياس · ${m.date}`,
                      href: "https://bench.alhajda.com/method",
                    }))
                : Array.isArray(data)
                  ? data
                      .slice(0, 40)
                      .map(
                        (p: {
                          id: string;
                          name: string;
                          brandAr: string;
                          chip: string;
                          mah: number;
                          weight: number;
                          gb6: number;
                          dxo: number | null;
                          src?: { gsm?: string };
                        }) => ({
                          id: p.id,
                          title: `${p.brandAr} · ${p.name}`,
                          detail: p.chip,
                          href: `https://phones.alhajda.com/p/${encodeURIComponent(p.id)}`,
                          fields: {
                            "البطارية (mAh)": p.mah,
                            "الوزن (g)": p.weight,
                            "Geekbench 6": p.gb6,
                            DXOMARK: p.dxo,
                          },
                          source: p.src?.gsm,
                        }),
                      )
                  : [];
          return Response.json(
            { status: "live", source, items },
            { headers: { "Cache-Control": "public, max-age=300" } },
          );
        } catch {
          return Response.json(
            { status: "unavailable", source, items: [] },
            { headers: { "Cache-Control": "public, max-age=30" } },
          );
        }
      },
    },
  },
});
