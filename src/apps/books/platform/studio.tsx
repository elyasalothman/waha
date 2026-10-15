import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { splitText, validateBook, type ReadingBook } from "@/lib/books/platform/model";
import { saveDraft } from "@/lib/books/platform/local";
import { importBookFile } from "@/lib/books/platform/import";
const field = "mt-1 min-h-11 w-full min-w-0 rounded-lg border border-border bg-surface p-3 text-fg";
export function BookStudio() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("أدب");
  const [audience, setAudience] = useState("الجميع");
  const [cover, setCover] = useState("");
  const [text, setText] = useState("");
  const [chapters, setChapters] = useState<ReadingBook["chapters"]>([]);
  const [rights, setRights] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState("");
  const [published, setPublished] = useState("");
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await action();
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "تعذّرت العملية. تحقق من مساحة التخزين وحاول مجددًا.",
      );
    } finally {
      setBusy(false);
    }
  }
  function book(): ReadingBook {
    return validateBook({
      id: saved || `draft-${crypto.randomUUID()}`,
      title,
      author,
      category,
      audience,
      cover,
      chapters: text.trim() ? splitText(text) : chapters,
    });
  }
  return (
    <section
      className="my-8 min-w-0 rounded-2xl border border-primary/30 bg-surface p-5"
      dir="rtl"
      aria-labelledby="book-studio-title"
    >
      <h2 id="book-studio-title" className="font-display text-2xl">
        استوديو الكتب
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        ارفع كتابًا تملك حقوقه أو الصق نصه. يُحوَّل إلى فصول مرنة للجوال. المسودة محفوظة على هذا
        الجهاز فقط؛ النشر للجميع يتطلب حساب مدير وقاعدة إنتاج مهيأة.
      </p>
      <fieldset disabled={busy || !ready} className="mt-5 grid min-w-0 gap-4 disabled:opacity-60">
        <label>
          عنوان الكتاب
          <input
            className={field}
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          المؤلف
          <input
            className={field}
            maxLength={200}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            التصنيف
            <input
              className={field}
              maxLength={200}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </label>
          <label>
            العمر المناسب
            <select
              className={field}
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            >
              {["الجميع", "أطفال", "يافعون", "شباب", "كبار"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          غلاف اختياري (صورة حتى 250KB)
          <input
            className={`${field} text-sm`}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              void run(async () => {
                if (
                  file.size > 250_000 ||
                  !["image/png", "image/jpeg", "image/webp"].includes(file.type)
                )
                  throw new Error("اختر صورة PNG أو JPEG أو WebP حتى 250KB.");
                const data = await new Promise<string>((resolve, reject) => {
                  const r = new FileReader();
                  r.onload = () => resolve(String(r.result));
                  r.onerror = () => reject(new Error("تعذّر قراءة الصورة."));
                  r.readAsDataURL(file);
                });
                setCover(data);
              });
            }}
          />
        </label>
        {cover && (
          <div>
            <img
              src={cover}
              alt="معاينة غلاف الكتاب"
              className="h-36 max-w-full rounded-lg object-contain"
            />
            <button
              type="button"
              className="min-h-11 text-sm text-muted"
              onClick={() => setCover("")}
            >
              إزالة الغلاف
            </button>
          </div>
        )}
        <label>
          ملف الكتاب (حتى 20MB)
          <input
            className={`${field} text-sm`}
            type="file"
            accept=".pdf,.epub,.docx,.txt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setSaved("");
              setPublished("");
              setChapters([]);
              setText("");
              void run(async () => {
                const result = await importBookFile(file, setMessage);
                setChapters(result);
                setText(
                  result.map((c) => `# ${c.title}\n${c.paragraphs.join("\n\n")}`).join("\n\n"),
                );
                if (!title) setTitle(file.name.replace(/\.[^.]+$/, "").slice(0, 200));
                setMessage(
                  `اكتمل التحويل: ${result.length} فصول. راجع المعاينة قبل النشر؛ قد يحتاج ترتيب نص PDF إلى تصحيح.`,
                );
              });
            }}
          />
        </label>
        <label>
          أو الصق النص
          <textarea
            className={`${field} min-h-40`}
            maxLength={1_000_000}
            placeholder="استخدم # عنوان أو الفصل الأول لفصل النص تلقائيًا"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setPublished("");
            }}
          />
        </label>
        <label className="flex min-h-11 items-center gap-3">
          <input
            className="size-5 shrink-0"
            type="checkbox"
            checked={rights}
            onChange={(e) => setRights(e.target.checked)}
          />
          أملك حقوق هذا الكتاب وأوافق على نشره للعامة عند اختيار النشر.
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="min-h-11 rounded-lg border border-border px-4"
            onClick={() =>
              void run(async () => {
                const b = book();
                await saveDraft(b);
                setSaved(b.id);
                setMessage("حُفظت مسودة محلية. افتح المعاينة لمراجعة الفصول.");
              })
            }
          >
            حفظ مسودة ومعاينة
          </button>
          <button
            type="button"
            disabled={!rights || Boolean(published)}
            className="min-h-11 rounded-lg bg-primary px-4 text-primary-fg disabled:opacity-50"
            onClick={() =>
              void run(async () => {
                const b = book();
                const response = await fetch("/api/books", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...b, rightsConfirmed: rights }),
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || "تعذّر النشر.");
                setPublished(result.id);
                setMessage("نُشر الكتاب في المكتبة العامة.");
              })
            }
          >
            نشر للعامة
          </button>
        </div>
      </fieldset>
      <p
        role="status"
        aria-live="polite"
        className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-primary"
      >
        {message}
      </p>
      {saved && (
        <Link
          to="/books/library/$id"
          params={{ id: saved }}
          className="inline-flex min-h-11 items-center text-primary underline"
        >
          معاينة المسودة
        </Link>
      )}
      {published && (
        <Link
          to="/books/library/$id"
          params={{ id: published }}
          className="inline-flex min-h-11 items-center text-primary underline"
        >
          اقرأ الكتاب المنشور
        </Link>
      )}
    </section>
  );
}
