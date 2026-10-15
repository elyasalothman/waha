import { createFileRoute } from "@tanstack/react-router";
import { NewsLive } from "@/components/news-live";
export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "أخبار وبث واحة المباشر · واحة" },
      {
        name: "description",
        content: "عناوين عربية من BBC والجزيرة والشرق، وموجز ساعي مسموع مع روابط المصادر.",
      },
    ],
    links: [{ rel: "canonical", href: "https://waha.hajdah.com/news" }],
  }),
  component: () => (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-5 font-display text-3xl">أخبار واحة</h1>
      <NewsLive />
    </div>
  ),
});
