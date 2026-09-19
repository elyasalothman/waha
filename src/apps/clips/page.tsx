import { ClipsMark } from "@/components/brand";
import { useClips, type ClipCard } from "@/lib/clips";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

const TOPIC_EN: Record<ClipCard["topic"], string> = {
  علم: "Science",
  تعليم: "Learning",
  عادة: "Habit",
};

export function ClipsPage() {
  const lang = useAppStore((s) => s.lang);
  const { clips, local, markSeen } = useClips();
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  return (
    <div className="mx-auto max-w-2xl" data-clips-lane="mufida-v1">
      <header className="mb-8">
        <p className="flex items-center gap-2 text-sm text-primary">
          <ClipsMark className="size-5" />
          {t(lang, "clips")}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">{t(lang, "clipsTitle")}</h1>
        <p className="mt-2 max-w-xl text-muted">{t(lang, "clipsBlurb")}</p>
      </header>

      <ol className="grid gap-6">
        {clips.map((clip) => (
          <li key={clip.id}>
            <ClipCardView
              clip={clip}
              lang={lang}
              seen={local.seen.includes(clip.id)}
              topicLabel={L(clip.topic, TOPIC_EN[clip.topic])}
              originalLabel={t(lang, "clipsOriginal")}
              onPlay={() => markSeen(clip.id)}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

function ClipCardView({
  clip,
  lang,
  seen,
  topicLabel,
  originalLabel,
  onPlay,
}: {
  clip: ClipCard;
  lang: "ar" | "en";
  seen: boolean;
  topicLabel: string;
  originalLabel: string;
  onPlay: () => void;
}) {
  return (
    <article
      className="overflow-hidden rounded-xl border border-border bg-surface shadow-(--shadow-soft)"
      data-clip-id={clip.id}
      data-on-maydan="false"
    >
      <div className="relative aspect-video bg-surface-2">
        <iframe
          src={clip.embedUrl}
          title={clip.titleAr}
          className="absolute inset-0 size-full border-0"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
          allowFullScreen
          data-embed="youtube-nocookie"
          onLoad={onPlay}
        />
      </div>

      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="rounded-md border border-border bg-surface-2 px-2 py-0.5 text-muted">{topicLabel}</span>
          <span>{clip.stamp}</span>
          {seen ? <span className="text-primary">{lang === "ar" ? "شُوهد" : "Seen"}</span> : null}
        </div>
        <h2 className="mt-2 font-display text-2xl tracking-tight">{clip.titleAr}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">{clip.benefitAr}</p>
        <p className="mt-2 text-xs text-subtle">{clip.channel}</p>
        <a
          href={clip.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-11 items-center text-sm text-primary hover:underline"
          data-original-link="youtube-watch"
        >
          <span>{originalLabel}</span>
          <span className="ms-2 font-mono text-xs text-subtle" dir="ltr">
            {clip.youtubeUrl}
          </span>
        </a>
      </div>
    </article>
  );
}
