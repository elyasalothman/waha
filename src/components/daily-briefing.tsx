import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { Lang } from "@/lib/i18n";
import { selectHomeHeadline, type BriefingResponse } from "@/lib/news-feed";

const OFFICIAL_NEWS_URL = "https://cma.gov.sa/MediaCenter/NEWS/Pages/default.aspx";

export function DailyBriefing({ lang }: { lang: Lang }) {
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const [feed, setFeed] = useState<BriefingResponse | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    setLoading(true);
    fetch("/api/news", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("News unavailable");
        const data = (await response.json()) as BriefingResponse;
        if (
          !Array.isArray(data.items) ||
          !["live", "cached", "unavailable", "disabled"].includes(data.status)
        )
          throw new Error("Invalid news response");
        if (active) setFeed(data);
      })
      .catch(() => {
        if (active) setFeed({ items: [], fetchedAt: null, status: "unavailable" });
      })
      .finally(() => {
        clearTimeout(timer);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [attempt]);
  const item = selectHomeHeadline(feed);
  const formatTime = (date: string) =>
    new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Riyadh",
      calendar: "gregory",
    }).format(new Date(date));

  return (
    <section
      className="rounded-2xl border border-border bg-surface p-4 sm:p-5"
      aria-labelledby="home-news-title"
      data-home-section="news"
    >
      <h2 id="home-news-title" className="text-base font-semibold">
        {L("الأخبار", "News")}
      </h2>
      {loading ? (
        <p className="mt-2 text-sm text-muted" role="status">
          {L("نتحقق من الأخبار المتاحة…", "Checking available news…")}
        </p>
      ) : item ? (
        <article className="mt-3">
          <a
            href={item.href}
            target="_blank"
            rel="noreferrer"
            dir="ltr"
            className="block text-lg font-medium leading-relaxed hover:text-primary hover:underline"
          >
            {item.title}
          </a>
          <p className="mt-2 text-xs text-muted">
            {item.source} · {L("نُشر", "Published")}{" "}
            <time dateTime={item.publishedAt}>{formatTime(item.publishedAt)}</time>
          </p>
          <p className="mt-1 text-xs text-muted">
            {feed?.status === "cached"
              ? L("نسخة محفوظة · جُلبت", "Cached copy · Fetched")
              : L("جُلب من المصدر", "Fetched from publisher")}{" "}
            {formatTime(feed!.fetchedAt!)} · {L("توقيت الرياض", "Riyadh time")}
          </p>
        </article>
      ) : (
        <div className="mt-2">
          <p className="text-sm text-muted" role="status">
            {feed?.status === "disabled"
              ? L("الأخبار المباشرة غير مفعّلة حالياً.", "Live news is not enabled at present.")
              : L(
                  "لا يوجد خبر حديث موثوق متاح حالياً.",
                  "No verified recent headline is available right now.",
                )}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-5">
            <a
              href={OFFICIAL_NEWS_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              {L("أخبار هيئة السوق المالية", "Capital Market Authority news")}
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
            {feed?.status !== "disabled" ? (
              <button
                type="button"
                className="min-h-11 text-sm text-muted hover:text-fg"
                onClick={() => setAttempt((value) => value + 1)}
              >
                {L("إعادة المحاولة", "Retry")}
              </button>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
