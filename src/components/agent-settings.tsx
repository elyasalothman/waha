import { useEffect, useState } from "react";
import { createLocalStore, type LocalItem } from "@/lib/agent/local";

export function AgentSettings() {
  const [memories, setMemories] = useState<LocalItem[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [report, setReport] = useState("");
  const [status, setStatus] = useState("");
  function refresh() {
    const store = createLocalStore(localStorage);
    setMemories(store.list("memories"));
    setEnabled(store.improveEnabled());
    setReport(store.report());
  }
  useEffect(() => {
    refresh();
  }, []);
  return (
    <div className="space-y-4 border-t border-border pt-4">
      <button
        className="min-h-11 text-primary"
        onClick={() => {
          if (typeof Notification === "undefined") {
            setStatus("إشعارات المتصفح غير متاحة؛ تظهر التذكيرات داخل واحة");
            return;
          }
          void Notification.requestPermission().then((permission) =>
            setStatus(
              permission === "granted"
                ? "فُعّلت إشعارات التذكير أثناء فتح واحة"
                : "ستظهر التذكيرات داخل واحة عند فتحها",
            ),
          );
        }}
      >
        السماح بإشعارات التذكير
      </button>
      <h3 className="font-bold">ذاكرة محسن على جهازك</h3>
      <p className="text-sm text-muted">
        لا تُرسل الذاكرة أو سجلّك إلى محسن. قل «تذكّر أن مدينتي جدة» لتخصيص الأوامر المحلية.
      </p>
      {memories.length ? (
        <ul className="space-y-2">
          {memories.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2">
              <span className="break-words">{item.text}</span>
              <button
                className="min-h-11 min-w-11 text-primary"
                onClick={() => {
                  if (window.confirm("نسيان هذه المعلومة المحلية؟")) {
                    createLocalStore(localStorage).remove("memories", item.id);
                    refresh();
                  }
                }}
              >
                نسيان
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">لا توجد معلومات محفوظة.</p>
      )}
      {memories.length > 0 && (
        <button
          className="min-h-11 text-primary"
          onClick={() => {
            if (window.confirm("مسح ذاكرة محسن بالكامل على هذا الجهاز؟")) {
              createLocalStore(localStorage).clear("memories");
              refresh();
            }
          }}
        >
          مسح الذاكرة
        </button>
      )}
      <label className="flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          className="size-6"
          checked={enabled}
          onChange={(e) => {
            if (
              window.confirm(
                e.target.checked
                  ? "تفعيل عرض تقارير التحسين المحلية؟ لن يُرسل شيء تلقائيًا."
                  : "إيقاف المشاركة الاختيارية؟",
              )
            ) {
              createLocalStore(localStorage).setImproveEnabled(e.target.checked);
              refresh();
            }
          }}
        />
        ساعد محسن يتحسّن
      </label>
      <p className="text-sm text-muted">
        التقييمات محلية فقط، بحد آخر ٢٠٠ تقييم. المشاركة اختيارية؛ راجع العبارات بعد إخفاء الأرقام
        الطويلة والبريد قبل إرسالها علنًا.
      </p>
      {enabled && (
        <>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-bg p-3 text-xs">
            {report || "لا توجد تقييمات بعد"}
          </pre>
          <div className="flex flex-wrap gap-3">
            <button
              className="min-h-11 rounded-xl border border-border px-3"
              onClick={() => {
                void navigator.clipboard.writeText(report).then(
                  () => setStatus("نُسخ التقرير"),
                  () => setStatus("تعذّر النسخ؛ يمكنك تحديد التقرير ونسخه"),
                );
              }}
            >
              نسخ التقرير
            </button>
            <button
              className="min-h-11 rounded-xl border border-border px-3"
              onClick={() => {
                if (
                  window.confirm(
                    "فتح GitHub بملاحظة مجهزة؟ راجع التقرير؛ سيصبح علنيًا فقط إذا نشرت الملاحظة بنفسك.",
                  )
                )
                  window.open(
                    createLocalStore(localStorage).issueUrl(),
                    "_blank",
                    "noopener,noreferrer",
                  );
              }}
            >
              أرسل كملاحظة
            </button>
          </div>
        </>
      )}
      <p role="status" className="text-sm text-muted">
        {status}
      </p>
    </div>
  );
}
