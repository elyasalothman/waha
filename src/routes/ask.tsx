import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { askWaha } from "@/lib/ai";
import { answerLocally, honestyLabel, type AskAnswer, type Honesty } from "@/lib/ask";
import { t } from "@/lib/i18n";
import { fetchWeatherSafe, type WeatherPayload } from "@/lib/weather";
import { cn } from "@/lib/cn";
import { useAppStore } from "@/store/app-store";
import { useNow } from "@/hooks/use-now";
import { useEffect } from "react";

export const Route = createFileRoute("/ask")({ component: AskPage });

type Msg = { role: "user" | "assistant"; content: string; honesty?: Honesty };

export function AskPage() {
  const lang = useAppStore((s) => s.lang);
  const city = useAppStore((s) => s.city);
  const labs = useAppStore((s) => s.labs);
  const now = useNow(30_000);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherPayload | null>(null);

  useEffect(() => {
    fetchWeatherSafe(city.lat, city.lon).then(setWeather);
  }, [city.lat, city.lon]);

  const listening = useMemo(() => labs.includes("voice"), [labs]);

  function listen() {
    const w = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null;
        start: () => void;
      };
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = lang === "ar" ? "ar-SA" : lang;
    rec.onresult = (e) => {
      const said = e.results[0]?.[0]?.transcript ?? "";
      if (said) setInput(said);
    };
    rec.start();
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const user: Msg = { role: "user", content: text };
    setMsgs((m) => [...m, user]);
    setInput("");
    setBusy(true);
    setErr(null);
    try {
      const local = answerLocally(text, { city, lang, now, weather });
      if (local) {
        setMsgs((m) => [...m, { role: "assistant", content: local.text, honesty: local.honesty }]);
        return;
      }
      const history = [...msgs, user].map((m) => ({ role: m.role, content: m.content })).slice(-12);
      const res = await askWaha({ data: { mode: "chat", lang: lang === "ar" ? "ar" : "en", messages: history } });
      if (!res.ok) {
        const fallback: AskAnswer = {
          honesty: "partial",
          text:
            lang === "ar"
              ? "جزئي — المساعد السحابي غير مربوط هنا. أسأل عن الصلاة التالية أو الطقس أو القبلة لجواب مدعوم من واحة."
              : "Partial — the cloud assistant is not wired here. Ask for the next prayer, weather, or qibla for a supported answer from Waha.",
        };
        setMsgs((m) => [...m, { role: "assistant", content: fallback.text, honesty: fallback.honesty }]);
      } else {
        setMsgs((m) => [...m, { role: "assistant", content: res.text, honesty: "partial" }]);
      }
    } catch {
      setErr(t(lang, "error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col">
      <h1 className="font-display text-4xl tracking-tight">{t(lang, "askTitle")}</h1>
      <p className="mt-2 text-sm text-muted">
        {t(lang, "supported")} · {t(lang, "partial")} · {t(lang, "unknown")}
      </p>
      <div className="mt-6 flex-1 space-y-3 rounded-xl border border-border bg-surface p-4">
        {msgs.length === 0 ? (
          <p className="text-sm text-muted">{t(lang, "placeholderChat")}</p>
        ) : (
          msgs.map((m, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed",
                m.role === "user" ? "ms-auto bg-surface-2 text-fg" : "bg-bg text-fg",
              )}
            >
              {m.honesty ? (
                <p className="mb-1 text-[11px] text-subtle">{honestyLabel(lang, m.honesty)}</p>
              ) : null}
              {m.content}
            </div>
          ))
        )}
        {busy ? <p className="text-sm text-muted">{t(lang, "thinking")}</p> : null}
        {err ? <p className="text-sm text-danger">{err}</p> : null}
      </div>
      <div className="mt-3 flex gap-2">
        {listening ? (
          <Button type="button" variant="secondary" onClick={() => listen()}>
            {lang === "ar" ? "صوت" : "Voice"}
          </Button>
        ) : null}
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t(lang, "placeholderChat")}
          className="min-h-12 flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <Button type="button" onClick={() => void send()} disabled={busy}>
          {t(lang, "send")}
        </Button>
      </div>
    </div>
  );
}
