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
type Mode = "chat" | "image" | "clip" | "cv" | "interview" | "plan";
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
    [answer, setAnswer] = useState("");
  const ctl = useRef<AbortController | null>(null),
    upload = useRef<HTMLInputElement>(null),
    sent = useRef(""),
    urls = useRef<string[]>([]),
    end = useRef<HTMLDivElement>(null);
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
    end.current?.scrollIntoView({ block: "nearest" });
  }, [busy, messages.length]);
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
        const r = await fetch("/api/mohsen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, messages: mohsenHistory(messages).slice(-2) }),
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
    <div className="mx-auto max-w-3xl space-y-4" dir="rtl">
      <header>
        <p className="text-sm text-primary">واحة 2.0 · مساعدك من البيت</p>
        <h1 className="font-display text-3xl">اسأل محسن</h1>
        <p className="mt-2 text-sm leading-7 text-muted">
          السجل على جهازك فقط. نرسل السؤال وآخر رسالتين عند المتابعة؛ الملف يُعالج في الذاكرة. قد
          يخطئ محسن، راجع المصادر.
        </p>
      </header>
      <details className="rounded-xl border border-border p-3">
        <summary className="min-h-11 cursor-pointer content-center">
          محادثاتي ({threads.length})
        </summary>
        <div className="flex flex-wrap gap-2">
          <button className={btn} disabled={busy} onClick={newThread}>
            محادثة جديدة
          </button>
          <button
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
        </div>
        {threads.map((t) => (
          <div key={t.id} className="flex gap-2">
            <button
              disabled={busy}
              className="min-h-11 min-w-0 flex-1 truncate text-start"
              aria-pressed={active === t.id}
              onClick={() => {
                setActive(t.id);
                setError("");
              }}
            >
              {t.title}
            </button>
            <button
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
      </details>
      <div role="log" aria-label="المحادثة" aria-live="polite" className="space-y-4">
        {!messages.length && (
          <div className="rounded-2xl bg-primary/10 p-5 leading-8">
            أهلًا بك. فكرة، ملف، صورة أو خطوة لمستقبلك… من أين نبدأ؟
          </div>
        )}
        {messages.map((m, i) => (
          <article
            key={i}
            data-role={m.role}
            className={`min-w-0 rounded-2xl border border-border p-4 ${m.role === "user" ? "ms-6 bg-primary/10" : "me-3 bg-surface"}`}
          >
            <p className="mb-2 text-sm font-bold">
              {m.role === "user" ? "أنت" : "محسن"}
              {m.verified && !!m.citations?.length ? " · موثّق ✓" : ""}
            </p>
            {m.label && <p className="text-xs leading-6 text-muted">{m.label}</p>}
            <p className="whitespace-pre-wrap break-words leading-8">{m.content}</p>
            {m.image && (
              <>
                <img className="my-3 w-full rounded-xl" src={m.image} alt="صورة مولّدة من وصفك" />
                <a download="mohsen.png" href={m.image} className={btn}>
                  تنزيل الصورة
                </a>
              </>
            )}
            {m.video ? (
              <video controls src={m.video} className="w-full" />
            ) : (
              m.slides && <SlideShow slides={m.slides} />
            )}{" "}
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
            {m.role === "assistant" && (
              <div className="mt-3 flex gap-2">
                <button
                  className={btn}
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
                    className={btn}
                    aria-label={v === "👍" ? "جواب مفيد" : "جواب غير مفيد"}
                    aria-pressed={m.vote === v}
                    onClick={() =>
                      setThreads((ts) =>
                        ts.map((t) =>
                          t.id === active
                            ? {
                                ...t,
                                messages: t.messages.map((x, j) =>
                                  j === i ? { ...x, vote: v } : x,
                                ),
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
        ))}
        {busy && (
          <p role="status" className="rounded-xl bg-surface p-4">
            محسن يرتّب لك الجواب…
          </p>
        )}
        <div ref={end} />
      </div>
      {error && (
        <div role="alert" className="rounded-xl border border-border p-4 leading-7">
          {error}
          <div className="mt-2 flex flex-wrap gap-2">
            <button className={btn} onClick={() => void send()}>
              إعادة المحاولة
            </button>
            <ExternalLink direct href="https://si.alhajda.com" className={btn}>
              فتح محسن
            </ExternalLink>
          </div>
        </div>
      )}
      <p role="status" className="text-sm">
        {notice}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="rounded-2xl border border-primary/30 bg-surface p-4"
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {(
            [
              ["chat", "محادثة"],
              ["image", "صورة"],
              ["clip", "مقطع قصير"],
              ["cv", "سيرتي"],
              ["interview", "المقابلة"],
              ["plan", "خطتي"],
            ] as const
          ).map(([value, label]) => (
            <button
              type="button"
              className={btn}
              disabled={busy}
              aria-pressed={mode === value}
              key={value}
              onClick={() => {
                setMode(value);
                setFile(null);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {mode === "clip" && (
          <p className="mb-3 text-sm">
            المقطع يستهلك 3 صور من الحصة ويُركّب على جهازك، أو يُعرض كشرائح.
          </p>
        )}
        {["cv", "interview", "plan"].includes(mode) && (
          <label className="mb-3 block text-sm">
            {mode === "plan" ? "العقبة المتوقعة (اختياري)" : "الوظيفة أو إعلانها (اختياري)"}
            <textarea
              value={job}
              onChange={(e) => setJob(e.target.value)}
              maxLength={3000}
              className="mt-2 min-h-11 w-full rounded-xl border border-border bg-bg p-3"
            />
          </label>
        )}
        {mode === "interview" && (
          <label className="block text-sm">
            جوابك للتقييم عن «حدثنا عن خبرتك» (اختياري)
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              maxLength={2000}
              className="min-h-11 w-full rounded-xl border border-border bg-bg p-3"
            />
          </label>
        )}
        <label htmlFor="mohsen-message" className="mb-2 block text-sm">
          {mode === "cv"
            ? "خبرتك أو سيرتك (30 حرفًا على الأقل)"
            : mode === "plan"
              ? "هدفك"
              : mode === "interview"
                ? "خلفيتك أو وصف الوظيفة"
                : "سؤالك لمحسن"}
        </label>
        <textarea
          id="mohsen-message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={mode === "chat" ? 8000 : 2000}
          rows={3}
          className="w-full rounded-xl border border-border bg-bg p-3"
          placeholder="اسأل محسن…"
        />
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
                if (!input) setInput("لخّص هذا الملف في نقاط");
              } catch (err) {
                setError((err as Error).message);
              }
          }}
        />
        {file && (
          <p className="flex items-center gap-2 break-all text-sm">
            {file.name}
            <button type="button" className={btn} onClick={() => setFile(null)}>
              إزالة المرفق
            </button>
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="submit" className={btn} disabled={busy || !ready || !input.trim()}>
            إرسال
          </button>
          <button
            type="button"
            className={btn}
            disabled={busy}
            onClick={() => upload.current?.click()}
          >
            إرفاق
          </button>
          <MohsenVoice onText={setInput} />
          {busy && (
            <button type="button" className={btn} onClick={() => ctl.current?.abort()}>
              إيقاف
            </button>
          )}
          <ExternalLink direct href="https://si.alhajda.com/haqqiq" className={btn}>
            فرص ودعم ↗
          </ExternalLink>
        </div>
        <p className="mt-3 text-xs leading-6 text-muted">
          {quota
            ? `المتبقي اليوم: ${quota.images?.remaining ?? "—"} صور · ${quota.analyses?.remaining ?? "—"} تحليلات`
            : "الحصة تظهر عند توفر اتصال بمحسن."}{" "}
          · المرفقات والصور لا تُحفظ في سجل واحة؛ نزّل ما تريد الاحتفاظ به.
        </p>
      </form>
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
