import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { askWaha } from "@/lib/ai";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { useAppStore } from "@/store/app-store";

type Mode = "chat" | "translate" | "write";
type Msg = { role: "user" | "assistant"; content: string };

const MODES: { id: Mode; ar: string; en: string }[] = [
  { id: "chat", ar: "محادثة", en: "Chat" },
  { id: "translate", ar: "ترجمة", en: "Translate" },
  { id: "write", ar: "كتابة", en: "Write" },
];

export function ChatApp() {
  const lang = useAppStore((s) => s.lang);
  const [mode, setMode] = useState<Mode>("chat");
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...msgs, { role: "user" as const, content: text }].slice(-12);
    setMsgs(next);
    setInput("");
    setBusy(true);
    setErr(null);
    try {
      const res = await askWaha({ data: { mode, lang, messages: next } });
      if (!res.ok) {
        setErr(res.error === "unavailable" ? t(lang, "aiUnavailable") : t(lang, "error"));
      } else {
        setMsgs((m) => [...m, { role: "assistant", content: res.text }]);
      }
    } catch {
      setErr(t(lang, "error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col">
      <div className="mb-4 flex flex-wrap gap-2">
        {MODES.map((m) => (
          <Button key={m.id} type="button" size="sm" variant={mode === m.id ? "default" : "secondary"} onClick={() => setMode(m.id)}>
            {lang === "ar" ? m.ar : m.en}
          </Button>
        ))}
      </div>
      <div className="flex-1 space-y-3 rounded-xl border border-border bg-surface p-4">
        {msgs.length === 0 ? (
          <p className="text-sm text-muted">
            {lang === "ar"
              ? "اسأل عن صلاة أو زكاة أو صياغة رسالة أو ترجمة فقرة."
              : "Ask about prayer or zakat, draft a note, or translate a paragraph."}
          </p>
        ) : (
          msgs.map((m, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed",
                m.role === "user" ? "ms-auto bg-surface-2 text-fg" : "bg-bg text-fg",
              )}
            >
              {m.content}
            </div>
          ))
        )}
        {busy ? <p className="text-sm text-muted">{t(lang, "thinking")}</p> : null}
        {err ? <p className="text-sm text-danger">{err}</p> : null}
      </div>
      <div className="mt-3 flex gap-2">
        <Textarea
          className="min-h-14 flex-1"
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
        <Button className="self-end" disabled={busy || !input.trim()} onClick={() => void send()}>
          {t(lang, "send")}
        </Button>
      </div>
    </div>
  );
}
