import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { askWaha, generateAskMedia } from "@/lib/ai";
import { ASK_MEDIA_BADGE, type AskMediaKind, type AskMediaResponse } from "@/lib/ask-media";
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
import { usePersistent } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";

type Mode = "chat" | "translate" | "write";

type ChatMsg =
  | { role: "user"; content: string }
  | {
      role: "assistant";
      content: string;
      trust: AskTrust;
      source?: string;
      citations?: AskCitation[];
      kind: AskKind;
    };

type MediaOk = {
  role: "look";
  prompt: string;
  src: string;
  mime: string;
};

type MediaFail = {
  role: "look-fail";
  prompt: string;
  error: string;
};

type Msg = ChatMsg | MediaOk | MediaFail;

type SavedLook = {
  prompt: string;
  src: string;
  mime: string;
  at: number;
};

const LOOK_KEY = "waha:ask-look";

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

function GeneratedBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[11px] font-medium tracking-wide text-muted">
      {ASK_MEDIA_BADGE}
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

function assistantFromFail(lang: "ar" | "en", text: string): Extract<ChatMsg, { role: "assistant" }> {
  return {
    role: "assistant",
    content: text,
    trust: "لا أعرف",
    kind: "knowledge",
  };
}

function mediaSrc(res: Extract<AskMediaResponse, { ok: true }>): string | null {
  if (res.url) return res.url;
  if (res.dataUrl) return res.dataUrl;
  return null;
}

function persistableSrc(src: string): string | null {
  if (src.startsWith("https://") || src.startsWith("http://")) return src;
  if (src.startsWith("data:") && src.length < 350_000) return src;
  return null;
}

function LookCard({
  src,
  mime,
  lang,
  onSave,
  saved,
}: {
  src: string;
  mime: string;
  lang: "ar" | "en";
  onSave: () => void;
  saved: boolean;
}) {
  return (
    <div className="max-w-[86%] space-y-2">
      <GeneratedBadge />
      {mime.startsWith("image/") ? (
        <img src={src} alt="" className="max-h-80 w-full rounded-xl border border-border/70 object-contain" />
      ) : (
        <video src={src} controls className="max-h-80 w-full rounded-xl border border-border/70" />
      )}
      <p className="text-[11px] text-muted">{t(lang, "askMediaSource")}</p>
      <div className="flex flex-wrap gap-2">
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="text-[12px] text-fg/80 underline-offset-4 hover:underline"
        >
          {t(lang, "askOpen")}
        </a>
        <button type="button" onClick={onSave} className="text-[12px] text-fg/80 underline-offset-4 hover:underline">
          {t(lang, "save")}
        </button>
      </div>
      {saved ? <p className="text-[11px] text-muted">{t(lang, "askSavedLocal")}</p> : null}
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
  const [lookBusy, setLookBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [gallery, setGallery] = usePersistent<SavedLook[]>(LOOK_KEY, []);
  const lastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    lastRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [msgs, busy, lookBusy]);

  function push(msg: Msg) {
    setMsgs((m) => [...m, msg]);
  }

  function pushAssistant(msg: Extract<ChatMsg, { role: "assistant" }>) {
    push(msg);
  }

  function saveLook(item: MediaOk) {
    const src = persistableSrc(item.src);
    if (src) {
      setGallery((prev) => [{ prompt: item.prompt, src, mime: item.mime, at: Date.now() }, ...prev].slice(0, 8));
    }
    const a = document.createElement("a");
    a.href = item.src;
    a.download = item.mime.includes("webp") ? "waha-look.webp" : "waha-look.png";
    a.rel = "noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setSavedAt(msgs.length);
  }

  async function send() {
    const text = input.trim();
    if (!text || busy || lookBusy) return;
    const nextUser: Msg[] = [...msgs, { role: "user" as const, content: text }].slice(-12);
    setMsgs(nextUser);
    setInput("");
    setBusy(true);
    try {
      const history = nextUser
        .filter((m): m is { role: "user" | "assistant"; content: string } => m.role === "user" || m.role === "assistant")
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

  async function look(kind: AskMediaKind) {
    const prompt = input.trim();
    if (busy || lookBusy) return;
    if (!prompt) {
      push({ role: "look-fail", prompt: "", error: lang === "ar" ? "اكتب وصفاً أولاً." : "Write a description first." });
      return;
    }
    push({ role: "user", content: prompt });
    setInput("");
    setLookBusy(true);
    try {
      const res = await generateAskMedia({ data: { kind, prompt, lang } });
      if (res.ok) {
        const src = mediaSrc(res);
        if (!src) {
          push({ role: "look-fail", prompt, error: lang === "ar" ? "تعذّر التوليد الآن." : "Generation failed just now." });
          return;
        }
        const item: MediaOk = { role: "look", prompt, src, mime: res.mime };
        push(item);
        const keep = persistableSrc(src);
        if (keep) {
          setGallery((prev) => [{ prompt, src: keep, mime: res.mime, at: Date.now() }, ...prev].slice(0, 8));
        }
      } else {
        push({ role: "look-fail", prompt, error: res.error });
      }
    } catch {
      push({
        role: "look-fail",
        prompt,
        error: lang === "ar" ? "التوليد غير متاح الآن." : "Generation is unavailable right now.",
      });
    } finally {
      setLookBusy(false);
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
                mode === m.id ? "bg-fg text-bg" : "text-muted hover:text-fg",
              )}
            >
              {lang === "ar" ? m.ar : m.en}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-subtle">{lang === "ar" ? city.ar : city.en}</p>
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
            ) : m.role === "look" ? (
              <div key={i} ref={i === msgs.length - 1 ? lastRef : undefined}>
                <LookCard
                  src={m.src}
                  mime={m.mime}
                  lang={lang}
                  saved={savedAt === i}
                  onSave={() => saveLook(m)}
                />
              </div>
            ) : m.role === "look-fail" ? (
              <div key={i} ref={i === msgs.length - 1 ? lastRef : undefined} className="max-w-[86%]">
                <p className="text-[15px] leading-7 text-fg">{m.error}</p>
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
        {lookBusy ? <p className="text-[13px] text-muted">{t(lang, "askGenerating")}</p> : null}
      </div>

      <div className="mt-3 shrink-0 rounded-2xl border border-border/70 bg-surface/70 px-3 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[13px] text-fg">{t(lang, "askLook")}</p>
            <p className="text-[11px] text-muted">{t(lang, "askLookHint")}</p>
          </div>
          <div className="flex gap-1.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-full"
              disabled={busy || lookBusy}
              onClick={() => void look("image")}
            >
              {t(lang, "askImage")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-full opacity-55"
              disabled={busy || lookBusy}
              onClick={() => void look("video")}
            >
              {t(lang, "askVideo")}
            </Button>
          </div>
        </div>
        {gallery.length ? (
          <p className="mt-1.5 text-[11px] text-subtle">
            {lang === "ar" ? `${gallery.length} محفوظة على هذا الجهاز` : `${gallery.length} saved on this device`}
          </p>
        ) : null}
      </div>

      <div className="mt-3 flex shrink-0 items-end gap-2">
        <Textarea
          className="min-h-14 flex-1 resize-none rounded-2xl border-border/80 bg-surface px-4 py-3 text-[15px]"
          value={input}
          placeholder={lookBusy ? t(lang, "placeholderLook") : t(lang, "placeholderChat")}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <Button className="h-11 rounded-2xl px-5 self-end" disabled={busy || lookBusy || !input.trim()} onClick={() => void send()}>
          {t(lang, "send")}
        </Button>
      </div>
    </div>
  );
}
