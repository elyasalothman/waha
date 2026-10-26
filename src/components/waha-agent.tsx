import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { plan } from "@/lib/agent/planner";
import { LOCAL_KEYS, createLocalStore } from "@/lib/agent/local";
import { speak } from "@/lib/speak";
import { registry, requiresConfirmation, type AgentCommand } from "@/lib/agent/registry";
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
    [listening, setListening] = useState(false),
    [steps, setSteps] = useState<{ command: AgentCommand; description: string; status: string }[]>(
      [],
    ),
    [citations, setCitations] = useState<{ url: string; title: string }[]>([]),
    [external, setExternal] = useState<string | null>(null),
    [feedback, setFeedback] = useState<"yes" | "no" | "saved" | null>(null),
    [completed, setCompleted] = useState<AgentResult[]>([]),
    [dueReminder, setDueReminder] = useState(""),
    [messages, setMessages] = useState<{ question: string; answer: string }[]>([]);
  const queue = useRef<{ command: AgentCommand; description: string; status: string }[]>([]);
  const cursor = useRef(0);
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
    try {
      const saved = JSON.parse(localStorage.getItem("waha:agent:messages") || "[]");
      if (Array.isArray(saved))
        setMessages(
          saved
            .filter((x) => x && typeof x.question === "string" && typeof x.answer === "string")
            .slice(-20),
        );
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
  useEffect(() => {
    function checkReminders() {
      try {
        const reminders = createLocalStore(localStorage).list("reminders");
        const due = reminders.filter(
          (item) => item.dueAt && !item.notified && new Date(item.dueAt).getTime() <= Date.now(),
        );
        if (!due.length) return;
        const text = due.map((item) => item.text).join("، ");
        setDueReminder(text);
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          try {
            new Notification("تذكير من محسن", { body: text });
          } catch {
            /* in-app reminder stays available */
          }
        }
        localStorage.setItem(
          LOCAL_KEYS.reminders,
          JSON.stringify(
            reminders.map((item) =>
              due.some((entry) => entry.id === item.id) ? { ...item, notified: true } : item,
            ),
          ),
        );
      } catch {
        /* reminders are optional when local storage is unavailable */
      }
    }
    checkReminders();
    const timer = window.setInterval(checkReminders, 15000);
    return () => window.clearInterval(timer);
  }, []);
  async function advance(confirmed = false) {
    setPending(null);
    setBusy(true);
    try {
      while (cursor.current < queue.current.length) {
        const index = cursor.current;
        const step = queue.current[index];
        if (requiresConfirmation(step.command) && !confirmed) {
          setPending(step.command);
          step.status = "بانتظار تأكيدك";
          setSteps([...queue.current]);
          return;
        }
        confirmed = false;
        step.status = "جارٍ التنفيذ";
        setSteps([...queue.current]);
        const next = await executeCommand(step.command, (href) => navigate({ href }));
        if (!active.current) return;
        setResult(next);
        setCompleted((previous) => [...previous, next]);
        setMessages((previous) => {
          const nextMessages = [
            ...previous,
            { question: queue.current[index].description, answer: next.text },
          ].slice(-20);
          try {
            localStorage.setItem("waha:agent:messages", JSON.stringify(nextMessages));
          } catch {
            /* optional history */
          }
          return nextMessages;
        });
        const sources = (next as AgentResult & { citations?: { url: string; title: string }[] })
          .citations;
        setCitations((sources || []).filter((x) => /^https:\/\//.test(x.url)));
        step.status = "تم";
        cursor.current += 1;
        setSteps([...queue.current]);
      }
    } catch (e) {
      if (queue.current[cursor.current]) queue.current[cursor.current].status = "تعذّر";
      setSteps([...queue.current]);
      setResult({ text: e instanceof Error ? e.message : "تعذّر التنفيذ. جرّب مرة أخرى" });
    } finally {
      if (active.current) setBusy(false);
    }
  }
  async function send(text = input) {
    if (busy || !text.trim()) return;
    setInput(text);
    setPending(null);
    setResult(null);
    setCitations([]);
    setFeedback(null);
    setCompleted([]);
    const h = [text, ...history.filter((x) => x !== text)].slice(0, 20);
    setHistory(h);
    try {
      localStorage.setItem("waha:agent:history", JSON.stringify(h));
    } catch {
      /* optional */
    }
    try {
      const next = plan(text, { city: createLocalStore(localStorage).city() });
      if (next.confidence < 0.5 && next.suggestions.length) {
        setResult({
          text: "هل تقصد…؟",
          links: next.suggestions.map((label: string) => ({ label, href: `suggestion:${label}` })),
        });
        setSteps([]);
        return;
      }
      queue.current = next.steps.map((step) => ({
        command: step.command,
        description: step.description,
        status: "بانتظار التنفيذ",
      }));
      cursor.current = 0;
      setSteps([...queue.current]);
      await advance();
    } catch {
      setResult({ text: "تعذّر فهم الطلب. جرّب: افتح الحاسبة، كم ٢٥×٤، شغل البث" });
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
    <>
      {dueReminder && (
        <div
          role="status"
          dir="rtl"
          className="fixed inset-x-3 top-4 z-[60] mx-auto max-w-xl rounded-2xl border border-border bg-surface p-4 text-fg shadow-lg"
        >
          <p>تذكير من محسن: {dueReminder}</p>
          <button className="min-h-11 px-4 text-primary" onClick={() => setDueReminder("")}>
            إغلاق التذكير
          </button>
        </div>
      )}
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content
            dir="rtl"
            aria-describedby="agent-description"
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[88dvh] max-w-xl overflow-y-auto rounded-t-3xl border border-border bg-bg p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-fg shadow-xl outline-none"
          >
            <div className="flex items-center justify-between">
              <Dialog.Title className="font-display text-2xl">✦ محسن</Dialog.Title>
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
                aria-label="طلبك من محسن"
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
            {steps.length > 0 && (
              <ol aria-label="خطة محسن" className="my-4 space-y-2">
                {steps.map((step, i) => (
                  <li key={i} className="rounded-xl border border-border p-3 text-sm">
                    <span aria-hidden="true">
                      {step.status === "تم" ? "✓" : step.status === "تعذّر" ? "✗" : "◷"}
                    </span>{" "}
                    {step.description}
                    <span className="block text-xs text-muted">{step.status}</span>
                  </li>
                ))}
              </ol>
            )}
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
                    onClick={() => void advance(true)}
                    className="min-h-11 rounded-xl bg-primary px-4 text-primary-fg"
                  >
                    تأكيد التغيير
                  </button>
                  <button
                    onClick={() => {
                      setPending(null);
                      queue.current = [];
                      setSteps([]);
                      setResult({ text: "تم إلغاء الخطوات المتبقية" });
                    }}
                    className="min-h-11 px-4"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
            {completed.slice(0, -1).map((card, index) => (
              <div key={index} className="my-3 rounded-2xl border border-border bg-surface p-4">
                <p className="whitespace-pre-wrap break-words leading-7">{card.text}</p>
                {card.undo && (
                  <button
                    className="min-h-11 text-primary"
                    onClick={() => {
                      try {
                        card.undo?.();
                        setResult({ text: "تم التراجع" });
                      } catch {
                        setResult({ text: "تعذّر التراجع" });
                      }
                    }}
                  >
                    تراجع عن الخطوة {index + 1}
                  </button>
                )}
              </div>
            ))}
            {result && (
              <div role="status" className="my-4 rounded-2xl border border-border bg-surface p-4">
                <p className="whitespace-pre-wrap break-words leading-7">{result.text}</p>
                {typeof result.source === "string" && (
                  <p className="mt-2 break-words text-xs text-muted">المصدر: {result.source}</p>
                )}
                {typeof result.evidence === "string" && (
                  <p className="break-words text-xs text-muted">دليل الإجابة: {result.evidence}</p>
                )}
                {citations.length > 0 && (
                  <>
                    <p className="mt-2 text-sm text-primary">موثّق ✓</p>
                    {citations.map((source) => (
                      <a
                        href={source.url}
                        key={source.url}
                        onClick={(e) => {
                          e.preventDefault();
                          setExternal(source.url);
                        }}
                        className="block min-h-11 text-start text-primary"
                      >
                        {source.title || source.url} ↗
                      </a>
                    ))}
                  </>
                )}
                {steps.some((s) => s.command.tool === "ask_mohsen") && citations.length === 0 && (
                  <p className="mt-2 text-xs text-muted">بلا مصدر — تحقّق</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    aria-label="إجابة مفيدة"
                    aria-pressed={feedback === "yes"}
                    className="min-h-11 min-w-11"
                    onClick={() => {
                      try {
                        createLocalStore(localStorage).addFeedback(input, true);
                        setFeedback("yes");
                      } catch {
                        setResult({ text: "تعذّر حفظ التقييم على الجهاز" });
                      }
                    }}
                  >
                    👍
                  </button>
                  <button
                    aria-label="إجابة غير مفيدة"
                    aria-pressed={feedback === "no"}
                    className="min-h-11 min-w-11"
                    onClick={() => {
                      try {
                        createLocalStore(localStorage).addFeedback(input, false);
                        setFeedback("no");
                      } catch {
                        setResult({ text: "تعذّر حفظ التقييم على الجهاز" });
                      }
                    }}
                  >
                    👎
                  </button>
                  {feedback === "no" && (
                    <button
                      className="min-h-11 px-3"
                      onClick={() => {
                        createLocalStore(localStorage).addFeedback(input, false, true);
                        setFeedback("saved");
                      }}
                    >
                      ما فهمني — احفظ العبارة
                    </button>
                  )}
                  {feedback === "saved" && (
                    <span className="self-center text-xs text-muted">
                      حُفظت العبارة محليًا بعد إخفاء البيانات الحساسة
                    </span>
                  )}
                  <button className="min-h-11 px-3" onClick={() => speak(result.text)}>
                    قراءة الجواب بصوت
                  </button>
                </div>
                {result.links?.map((link) => (
                  <button
                    key={link.href}
                    className="mt-2 block min-h-11 w-full text-start text-primary"
                    onClick={() => {
                      if (link.href.startsWith("suggestion:")) {
                        void send(link.label);
                        return;
                      }
                      if (link.href.startsWith("/")) void navigate({ href: link.href });
                      else {
                        setExternal(link.href);
                        return;
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
            {external && (
              <div className="my-4 rounded-xl border border-border p-4">
                <p>فتح رابط خارج واحة؟</p>
                <p className="break-all text-xs" dir="ltr">
                  {external}
                </p>
                <button
                  className="min-h-11 px-4 text-primary"
                  onClick={() => {
                    if (/^https:\/\//.test(external))
                      window.open(external, "_blank", "noopener,noreferrer");
                    setExternal(null);
                  }}
                >
                  تأكيد فتح الرابط
                </button>
                <button className="min-h-11 px-4" onClick={() => setExternal(null)}>
                  إلغاء
                </button>
              </div>
            )}
            {messages.length > 0 && (
              <details className="mt-3">
                <summary className="min-h-11 cursor-pointer content-center">
                  سجل المحادثة المحلي
                </summary>
                {messages.map((message, index) => (
                  <div key={index} className="my-2 rounded-xl bg-surface p-3">
                    <p className="text-xs text-muted">{message.question}</p>
                    <p className="whitespace-pre-wrap break-words text-sm">{message.answer}</p>
                  </div>
                ))}
              </details>
            )}
            {history.length > 0 && (
              <details className="mt-4">
                <summary className="min-h-11 cursor-pointer content-center">آخر الأوامر</summary>
                <button
                  className="min-h-11 text-primary"
                  onClick={() => {
                    if (window.confirm("مسح سجل محسن المحلي؟")) {
                      localStorage.removeItem("waha:agent:history");
                      localStorage.removeItem("waha:agent:messages");
                      setMessages([]);
                      setHistory([]);
                    }
                  }}
                >
                  مسح السجل المحلي
                </button>
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
              يُرسل سؤالك فقط إلى محسن للإجابة؛ واحة لا تخزّن نصّك على الخادم. سجل المحادثة على
              جهازك فقط.
            </p>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
