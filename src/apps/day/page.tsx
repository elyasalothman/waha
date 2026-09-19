import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { DayMark } from "@/components/brand";
import { ShadowDay } from "@/components/shadow-day";
import { HouseBadge, SampleStamp } from "@/components/square/house-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { askWaha } from "@/lib/ai";
import { formatTodayVerse, type AskCitation, type AskKind, type AskTrust } from "@/lib/ask-waha";
import { todayMaydanAuthor, todayMaydanCard } from "@/lib/day";
import { useNow } from "@/hooks/use-now";
import { shadowDayNow } from "@/lib/shadow-day";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { useAppStore } from "@/store/app-store";

type Msg =
  | { role: "user"; content: string }
  | {
      role: "assistant";
      content: string;
      trust: AskTrust;
      source?: string;
      citations?: AskCitation[];
      kind: AskKind;
    };

const TRUST_TONE: Record<AskTrust, string> = {
  مدعوم: "border-success/35 bg-success/10 text-success",
  جزئي: "border-warn/40 bg-warn/10 text-warn",
  "لا أعرف": "border-border bg-surface-2 text-muted",
};

function TrustBadge({ trust }: { trust: AskTrust }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide",
        TRUST_TONE[trust],
      )}
    >
      {trust}
    </span>
  );
}

function Refs({ citations, source, lang }: { citations?: AskCitation[]; source?: string; lang: "ar" | "en" }) {
  const items =
    citations && citations.length
      ? citations
      : source && /^https?:\/\//i.test(source)
        ? [{ title: source, url: source }]
        : [];
  if (!items.length && !source) return null;

  return (
    <ul className="mt-2 space-y-1 text-[12px] text-muted">
      {source && !/^https?:\/\//i.test(source) ? <li>{source}</li> : null}
      {items.map((c) => (
        <li key={c.url}>
          <a href={c.url} target="_blank" rel="noreferrer" className="text-fg/80 hover:underline">
            {c.title}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function DayPage() {
  const lang = useAppStore((s) => s.lang);
  const city = useAppStore((s) => s.city);
  const now = useNow(60_000);
  const card = useMemo(() => todayMaydanCard(now), [now]);
  const author = todayMaydanAuthor(card);
  const verse = formatTodayVerse(shadowDayNow(now, city), lang);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  return (
    <div
      className="mx-auto max-w-xl"
      data-day-peg="yawmak-v1"
      data-day-sections="shadow card ask"
      data-on-maydan="false"
      data-guest-read="open"
    >
      <header className="mb-8">
        <p className="flex items-center gap-2 text-sm text-primary">
          <DayMark className="size-5" />
          {t(lang, "day")}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">{t(lang, "dayTitle")}</h1>
        <p className="mt-2 max-w-xl text-muted">{t(lang, "dayBlurb")}</p>
      </header>

      <section data-day-section="shadow" className="pb-8">
        <ShadowDay />
      </section>

      <section data-day-section="card" className="border-t border-border py-8">
        <p className="text-sm font-medium text-muted">{t(lang, "dayCard")}</p>
        <article
          className="mt-3 rounded-xl border border-border bg-surface p-4 shadow-(--shadow-soft)"
          data-day-card={card.id}
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium text-fg">{author.nameAr}</span>
            {card.badge === "بيت" ? <HouseBadge lang={lang} /> : <SampleStamp lang={lang} />}
            <span className="text-xs text-subtle">{author.handle}</span>
          </div>
          <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-fg/95">{card.text}</p>
          <Link to="/" className="mt-4 inline-flex min-h-11 items-center text-sm text-primary hover:underline">
            {t(lang, "dayToSquare")}
          </Link>
        </article>
      </section>

      <section data-day-section="ask" className="border-t border-border pt-8">
        <p className="text-sm font-medium text-muted">{t(lang, "dayAsk")}</p>
        <div className="mt-3 rounded-xl border border-border bg-surface/80 p-4">
          <TrustBadge trust="مدعوم" />
          <p className="mt-2 text-[15px] leading-7 text-fg" data-day-verse>
            {verse}
          </p>
        </div>
        <DayAsk lang={lang} />
      </section>

      <p className="py-8 text-center text-sm text-subtle">
        {L("الخط الكامل يبقى في الميدان.", "The full line stays on the Square.")}{" "}
        <Link to="/" className="text-primary hover:underline">
          {t(lang, "home")}
        </Link>
      </p>
    </div>
  );
}

function DayAsk({ lang }: { lang: "ar" | "en" }) {
  const city = useAppStore((s) => s.city);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const nextUser: Msg[] = [...msgs, { role: "user" as const, content: text }].slice(-12);
    setMsgs(nextUser);
    setInput("");
    setBusy(true);
    setErr(null);
    try {
      const history = nextUser.map((m) => ({ role: m.role, content: m.content })).slice(-12);
      const res = await askWaha({
        data: {
          mode: "chat",
          lang,
          messages: history,
          city: {
            id: city.id,
            ar: city.ar,
            en: city.en,
            lat: city.lat,
            lon: city.lon,
            tz: city.tz,
            countryAr: city.countryAr,
            countryEn: city.countryEn,
          },
        },
      });
      if (!res.ok) {
        setErr(res.error === "unavailable" ? t(lang, "aiUnavailable") : t(lang, "error"));
      } else {
        setMsgs((m) => [
          ...m,
          {
            role: "assistant",
            content: res.text,
            trust: res.trust,
            source: res.source,
            citations: res.citations,
            kind: res.kind,
          },
        ]);
      }
    } catch {
      setErr(t(lang, "error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4" data-day-ask="quiet">
      {msgs.length ? (
        <div className="mb-4 space-y-4">
          {msgs.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[78%] rounded-2xl bg-surface-2 px-4 py-2.5 text-[15px] leading-7 text-fg">
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={i} className="max-w-[86%] space-y-2">
                {m.kind !== "greeting" ? <TrustBadge trust={m.trust} /> : null}
                <div className="text-[15px] leading-7 text-fg whitespace-pre-wrap">{m.content}</div>
                {m.kind !== "greeting" ? <Refs citations={m.citations} source={m.source} lang={lang} /> : null}
              </div>
            ),
          )}
        </div>
      ) : null}
      {busy ? <p className="mb-3 text-[13px] text-muted">{t(lang, "thinking")}</p> : null}
      {err ? <p className="mb-3 text-[13px] text-danger">{err}</p> : null}
      <div className="flex items-end gap-2">
        <Textarea
          className="min-h-14 flex-1 resize-none rounded-2xl border-border/80 bg-surface px-4 py-3 text-[15px]"
          value={input}
          placeholder={t(lang, "placeholderChat")}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <Button className="h-11 self-end rounded-2xl px-5" disabled={busy || !input.trim()} onClick={() => void send()}>
          {t(lang, "send")}
        </Button>
      </div>
    </div>
  );
}
