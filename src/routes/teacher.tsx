import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ExternalLink } from "@/components/external-link";
import { featureButton } from "@/lib/share-card";
export const Route = createFileRoute("/teacher")({
  head: () => ({
    meta: [
      { title: "حصتي · دفتر المعلم داخل واحة" },
      { name: "description", content: "التحضير الأسبوعي وكشف الدرجات من حصتي داخل واحة." },
    ],
  }),
  component: Teacher,
});
function Teacher() {
  const [section, setSection] = useState("weekly");
  const [started, setStarted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={
        expanded
          ? "fixed inset-0 z-50 flex flex-col gap-3 overflow-auto bg-bg p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          : "space-y-4"
      }
    >
      <h1 className="font-display text-3xl">حصتي · دفتر المعلم</h1>
      <p className="text-sm leading-7 text-muted">
        واجهة حصتي الأصلية داخل واحة. الحساب والبيانات لدى حصتي؛ قد تحتاج إلى تسجيل الدخول هناك إذا
        منع Safari ملفات الارتباط المضمّنة. لا توجد مزامنة حسابات مع واحة.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          className={featureButton}
          onClick={() => {
            setStarted(true);
            setExpanded(!expanded);
          }}
        >
          {expanded ? "رجوع لواحة" : "ملء الشاشة"}
        </button>
        {[
          ["weekly", "حصص هذا الأسبوع"],
          ["tahdeeri", "تحضيري"],
          ["grades", "كشف الدرجات"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={featureButton}
            aria-pressed={section === id}
            onClick={() => {
              setSection(id);
              setStarted(true);
            }}
          >
            {label}
          </button>
        ))}
        <ExternalLink href={`https://hissati.alhajda.com/app/${section}`} className={featureButton}>
          افتح الموقع الكامل ↗
        </ExternalLink>
      </div>
      {started ? (
        <iframe
          key={section}
          title="حصتي · دفتر المعلم"
          src={`https://hissati.alhajda.com/app/${section}`}
          className={
            expanded
              ? "min-h-96 w-full flex-1 rounded-xl border border-border bg-white"
              : "h-[75dvh] min-h-96 w-full rounded-xl border border-border bg-white"
          }
          referrerPolicy="strict-origin-when-cross-origin"
          allow="fullscreen"
        />
      ) : (
        <button className={featureButton} onClick={() => setStarted(true)}>
          ابدأ حصتي داخل واحة
        </button>
      )}
    </div>
  );
}
