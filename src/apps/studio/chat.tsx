import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { askWaha } from "@/lib/ai";
import type { AskCitation, AskKind, AskTrust } from "@/lib/ask-waha";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { useAppStore } from "@/store/app-store";

type Mode = "chat" | "translate" | "write";

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

const MODES: { id: Mode; ar: string; en: string }[] = [
  { id: "chat", ar: "اسأل", en: "Ask" },
  { id: "translate", ar: "ترجمة", en: "Translate" },
  { id: "write", ar: "كتابة", en: "Write" },
];

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
  const [open, setOpen] = useState(false);
  const items =
    citations && citations.length
      ? citations
      : source && /^https?:\/\//i.test(source)
        ? [{ title: source, url: source }]
        : [];
  if (!items.length && !source) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        className="text-[11px] text-muted underline-offset-4 hover:text-fg hover:underline"
        onClick={() => setOpen((v) => !v)}
      >
        {t(lang, "askRefs")}
      </button>
      {open ? (
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
      ) : null}
    </div>
  );
}

export function ChatApp() {
  const lang = useAppStore((s) => s.lang);
  const city = useAppStore((s) => s.city);
  const [mode, setMode] = useState<Mode>("chat");
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
          mode,
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
    <div className="flex min-h-[72vh] flex-col">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-border bg-surface p-0.5">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={cn(
                "h-8 rounded-full px-3.5 text-[13px] transition-colors",
                mode === m.id ? "bg-fg text-bg" : "text-muted hover:text-fg",
              )}
            >
              {lang === "ar" ? m.ar : m.en}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-subtle">{lang === "ar" ? city.ar : city.en}</p>
      </div>

      <div className="flex-1 space-y-4 rounded-2xl border border-border/80 bg-surface/80 px-4 py-5 sm:px-5">
        {msgs.length === 0 ? (
          <div className="flex h-full min-h-48 flex-col justify-end">
            <p className="text-[15px] leading-7 text-muted">
              {lang === "ar"
                ? "اسأل عن صلاتك أو حرارتك أو مسألة تحتاج مصدراً. إن لم نجد دليلاً نقول لا أعرف."
                : "Ask about prayer, temperature, or anything that needs a source. If there is no evidence, we say we don’t know."}
            </p>
          </div>
        ) : (
          msgs.map((m, i) =>
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
          )
        )}
        {busy ? <p className="text-[13px] text-muted">{t(lang, "thinking")}</p> : null}
        {err ? <p className="text-[13px] text-danger">{err}</p> : null}
      </div>

      <div className="mt-4 flex items-end gap-2">
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
        <Button className="h-11 rounded-2xl px-5 self-end" disabled={busy || !input.trim()} onClick={() => void send()}>
          {t(lang, "send")}
        </Button>
      </div>
    </div>
  );
}
