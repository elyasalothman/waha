import { useSettings } from "@/store/settings-store";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ExternalLink } from "@/components/external-link";
import { NEWS_TOPICS, type ArabicNews } from "@/lib/arabic-news";
import { featureButton, shareCard } from "@/lib/share-card";
export function NewsLive({ compact = false }: { compact?: boolean }) {
  const settings = useSettings((s) => s.settings);
  const [data, setData] = useState<ArabicNews | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [topic, setTopic] = useState("الكل");
  const [speaking, setSpeaking] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const load = () =>
      fetch("/api/news", { signal: controller.signal })
        .then(async (r) => {
          if (!r.ok) throw new Error();
          const next = await r.json();
          if (!Array.isArray(next.items)) throw new Error();
          setData(next);
          setFailed(next.status === "unavailable");
        })
        .catch(() => {
          if (!controller.signal.aborted) setFailed(true);
        });
    void load();
    const timer = setInterval(() => void load(), 600000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [attempt]);
  useEffect(
    () => () => {
      window.speechSynthesis?.cancel();
    },
    [],
  );
  function speak() {
    if (!("speechSynthesis" in window)) {
      setNotice("القراءة الصوتية غير متاحة في هذا المتصفح. يمكنك قراءة الموجز أدناه.");
      return;
    }
    window.speechSynthesis.cancel();
    if (speaking) {
      setSpeaking(false);
      return;
    }
    if (!data?.bulletin) return;
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith("ar"));
    if (!voice) {
      setNotice(
        "لا يوجد صوت عربي مثبت على الجهاز. أضف صوتًا عربيًا من إعدادات النظام ثم أعد المحاولة.",
      );
      return;
    }
    const lines = data.bulletin.text.match(/[^.]+[.]?/g) ?? [data.bulletin.text];
    const play = (index: number) => {
      if (index >= lines.length) {
        setSpeaking(false);
        return;
      }
      const u = new SpeechSynthesisUtterance(lines[index]);
      u.lang = "ar-SA";
      u.voice = voice;
      u.onend = () => play(index + 1);
      u.onerror = () => {
        setSpeaking(false);
        setNotice("توقفت القراءة الصوتية. أعد المحاولة.");
      };
      window.speechSynthesis.speak(u);
    };
    setNotice("");
    setSpeaking(true);
    play(0);
  }
  const items =
    data?.items.filter(
      (i) =>
        (topic === "الكل" || i.topic === topic) &&
        (!settings.newsTopics.length || settings.newsTopics.some((topic) => topic === i.topic)) &&
        (!settings.newsSources.length || settings.newsSources.includes(i.source as never)),
    ) ?? [];
  return (
    <section
      id="live-bulletin"
      className="rounded-2xl border border-border bg-surface p-4 sm:p-6"
      dir="rtl"
      aria-label="أخبار وبث واحة"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl">بث واحة المباشر</h2>
        <span className="rounded-full bg-primary/10 px-3 py-2 text-sm text-primary">
          ● {data?.bulletin ? "مباشر · موجز ساعي" : "موجز العناوين"}
        </span>
      </div>
      <p className="mt-2 text-sm leading-7 text-muted">
        ملخص آلي، راجع المصدر · موجز استخراجي من العناوين، دون نموذج ذكاء اصطناعي. يتجدد كل ساعة عند
        زيارة الصفحة؛ ليس قناة فيديو أو بثًا لحظيًا.
      </p>
      {data?.bulletin && (
        <>
          <p className="mt-2 text-xs text-muted">
            آخر تحديث للموجز:{" "}
            <time dateTime={data.bulletin.updatedAt}>
              {new Date(data.bulletin.updatedAt).toLocaleString("ar-SA", {
                timeZone: "Asia/Riyadh",
                calendar: "gregory",
              })}
            </time>
            {data.status === "cached" ? " · نسخة محفوظة" : ""}
          </p>
          <div
            className="news-ticker mt-4 overflow-hidden rounded-xl bg-primary/10 p-3"
            aria-label="شريط أبرز العناوين"
          >
            <div className="news-ticker-track">
              {data.bulletin.items.map((i) => (
                <span className="mx-6 inline-block" key={i.id}>
                  {i.source}: {i.title}
                </span>
              ))}
            </div>
          </div>
          <p className="my-4 leading-8">
            {compact
              ? data.bulletin.items
                  .slice(0, 2)
                  .map((i) => `من ${i.source}: ${i.title}`)
                  .join(" · ")
              : data.bulletin.text}
          </p>
          <div className="flex flex-wrap gap-2">
            <button className={featureButton} onClick={speak} aria-pressed={speaking}>
              {speaking ? "إيقاف القراءة" : "استمع للموجز"}
            </button>
            <button
              className={featureButton}
              onClick={() => {
                void shareCard("موجز واحة", data.bulletin!.text, `${location.origin}/news`)
                  .then(() => setNotice("تمت المشاركة أو نسخ البطاقة."))
                  .catch(() => setNotice("لم تتم المشاركة."));
              }}
            >
              مشاركة بطاقة الموجز
            </button>
            {compact && (
              <Link to="/news" className={featureButton}>
                كل الأخبار
              </Link>
            )}
          </div>
        </>
      )}
      {!data && !failed && (
        <p className="py-6" role="status">
          جارٍ جلب العناوين من مصادرها…
        </p>
      )}
      {failed && (
        <div className="py-4" role="status">
          <p>تعذّر تحديث الأخبار. لا توجد عناوين جديدة مؤكدة الآن.</p>
          <button
            className={featureButton}
            onClick={() => {
              setFailed(false);
              setAttempt((a) => a + 1);
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      )}
      <p role="status" className="mt-3 text-sm text-muted">
        {notice}
      </p>
      {compact && data && (
        <ol className="mt-4 divide-y divide-border" aria-label="أهم ثلاثة عناوين">
          {data.items.slice(0, 3).map((item) => (
            <li key={item.id} className="py-3">
              <ExternalLink
                href={item.href}
                className="inline-flex min-h-11 items-center leading-7"
              >
                {item.title}
              </ExternalLink>
              <p className="text-xs text-muted">{item.source}</p>
            </li>
          ))}
        </ol>
      )}
      {!compact && (
        <>
          <div className="my-5 flex flex-wrap gap-2" aria-label="تصنيف الأخبار">
            {NEWS_TOPICS.map((t) => (
              <button
                key={t}
                className={featureButton}
                aria-pressed={topic === t}
                onClick={() => setTopic(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted">
            التصنيف آلي من العنوان وقد يخطئ.{" "}
            {data?.sources.map((s) => `${s.name}: ${s.ok ? "متصل" : "متعذّر"}`).join(" · ")}
          </p>
          <div className="divide-y divide-border">
            {items.map((i) => (
              <article key={i.id} className="py-5">
                <p className="text-xs text-muted">
                  {i.source} · {i.topic} ·{" "}
                  <time dateTime={i.publishedAt}>
                    {new Date(i.publishedAt).toLocaleString("ar-SA", {
                      timeZone: "Asia/Riyadh",
                      calendar: "gregory",
                    })}
                  </time>
                </p>
                <h3 className="my-2 text-lg leading-8">
                  <ExternalLink
                    href={i.href}
                    className="inline-flex min-h-11 items-center text-fg underline-offset-4 hover:underline"
                  >
                    {i.title}
                  </ExternalLink>
                </h3>
                <div className="flex flex-wrap gap-2">
                  <ExternalLink href={i.href} className={featureButton}>
                    اقرأ الأصل ↗
                  </ExternalLink>
                  <Link
                    to="/ask"
                    search={{
                      q: `اشرح هذا الخبر مع التمييز بين الحقائق والتحليل، وراجع المصدر: ${i.title} ${i.href}`,
                    }}
                    className={featureButton}
                  >
                    اسأل محسن عن هذا الخبر
                  </Link>
                </div>
              </article>
            ))}
          </div>
          {data && !items.length && !failed && (
            <p className="py-6">لا توجد أخبار حديثة في هذا التصنيف.</p>
          )}
        </>
      )}
    </section>
  );
}
