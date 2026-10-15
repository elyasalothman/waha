import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "@/components/external-link";
import { MOHSEN_MESSAGE_LIMIT, mohsenHistory } from "@/lib/mohsen-request";
import { featureButton } from "@/lib/share-card";
export const Route = createFileRoute("/ask")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q.slice(0, MOHSEN_MESSAGE_LIMIT) : "",
  }),
  head: () => ({
    meta: [
      { title: "اسأل محسن · واحة" },
      { name: "description", content: "محادثة عربية مع محسن، مساعد البيت، متاحة للضيف بلا حساب." },
    ],
    links: [{ rel: "canonical", href: "https://waha.hajdah.com/ask" }],
  }),
  component: Ask,
});
function Ask() {
  const { q } = Route.useSearch();
  const [input, setInput] = useState(q);
  const [ready, setReady] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string; source?: string | null }[]
  >([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    setInput(q);
    setReady(true);
  }, [q]);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [messages, busy]);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setError("");
    const history = mohsenHistory(messages);
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    controller.current = new AbortController();
    const timeout = window.setTimeout(() => controller.current?.abort(), 35000);
    try {
      const r = await fetch("/api/mohsen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, messages: history }),
        signal: controller.current.signal,
      });
      if (!r.headers.get("content-type")?.includes("application/json"))
        throw new Error("وصل رد غير متوقع. أعد المحاولة بعد تحديث الصفحة.");
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "تعذّر الاتصال");
      if (typeof data.reply !== "string" || !data.reply.trim())
        throw new Error("لم يصل رد من محسن؛ أعد المحاولة.");
      setMessages((m) => [...m, { role: "assistant", content: data.reply, source: data.source }]);
    } catch (e) {
      {
        setError(
          controller.current?.signal.aborted
            ? "انتهت مهلة الاتصال؛ أعد المحاولة."
            : e instanceof Error
              ? e.message
              : "تعذّر الاتصال",
        );
        setInput(text);
      }
    } finally {
      window.clearTimeout(timeout);
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto flex min-h-[65dvh] max-w-3xl flex-col" dir="rtl">
      <h1 className="font-display text-3xl">اسأل محسن</h1>
      <p className="my-3 text-sm leading-7 text-muted">
        مساعد البيت · متاح للضيف بلا حساب. تُرسل رسالتك إلى خدمة محسن. قد يخطئ؛ راجع مصادر الأخبار،
        وارجع لأهل العلم في تفسير القرآن والأحكام.
      </p>
      <div className="flex-1 space-y-4 py-4" role="log" aria-label="المحادثة" aria-live="polite">
        {!messages.length && (
          <p className="rounded-2xl bg-surface p-6">
            أهلًا بك. اكتب سؤالك، أو اسأل عن خبر أو آية من صفحات واحة.
          </p>
        )}
        {messages.map((m, i) => (
          <article
            key={i}
            className={`rounded-2xl border border-border p-4 ${m.role === "user" ? "bg-primary/10" : "bg-surface"}`}
          >
            <p className="mb-2 text-sm font-semibold">{m.role === "user" ? "أنت" : "محسن"}</p>
            <p className="whitespace-pre-wrap break-words leading-8">{m.content}</p>
            {m.source && (
              <ExternalLink href={m.source} className={featureButton}>
                المصدر
              </ExternalLink>
            )}
          </article>
        ))}
        {busy && <p role="status">محسن يجيب…</p>}
        <div ref={end} />
      </div>
      {error && (
        <p role="alert" className="my-3 text-sm">
          {error} — يمكنك إعادة إرسال السؤال.
        </p>
      )}
      <form
        onSubmit={send}
        className="rounded-2xl border border-border bg-bg p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <label htmlFor="mohsen-message" className="mb-2 block text-sm">
          سؤالك لمحسن
        </label>
        <textarea
          id="mohsen-message"
          disabled={!ready}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={MOHSEN_MESSAGE_LIMIT}
          rows={3}
          className="w-full resize-y rounded-xl border border-border bg-surface p-3 text-base"
          placeholder="اكتب سؤالك هنا…"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="submit"
            className={featureButton}
            disabled={!ready || busy || !input.trim()}
          >
            {busy ? "جارٍ الإرسال…" : "إرسال"}
          </button>
          <ExternalLink href="https://ai.alhajda.com/" className={featureButton}>
            افتح محسن كاملًا ↗
          </ExternalLink>
        </div>
      </form>
    </div>
  );
}
