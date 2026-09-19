import { useState } from "react";
import { toast } from "sonner";
import { browserShareApis, shareOrCopy } from "@/lib/share";
import { t, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import type { Ayah } from "@/lib/daily";

type Slide = {
  id: string;
  kicker: string;
  body: string;
  foot?: string;
  shareText: string;
};

export function DailySlides({
  lang,
  ayah,
  asma,
  proverb,
}: {
  lang: Lang;
  ayah: Ayah;
  asma: { ar: string; meanAr: string; meanEn: string };
  proverb: { ar: string };
}) {
  const [index, setIndex] = useState(0);
  const slides: Slide[] = [
    {
      id: "ayah",
      kicker: t(lang, "ayah"),
      body: ayah.ar,
      foot: lang === "ar" ? ayah.refAr : ayah.refEn,
      shareText: `${ayah.ar}\n${lang === "ar" ? ayah.refAr : ayah.refEn}`,
    },
    {
      id: "asma",
      kicker: t(lang, "nameOfDay"),
      body: asma.ar,
      foot: lang === "ar" ? asma.meanAr : asma.meanEn,
      shareText: `${asma.ar} — ${lang === "ar" ? asma.meanAr : asma.meanEn}`,
    },
    {
      id: "proverb",
      kicker: t(lang, "saying"),
      body: proverb.ar,
      shareText: proverb.ar,
    },
  ];
  const slide = slides[index]!;

  async function onShare() {
    const result = await shareOrCopy(
      { title: t(lang, "daily"), text: slide.shareText },
      browserShareApis(),
    );
    if (result === "copied") toast.success(t(lang, "shareCopied"));
    if (result === "failed") toast.error(t(lang, "shareFailed"));
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted">{t(lang, "daily")}</h2>
        <button
          type="button"
          onClick={() => void onShare()}
          className="text-sm text-primary hover:underline"
        >
          {t(lang, "share")}
        </button>
      </div>
      <div className="rounded-xl border border-border bg-surface p-5 md:p-6">
        <p className="text-xs text-muted">{slide.kicker}</p>
        <p className="mt-3 font-display text-2xl leading-relaxed md:text-3xl">{slide.body}</p>
        {slide.foot ? <p className="mt-3 text-sm text-subtle">{slide.foot}</p> : null}
      </div>
      <div className="mt-3 flex items-center justify-center gap-2" role="tablist" aria-label={t(lang, "daily")}>
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={s.kicker}
            onClick={() => setIndex(i)}
            className={cn(
              "h-2 rounded-full transition-all",
              i === index ? "w-6 bg-primary" : "w-2 bg-border hover:bg-muted",
            )}
          />
        ))}
      </div>
    </section>
  );
}
