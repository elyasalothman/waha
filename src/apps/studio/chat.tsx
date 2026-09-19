import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { askWaha } from "@/lib/ai";
import {
  isDayQuestion,
  runAskWaha,
  type AskCitation,
  type AskKind,
  type AskTrust,
  type AskWahaResponse,
} from "@/lib/ask-waha";
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

function Refs({
  citations,
  source,
  lang,
  trust,
}: {
  citations?: AskCitation[];
  source?: string;
  lang: "ar" | "en";
  trust: AskTrust;
}) {
  const [open, setOpen] = useState(trust === "مدعوم");
  const items =
    citations && citations.length
      ? citations.slice(0, 4)
      : source && /^https?:\/\//i.test(source)
        ? [{ title: source, url: source }]
        : [];
  if (!items.length && !source) return null;
  const visible = trust === "مدعوم";

  return (
    <div className="mt-2">
      {visible ? (
        <p className="text-[11px] text-muted">{t(lang, "askRefs")}</p>
      ) : (
        <button
          type="button"
          className="text-[11px] text-muted underline-offset-4 hover:text-fg hover:underline"
          onClick={() => setOpen((v) => !v)}
        >
          {t(lang, "askRefs")}
        </button>
      )}
      {visible || open ? (
        <ul className="mt-2 space-y-1 text-[12px] text-muted">
          {source && !/^https?:\/\//i.test(source) && items.length < 3 ? <li>{source}</li> : null}
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

function assistantFromFail(lang: "ar" | "en", text: string): Extract<Msg, { role: "assistant" }> {
  return {
    role: "assistant",
    content: text,
    trust: "لا أعرف",
    kind: "knowledge",
  };
}

export function ChatApp() {
  const lang = useAppStore((s) => s.lang);
  const city = useAppStore((s) => s.city);
  const [mode, setMode] = useState<Mode>("chat");
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const lastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    lastRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [msgs, busy]);

  function pushAssistant(msg: Extract<Msg, { role: "assistant" }>) {
    setMsgs((m) => [...m, msg]);
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const nextUser: Msg[] = [...msgs, { role: "user" as const, content: text }].slice(-12);
    setMsgs(nextUser);
    setInput("");
    setBusy(true);
    try {
      const history = nextUser
        .filter((m): m is { role: "user" | "assistant"; content: string } => Boolean(m.content))
        .map((m) => ({ role: m.role, content: m.content }))
        .slice(-12);
      const cityPayload = {
        id: city.id,
        ar: city.ar,
        en: city.en,
        lat: city.lat,
        lon: city.lon,
        tz: city.tz,
        countryAr: city.countryAr,
        countryEn: city.countryEn,
      };
      const res: AskWahaResponse =
        mode === "chat" && isDayQuestion(text)
          ? await runAskWaha({
              mode: "chat",
              lang,
              messages: history,
              city: cityPayload,
            })
          : await askWaha({
              data: {
                mode,
                lang,
                messages: history,
                city: cityPayload,
              },
            });
      if (!res || typeof res !== "object" || !("ok" in res) || !res.ok) {
        const fail = res && typeof res === "object" && "error" in res ? res.error : "empty";
        pushAssistant(
          assistantFromFail(
            lang,
            fail === "unavailable" ? t(lang, "aiUnavailable") : lang === "ar" ? "لا أعرف، ولن أخمن." : "I don’t know, and I will not guess.",
          ),
        );
      } else {
        pushAssistant({
          role: "assistant",
          content: res.text,
          trust: res.trust,
          source: res.source,
          citations: res.citations,
          kind: res.kind,
        });
      }
    } catch {
      pushAssistant(
        assistantFromFail(
          lang,
          lang === "ar" ? "لا أعرف، ولن أخمن." : "I don’t know, and I will not guess.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-20rem)] min-h-80 max-h-[44rem] flex-col">
      <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-border bg-surface p-0.5">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={cn(
                "h-8 rounded-full px-3.5 text-[13px] transition-colors",
                mode === m.id ? "bg-primary-wash text-primary" : "text-muted hover:text-fg",
              )}
            >
              {lang === "ar" ? m.ar : m.en}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted">{lang === "ar" ? city.ar : city.en}</p>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto rounded-2xl border border-border/80 bg-surface/80 px-4 py-5 sm:px-5">
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
              <div
                key={i}
                ref={i === msgs.length - 1 ? lastRef : undefined}
                className="max-w-[86%] space-y-2"
              >
                {m.kind !== "greeting" ? <TrustBadge trust={m.trust} /> : null}
                <div className="text-[15px] leading-7 text-fg whitespace-pre-wrap">{m.content}</div>
                {m.kind !== "greeting" ? (
                  <Refs citations={m.citations} source={m.source} lang={lang} trust={m.trust} />
                ) : null}
              </div>
            ),
          )
        )}
        {busy ? <p className="text-[13px] text-muted">{t(lang, "thinking")}</p> : null}
      </div>

      <div className="mt-4 flex shrink-0 items-end gap-2">
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
