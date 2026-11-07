import { MohsenVoice } from "./mohsen-voice";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  CHAT_KEY,
  composeClip,
  mmRequest,
  readThreads,
  safeSource,
  serviceError,
  validateUpload,
  type ChatMessage,
  type ChatThread,
} from "@/lib/mohsen-v4";
import { ExternalLink } from "./external-link";
import { featureButton as btn } from "@/lib/share-card";
import { mohsenHistory } from "@/lib/mohsen-request";
import { LOCAL_KEYS } from "@/lib/agent/local";
import { guideSite, planGuideTurn } from "@/lib/site-guide";
import { hideMoney } from "@/lib/child-mode";
import { useAppStore } from "@/store/app-store";
import { Link } from "@tanstack/react-router";
type Mode = "chat" | "image" | "clip" | "cv" | "interview" | "plan";
const HINTS = ["وين المكتبة ومركز الأبحاث؟", "فسّر لي فكرة باختصار", "ساعدني أرتب خطوة واحدة"];
const MODES: { id: Mode; label: string }[] = [
  { id: "chat", label: "محادثة" },
  { id: "image", label: "صورة" },
  { id: "clip", label: "مقطع" },
  { id: "cv", label: "سيرة" },
  { id: "interview", label: "مقابلة" },
  { id: "plan", label: "خطة" },
];
/** «تذكّر» memories saved by وكيل محسن on this device only; sent with the question, not stored by Mohsen. */
function deviceMemories(): string[] {
  try {
    const rows = JSON.parse(localStorage.getItem(LOCAL_KEYS.memories) || "[]");
    return Array.isArray(rows)
      ? rows.map((r: { text?: unknown }) => (typeof r?.text === "string" ? r.text : "")).filter(Boolean).slice(-20)
      : [];
  } catch {
    return [];
  }
}
export function MohsenChat({
  q = "",
  mode: initial = "chat",
  attach = false,
}: {
  q?: string;
  mode?: Mode;
  attach?: boolean;
}) {
  const navigate = useNavigate();
  const segment = useAppStore((s) => s.segment);
  const [threads, setThreads] = useState<ChatThread[]>([]),
    [active, setActive] = useState(""),
    [ready, setReady] = useState(false),
    [input, setInput] = useState(q),
    [mode, setMode] = useState<Mode>(initial),
    [file, setFile] = useState<File | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [quota, setQuota] = useState<{
      images?: { remaining: number };
      analyses?: { remaining: number };
    } | null>(null),
    [job, setJob] = useState(""),
    [answer, setAnswer] = useState(""),
    [drawer, setDrawer] = useState(false),
    [toolsOpen, setToolsOpen] = useState(false),
    [viewport, setViewport] = useState({ height: 0, offsetTop: 0 });
  const ctl = useRef<AbortController | null>(null),
    upload = useRef<HTMLInputElement>(null),
    sent = useRef(""),
    urls = useRef<string[]>([]),
    logRef = useRef<HTMLDivElement>(null);
  const current = threads.find((t) => t.id === active),
    messages = current?.messages || [];
  function newThread() {
    const id = crypto.randomUUID();
    setThreads((ts) => [{ id, title: "محادثة جديدة", messages: [] }, ...ts].slice(0, 20));
    setActive(id);
    setInput("");
    setError("");
  }
  useEffect(() => {
    let saved: ChatThread[] = [];
    try {
      saved = readThreads(localStorage.getItem(CHAT_KEY));
    } catch {
      setNotice("التخزين غير متاح؛ سجل هذه الجلسة مؤقت.");
    }
    if (saved.length) {
      setThreads(saved);
      setActive(saved[0].id);
    } else {
      const id = crypto.randomUUID();
      setThreads([{ id, title: "محادثة جديدة", messages: [] }]);
      setActive(id);
    }
    setReady(true);
    const resourceUrls = urls.current;
    return () => {
      ctl.current?.abort();
      resourceUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(
        CHAT_KEY,
        JSON.stringify(
          threads.map((t) => ({
            ...t,
            messages: t.messages.map(
              ({ image: _image, slides: _slides, video: _video, ...m }) => m,
            ),
          })),
        ),
      );
    } catch {
      setNotice("تعذّر حفظ السجل على جهازك؛ يمكنك متابعة المحادثة ونسخ الرد.");
    }
  }, [threads, ready]);
  async function refreshQuota() {
    try {
      setQuota(await (await mmRequest("/api/mm/quota")).json());
    } catch {
      setQuota(null);
    }
  }
  useEffect(() => {
    void refreshQuota();
  }, []);
  useEffect(() => {
    if (ready && attach) upload.current?.click();
  }, [ready, attach]);
  useEffect(() => {
    const read = () => {
      const view = window.visualViewport;
      setViewport({
        height: view?.height || window.innerHeight,
        offsetTop: view?.offsetTop || 0,
      });
    };
    read();
    window.visualViewport?.addEventListener("resize", read);
    window.visualViewport?.addEventListener("scroll", read);
    window.addEventListener("resize", read);
    return () => {
      window.visualViewport?.removeEventListener("resize", read);
      window.visualViewport?.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, []);
  useEffect(() => {
    if (!drawer) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);
  useEffect(() => {
    const node = logRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [busy, messages.length, viewport.height]);
  function append(message: ChatMessage) {
    setThreads((ts) =>
      ts.map((t) =>
        t.id === active
          ? {
              ...t,
              title: t.messages.length ? t.title : message.content.slice(0, 55),
              messages: [...t.messages, message].slice(-60),
            }
          : t,
      ),
    );
  }
  async function send(text = input) {
    if (!text.trim() || busy || !ready) return;
    setError("");
    setBusy(true);
    setInput("");
    append({ role: "user", content: text });
    const controller = new AbortController();
    ctl.current = controller;
    const timer = setTimeout(() => controller.abort(), 120000);
    try {
      let result: ChatMessage = { role: "assistant", content: "" };
      const chosen = file ? "analyze" : /^ارسم|^صمم صورة/.test(text) ? "image" : mode;
      if (chosen === "analyze" && file) {
        validateUpload(file);
        const form = new FormData();
        form.set("file", file);
        form.set("question", text);
        const data = await (await mmRequest("/api/mm/analyze", form, controller.signal)).json();
        result = { role: "assistant", content: data.reply, label: data.label };
        setFile(null);
      } else if (chosen === "image") {
        const r = await mmRequest("/api/mm/image", { prompt: text }, controller.signal);
        if (!r.headers.get("content-type")?.startsWith("image/"))
          throw new Error("لم تصل صورة صالحة.");
        const image = URL.createObjectURL(await r.blob());
        urls.current.push(image);
        result = {
          role: "assistant",
          content: "صورتك جاهزة · احفظها قبل مغادرة الصفحة",
          image,
          label: "مولّد بمحسن",
        };
      } else if (chosen === "clip") {
        const data = await (
          await mmRequest("/api/mm/plan", { prompt: text }, controller.signal)
        ).json();
        const slides: string[] = [];
        for (const scene of data.scenes || []) {
          const r = await mmRequest("/api/mm/image", { prompt: scene.en }, controller.signal);
          if (!r.headers.get("content-type")?.startsWith("image/"))
            throw new Error("تعذّر توليد مشهد.");
          const url = URL.createObjectURL(await r.blob());
          urls.current.push(url);
          slides.push(url);
        }
        if (slides.length < 2) throw new Error("لم تصل مشاهد كافية.");
        let video: string | null = null;
        try {
          video = await composeClip(slides, controller.signal);
        } catch {
          if (controller.signal.aborted) throw new Error("توقف الطلب.");
        }
        if (video) urls.current.push(video);
        result = {
          role: "assistant",
          content: video
            ? "مقطعك جاهز · صور مولّدة متحركة دون صوت"
            : "عرض شرائح متحرك · هذا المتصفح لا يدعم تركيب WebM",
          slides,
          video: video || undefined,
          label: "مولّد بمحسن",
        };
      } else if (["cv", "interview", "plan"].includes(chosen)) {
        const body =
          chosen === "cv"
            ? { cv: text, job }
            : chosen === "interview"
              ? { job: job || text, cv: job ? text : "", answer, question: "حدثنا عن خبرتك" }
              : { goal: text, obstacle: job };
        const data = await (
          await mmRequest(`/api/haqqiq/${chosen}`, body, controller.signal)
        ).json();
        if (data.ok === false) throw new Error("تعذّر إكمال الطلب؛ تحقق من النص وأعد المحاولة.");
        result = {
          role: "assistant",
          content: [
            data.message,
            data.ar,
            data.en,
            data.tips,
            data.feedback,
            ...(data.questions || []),
            ...(data.plans || []),
          ]
            .filter(Boolean)
            .join("\n\n"),
          label: "حقّق · لا يُخزّن النص لدى العامل",
        };
      } else {
        const plan = planGuideTurn(text, { hideMoney: hideMoney(segment) });
        if (plan.action === "local") {
          result = {
            role: "assistant",
            content: plan.text,
            label: "دليل الصفحات في واحة",
          };
        } else {
          const message = plan.action === "mixed" ? plan.remoteMessage : text;
          try {
            const r = await fetch("/api/mohsen", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message,
                messages: plan.action === "mixed" ? [] : mohsenHistory(messages).slice(-2),
                memory: deviceMemories(),
              }),
              signal: controller.signal,
            });
            if (!r.ok) throw new Error(serviceError(r.status));
            const data = await r.json();
            result = {
              role: "assistant",
              content: data.reply,
              citations: data.citations?.filter((c: { url: string }) => safeSource(c.url)),
              verified: data.verified === true,
              label: data.evidence,
            };
            if (plan.action === "mixed") {
              result = {
                ...result,
                content: `${plan.localText}\n\n${result.content}`,
                verified: false,
                label: "السؤال العام أجابته خدمة محسن كما هي.",
              };
            }
          } catch (err) {
            if (plan.action !== "mixed") throw err;
            result = {
              role: "assistant",
              content: plan.localText,
              label: "دليل الصفحات في واحة",
            };
            setError("تعذّر جواب السؤال العام. الوجهة أعلاه تبقى في واحة.");
          }
        }
      }
      if (typeof result.content !== "string" || !result.content.trim())
        throw new Error("لم يصل جواب؛ أعد المحاولة.");
      if (!controller.signal.aborted) append(result);
    } catch (e) {
      setError(
        controller.signal.aborted
          ? "توقف الطلب أو انتهت المهلة؛ يمكنك إعادة المحاولة."
          : e instanceof Error
            ? e.message
            : "تعذّر الاتصال؛ تحقق من الإنترنت.",
      );
      setInput(text);
    } finally {
      clearTimeout(timer);
      setBusy(false);
      void refreshQuota();
    }
  }
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  });
  useEffect(() => {
    if (!q) sent.current = "";
    if (ready && q && sent.current !== q) {
      sent.current = q;
      void navigate({
        to: "/mohsen",
        search: { q: "", mode: initial, attach: false },
        replace: true,
      });
      void sendRef.current(q);
    }
  }, [ready, q, initial, navigate]);

  return (
    <div
      className="fixed inset-0 z-30 flex flex-col bg-bg text-fg"
      style={
        viewport.height
          ? { top: viewport.offsetTop, height: viewport.height, bottom: "auto" }
          : undefined
      }
      dir="rtl"
      data-mohsen-layout="chat"
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-border px-3 pt-[env(safe-area-inset-top,0px)]">
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full text-lg"
          aria-expanded={drawer}
          aria-controls="mohsen-drawer"
          onClick={() => setDrawer(true)}
        >
          <span className="sr-only">قائمة محسن</span>
          <span aria-hidden="true">☰</span>
        </button>
        <h1 className="font-display text-xl">محسن</h1>
      </header>
      <div ref={logRef} role="log" aria-label="المحادثة" aria-live="polite" className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {!messages.length && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="font-display text-3xl">محسن</p>
            <p className="max-w-sm text-sm leading-7 text-muted">اسأل بحرية، أو اطلب صفحة موجودة في واحة.</p>
            <div className="flex max-w-sm flex-wrap justify-center gap-2">
              {HINTS.map((hint) => (
                <button
                  key={hint}
                  type="button"
                  className="min-h-11 rounded-full px-3 text-sm text-muted underline-offset-4 hover:underline disabled:opacity-50"
                  disabled={busy || !ready}
                  onClick={() => void sendRef.current(hint)}
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => {
          const prior = messages[i - 1];
          const asked =
            prior?.role === "user" ? guideSite(prior.content, { hideMoney: hideMoney(segment) }) : null;
          const guide = m.role === "assistant" ? asked : null;
          const verified =
            Boolean(m.verified && m.citations?.length) && (!asked || asked.mode === "general");
          return (
            <article
              key={i}
              data-role={m.role}
              className={
                m.role === "user"
                  ? "mb-5 me-auto max-w-[85%] rounded-[1.25rem] bg-primary px-4 py-2.5 text-primary-fg"
                  : "mb-8 max-w-2xl"
              }
            >
              <p className={`mb-1 text-xs ${m.role === "user" ? "text-primary-fg/80" : "text-muted"}`}>
                {m.role === "user" ? "أنت" : "محسن"}
                {verified ? " · موثّق ✓" : ""}
              </p>
              {m.label && !m.label.includes("دليل الصفحات") ? (
                <p className="text-xs leading-6 text-muted">{m.label}</p>
              ) : null}
              <p className="whitespace-pre-wrap break-words leading-8">{m.content}</p>
              {m.image && (
                <>
                  <img className="my-3 w-full rounded-xl" src={m.image} alt="صورة مولّدة من وصفك" />
                  <a download="mohsen.png" href={m.image} className={btn}>
                    تنزيل الصورة
                  </a>
                </>
              )}
              {m.video ? <video controls src={m.video} className="w-full" /> : m.slides && <SlideShow slides={m.slides} />}
              {m.video && (
                <a download="mohsen.webm" href={m.video} className={btn}>
                  تنزيل المقطع
                </a>
              )}
              {m.citations?.map((c) => (
                <ExternalLink
                  direct
                  key={c.url}
                  href={c.url}
                  className="my-2 block min-h-11 content-center break-words text-primary underline"
                >
                  {c.title || new URL(c.url).hostname} ↗
                </ExternalLink>
              ))}
              {guide?.mode === "navigate" && (
                <div className="mt-3 grid gap-2" data-site-guide="navigate">
                  {guide.matches.map((match) => {
                    const emoji = match.href.includes("research")
                      ? "🔬"
                      : match.href.startsWith("/books")
                        ? "📚"
                        : "🌿";
                    const body = (
                      <>
                        <span className="block font-medium">
                          {emoji} {match.title}
                        </span>
                        {match.detail ? (
                          <span className="mt-1 block text-sm leading-6 text-muted">{match.detail}</span>
                        ) : null}
                      </>
                    );
                    const card =
                      "block min-h-11 rounded-2xl border border-border bg-surface px-3 py-2.5 text-start focus-visible:outline-2 focus-visible:outline-offset-2";
                    return match.href.startsWith("/") ? (
                      <button
                        key={match.href}
                        type="button"
                        className={card}
                        onClick={() => void navigate({ href: match.href })}
                      >
                        {body}
                      </button>
                    ) : (
                      <ExternalLink key={match.href} direct href={match.href} className={card}>
                        {body}
                      </ExternalLink>
                    );
                  })}
                </div>
              )}
              {m.role === "assistant" && (
                <div className="mt-2 flex gap-1">
                  <button
                    type="button"
                    className="grid size-11 place-items-center rounded-full text-sm text-muted focus-visible:outline-2"
                    onClick={() => {
                      void navigator.clipboard.writeText(m.content).then(
                        () => setNotice("نُسخ الجواب"),
                        () => setNotice("تعذّر النسخ؛ حدّد النص وانسخه."),
                      );
                    }}
                  >
                    نسخ
                  </button>
                  {["👍", "👎"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      className="grid size-11 place-items-center rounded-full text-muted focus-visible:outline-2"
                      aria-label={v === "👍" ? "جواب مفيد" : "جواب غير مفيد"}
                      aria-pressed={m.vote === v}
                      onClick={() =>
                        setThreads((ts) =>
                          ts.map((t) =>
                            t.id === active
                              ? {
                                  ...t,
                                  messages: t.messages.map((x, j) => (j === i ? { ...x, vote: v } : x)),
                                }
                              : t,
                          ),
                        )
                      }
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </article>
          );
        })}
        {busy && (
          <p role="status" className="rounded-xl bg-surface p-4">
            محسن يرتّب لك الجواب…
          </p>
        )}
      </div>
      {error && (
        <div role="alert" className="shrink-0 border-t border-border px-4 py-2 text-sm leading-7">
          {error}
          <button type="button" className={`${btn} ms-2`} onClick={() => void send()}>
            إعادة المحاولة
          </button>
        </div>
      )}
      {notice ? (
        <p role="status" className="shrink-0 px-4 text-sm">
          {notice}
        </p>
      ) : null}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setToolsOpen(false);
          void send();
        }}
        className="relative shrink-0 border-t border-border bg-bg px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]"
      >
        {mode !== "chat" && (
          <p className="mb-2 flex items-center gap-2 text-sm">
            <span>{MODES.find((item) => item.id === mode)?.label}</span>
            <button type="button" className="text-muted" onClick={() => setMode("chat")}>
              إلغاء
            </button>
          </p>
        )}
        {["cv", "interview", "plan"].includes(mode) && (
          <label className="mb-2 block text-xs text-muted">
            {mode === "plan" ? "العقبة المتوقعة، إن وجدت" : "الوظيفة، إن وجدت"}
            <input
              value={job}
              onChange={(e) => setJob(e.target.value)}
              maxLength={3000}
              className="mt-1 min-h-11 w-full rounded-xl border border-border bg-surface px-3"
            />
          </label>
        )}
        {mode === "interview" && (
          <label className="mb-2 block text-xs text-muted">
            جوابك عن خبرتك، إن أردت تقييمه
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              maxLength={2000}
              className="mt-1 min-h-11 w-full rounded-xl border border-border bg-surface px-3"
            />
          </label>
        )}
        {file && (
          <p className="mb-2 flex items-center gap-2 break-all text-sm">
            {file.name}
            <button type="button" className="text-muted" onClick={() => setFile(null)}>
              إزالة
            </button>
          </p>
        )}
        <div className="flex items-end gap-2">
          <button
            type="button"
            className="grid size-11 shrink-0 place-items-center rounded-full border border-border text-xl"
            aria-expanded={toolsOpen}
            aria-label="أدوات الرسالة"
            onClick={() => setToolsOpen((open) => !open)}
          >
            +
          </button>
          <label htmlFor="mohsen-message" className="sr-only">
            رسالتك
          </label>
          <textarea
            id="mohsen-message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setToolsOpen(false)}
            maxLength={mode === "chat" ? 8000 : 2000}
            rows={1}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-border bg-surface px-3 py-2.5 leading-7"
            placeholder="اكتب لمحسن"
          />
          <MohsenVoice onText={setInput} />
          {busy ? (
            <button type="button" className={btn} onClick={() => ctl.current?.abort()}>
              إيقاف
            </button>
          ) : (
            <button type="submit" className={btn} disabled={!ready || !input.trim()}>
              إرسال
            </button>
          )}
        </div>
        {toolsOpen && (
          <div className="absolute inset-x-3 bottom-full mb-2 rounded-2xl border border-border bg-surface p-2 shadow-lg">
            <div className="flex flex-wrap gap-1">
              {MODES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={btn}
                  aria-pressed={mode === item.id}
                  onClick={() => {
                    setMode(item.id);
                    if (item.id !== "chat") setFile(null);
                    setToolsOpen(false);
                  }}
                >
                  {item.label}
                </button>
              ))}
              <button type="button" className={btn} onClick={() => upload.current?.click()}>
                إرفاق
              </button>
            </div>
            <p className="px-2 pt-2 text-xs leading-6 text-muted">
              {quota
                ? `المتبقي اليوم: ${quota.images?.remaining ?? "—"} صور · ${quota.analyses?.remaining ?? "—"} تحليلات.`
                : "الحصة تظهر عند الاتصال."}{" "}
              المرفقات لا تُحفظ في السجل.
            </p>
          </div>
        )}
        <input
          ref={upload}
          type="file"
          className="sr-only"
          tabIndex={-1}
          accept=".png,.jpg,.jpeg,.webp,.pdf,.docx,.xlsx,.txt,.csv,.md,.json"
          aria-label="إرفاق ملف"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f)
              try {
                validateUpload(f);
                setFile(f);
                setMode("chat");
                setError("");
                setToolsOpen(false);
                if (!input) setInput("لخّص هذا الملف في نقاط");
              } catch (err) {
                setError((err as Error).message);
              }
          }}
        />
        <p className="mt-1 text-center text-[11px] leading-5 text-muted">قد يخطئ محسن. السجل على جهازك.</p>
      </form>
      {drawer && (
        <div className="fixed inset-0 z-50">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="إغلاق القائمة" onClick={() => setDrawer(false)} />
          <aside
            id="mohsen-drawer"
            role="dialog"
            aria-label="قائمة محسن"
            className="absolute inset-y-0 start-0 flex w-[min(100%,20rem)] flex-col gap-3 overflow-y-auto bg-bg p-4 pt-[max(1rem,env(safe-area-inset-top))] shadow-xl"
          >
            <div className="flex items-center justify-between">
              <p className="font-display text-2xl">محسن</p>
              <button type="button" className="size-11" aria-label="إغلاق" onClick={() => setDrawer(false)}>
                ×
              </button>
            </div>
            <button type="button" className={btn} disabled={busy} onClick={() => { newThread(); setDrawer(false); }}>
              محادثة جديدة
            </button>
            <nav className="grid gap-1 text-sm" aria-label="العودة إلى واحة">
              <Link to="/" className="min-h-11 content-center" onClick={() => setDrawer(false)}>
                واحة
              </Link>
              <Link to="/books" className="min-h-11 content-center" onClick={() => setDrawer(false)}>
                المكتبة
              </Link>
              <Link to="/research" className="min-h-11 content-center" onClick={() => setDrawer(false)}>
                الأبحاث
              </Link>
              <Link to="/settings" hash="account" className="min-h-11 content-center" onClick={() => setDrawer(false)}>
                الحساب والإعدادات
              </Link>
              <Link to="/privacy" className="min-h-11 content-center" onClick={() => setDrawer(false)}>
                الخصوصية
              </Link>
            </nav>
            <p className="text-xs leading-6 text-muted">
              جواب المحادثة يأتي من خدمة محسن كما هي. وجهات الصفحات من واحة، وتُفتح عندما تضغطها.
            </p>
            <h2 className="text-sm font-medium">المحادثات</h2>
            {threads.map((t) => (
              <div key={t.id} className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  className="min-h-11 min-w-0 flex-1 truncate text-start"
                  aria-pressed={active === t.id}
                  onClick={() => {
                    setActive(t.id);
                    setError("");
                    setDrawer(false);
                  }}
                >
                  {t.title}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="min-h-11 min-w-11"
                  aria-label={`حذف ${t.title}`}
                  onClick={() => {
                    if (confirm("حذف هذه المحادثة من الجهاز؟")) {
                      setThreads((ts) => ts.filter((x) => x.id !== t.id));
                      if (active === t.id) newThread();
                    }
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className={btn}
              disabled={busy}
              onClick={() => {
                if (confirm("مسح كل محادثات محسن من هذا الجهاز؟")) {
                  setThreads([]);
                  newThread();
                }
              }}
            >
              مسح السجل
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}

function SlideShow({ slides }: { slides: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setI((n) => (n + 1) % slides.length), 2500);
    return () => clearInterval(timer);
  }, [slides.length]);
  return (
    <div>
      <img src={slides[i]} alt={`مشهد ${i + 1} من المقطع`} className="w-full rounded-xl" />
      <div className="flex flex-wrap gap-2">
        {slides.map((url, j) => (
          <a key={url} href={url} download={`scene-${j + 1}.png`} className={btn}>
            حفظ مشهد {j + 1}
          </a>
        ))}
      </div>
    </div>
  );
}
