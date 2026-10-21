import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { parseIntent } from "@/lib/agent/intents";
import { registry, validateCommand, type AgentCommand } from "@/lib/agent/registry";
import { executeCommand, type AgentResult } from "@/lib/agent/execute";
import { useSettings } from "@/store/settings-store";
type Speech = {
  lang: string;
  onresult: ((e: { results: { transcript: string }[][] }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
export function WahaAgent({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const settings = useSettings((s) => s.settings),
    navigate = useNavigate();
  const [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [pending, setPending] = useState<AgentCommand | null>(null),
    [result, setResult] = useState<AgentResult | null>(null),
    [history, setHistory] = useState<string[]>([]),
    [listening, setListening] = useState(false);
  const speech = useRef<Speech | null>(null),
    active = useRef(true);
  useEffect(() => {
    active.current = true;
    try {
      const h = JSON.parse(localStorage.getItem("waha:agent:history") || "[]");
      if (Array.isArray(h)) setHistory(h.filter((x) => typeof x === "string").slice(0, 8));
    } catch {
      /* optional history */
    }
    return () => {
      active.current = false;
      speech.current?.stop();
    };
  }, []);
  useEffect(() => {
    if (!open) speech.current?.stop();
  }, [open]);
  async function run(command: AgentCommand) {
    setPending(null);
    setBusy(true);
    try {
      const next = await executeCommand(command, (href) => navigate({ href }));
      if (active.current) setResult(next);
    } catch (e) {
      if (active.current)
        setResult({ text: e instanceof Error ? e.message : "تعذّر التنفيذ. جرّب أمرًا آخر" });
    } finally {
      if (active.current) setBusy(false);
    }
  }
  async function send(text = input) {
    if (busy || !text.trim()) return;
    setInput(text);
    setPending(null);
    setResult(null);
    setBusy(true);
    try {
      const h = [text, ...history.filter((x) => x !== text)].slice(0, 8);
      setHistory(h);
      try {
        localStorage.setItem("waha:agent:history", JSON.stringify(h));
      } catch {
        /* optional */
      }
      let command = parseIntent(text);
      if (!command) {
        const r = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
          signal: AbortSignal.timeout(28000),
        });
        if (!r.ok) throw new Error("لم أفهم الطلب أو تعذّر الاتصال. جرّب أحد الأوامر أدناه");
        command = validateCommand((await r.json()).command);
      }
      if (!active.current) return;
      if (registry[command.tool].changing) {
        setPending(command);
        setBusy(false);
      } else await run(command);
    } catch {
      if (active.current)
        setResult({
          text: "لم أفهم الطلب أو تعذّر الاتصال. جرّب: افتح الحاسبة، كم ٢٥×٤، شغل البث",
        });
    } finally {
      if (active.current) setBusy(false);
    }
  }
  function dictate() {
    if (listening) {
      speech.current?.stop();
      return;
    }
    const browser = window as unknown as {
      SpeechRecognition?: new () => Speech;
      webkitSpeechRecognition?: new () => Speech;
    };
    const Recognition = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!Recognition) {
      setResult({ text: "الإملاء الصوتي غير متاح في هذا المتصفح؛ اكتب طلبك" });
      return;
    }
    const recognition = new Recognition();
    speech.current = recognition;
    recognition.lang = "ar-SA";
    recognition.onresult = (e) => {
      setInput(e.results[0][0].transcript);
      setListening(false);
    };
    recognition.onerror = () => {
      setListening(false);
      setResult({ text: "تعذر الإملاء. تحقق من إذن الميكروفون أو اكتب طلبك" });
    };
    recognition.onend = () => setListening(false);
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }
  const suggestions =
    new Date().getHours() < 17
      ? ["وش الجو بالرياض", "ودني الأخبار", "كم ٢٥×٤"]
      : ["كمل الكتاب", "الوضع الليلي", "شغل البث"];
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          dir="rtl"
          aria-describedby="agent-description"
          className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[88dvh] max-w-xl overflow-y-auto rounded-t-3xl border border-border bg-bg p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-fg shadow-xl outline-none"
        >
          <div className="flex items-center justify-between">
            <Dialog.Title className="font-display text-2xl">✦ اطلب من واحة</Dialog.Title>
            <Dialog.Close className="min-h-11 min-w-11" aria-label="إغلاق الوكيل">
              ×
            </Dialog.Close>
          </div>
          <Dialog.Description id="agent-description" className="my-3 text-sm text-muted">
            اكتب طلبك وسأنفّذه داخل واحة. أستأذنك قبل تغيير إعداداتك أو إضافة بيانات.
          </Dialog.Description>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex gap-2"
          >
            <input
              aria-label="طلبك من واحة"
              maxLength={1000}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-12 w-full min-w-0 rounded-xl border border-border bg-surface px-3"
              placeholder="افتح الحاسبة، وش الجو بجدة…"
            />
            <button
              disabled={busy || !input.trim()}
              className="min-h-12 rounded-xl bg-primary px-4 text-primary-fg disabled:opacity-50"
            >
              نفّذ
            </button>
            {settings.agentVoice && (
              <button
                type="button"
                onClick={dictate}
                aria-pressed={listening}
                aria-label="إملاء صوتي"
                className="min-h-12 min-w-11 rounded-xl border border-border"
              >
                {listening ? "■" : "🎙"}
              </button>
            )}
          </form>
          {busy && (
            <p role="status" className="py-4">
              جارٍ فهم الطلب وتنفيذه…
            </p>
          )}
          {pending && (
            <div className="my-4 rounded-2xl border border-border bg-surface p-4">
              <p>تأكيد: {registry[pending.tool].description}</p>
              <p className="my-2 break-words text-sm text-muted">
                {Object.values(pending.args)
                  .map((v) => (typeof v === "string" ? v : JSON.stringify(v)))
                  .join(" · ")}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => void run(pending)}
                  className="min-h-11 rounded-xl bg-primary px-4 text-primary-fg"
                >
                  تأكيد التغيير
                </button>
                <button onClick={() => setPending(null)} className="min-h-11 px-4">
                  إلغاء
                </button>
              </div>
            </div>
          )}
          {result && (
            <div role="status" className="my-4 rounded-2xl border border-border bg-surface p-4">
              <p className="whitespace-pre-wrap break-words leading-7">{result.text}</p>
              {result.links?.map((link) => (
                <button
                  key={link.href}
                  className="mt-2 block min-h-11 w-full text-start text-primary"
                  onClick={() => {
                    if (link.href.startsWith("/")) void navigate({ href: link.href });
                    else {
                      sessionStorage.setItem("waha:browser:pending", link.href);
                      void navigate({ href: "/app/browser" });
                    }
                    onOpenChange(false);
                  }}
                >
                  {link.label} ←
                </button>
              ))}
              {result.undo && (
                <button
                  className="mt-3 min-h-11 px-4 text-primary"
                  onClick={() => {
                    try {
                      result.undo?.();
                      setResult({ text: "تم التراجع" });
                    } catch {
                      setResult({ text: "تعذر التراجع بسبب التخزين" });
                    }
                  }}
                >
                  تراجع
                </button>
              )}
            </div>
          )}
          {settings.agentSuggestions && (
            <div className="my-4 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  disabled={busy}
                  onClick={() => void send(s)}
                  key={s}
                  className="min-h-11 rounded-full border border-border px-4 text-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {history.length > 0 && (
            <details className="mt-4">
              <summary className="min-h-11 cursor-pointer content-center">آخر الأوامر</summary>
              {history.map((h) => (
                <button
                  disabled={busy}
                  key={h}
                  onClick={() => void send(h)}
                  className="block min-h-11 w-full truncate text-start text-sm text-muted"
                >
                  {h}
                </button>
              ))}
            </details>
          )}
          <p className="mt-3 text-xs text-muted">
            إذا تعذّر الفهم محليًا، يُرسل الطلب إلى محسن لفهمه. لا يُرسل سجل أوامرك.
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
