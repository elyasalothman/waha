import { AgentSettings } from "./agent-settings";
import { clearWahaLocalData } from "@/lib/local-data";
import { useState } from "react";
import { useSettings } from "@/store/settings-store";
import { defaultSettings, parseSettings, type Settings } from "@/lib/settings";
import { SERVICES } from "@/lib/superapp";
import { CITIES } from "@/lib/cities";
import { NEWS_SOURCES, NEWS_TOPICS } from "@/lib/arabic-news";
type Field = {
  key: keyof Settings;
  label: string;
  options?: readonly (readonly [string, string])[];
};
const groups: { title: string; fields: Field[] }[] = [
  {
    title: "المظهر",
    fields: [
      {
        key: "theme",
        label: "المظهر",
        options: [
          ["auto", "تلقائي"],
          ["light", "فاتح"],
          ["dark", "داكن"],
        ],
      },
      {
        key: "accent",
        label: "اللون المميز",
        options: [
          ["green", "أخضر"],
          ["blue", "أزرق"],
          ["purple", "بنفسجي"],
          ["red", "أحمر"],
          ["brown", "بني"],
          ["teal", "فيروزي"],
        ],
      },
      {
        key: "fontSize",
        label: "حجم الخط",
        options: [
          ["small", "صغير"],
          ["normal", "عادي"],
          ["large", "كبير"],
          ["largest", "كبير جدًا"],
        ],
      },
      {
        key: "density",
        label: "كثافة الواجهة",
        options: [
          ["comfortable", "مريحة"],
          ["compact", "مضغوطة"],
        ],
      },
      { key: "reducedMotion", label: "تقليل الحركة" },
      {
        key: "background",
        label: "خلفية الرئيسية",
        options: [
          ["plain", "بسيطة"],
          ["sand", "رملية"],
          ["garden", "حديقة"],
        ],
      },
    ],
  },
  {
    title: "تخصيص الرئيسية",
    fields: [
      { key: "weatherWidget", label: "إظهار الطقس" },
      { key: "newsWidget", label: "إظهار آخر الأخبار" },
      { key: "liveWidget", label: "إظهار البث" },
    ],
  },
  {
    title: "محسن",
    fields: [
      { key: "agentEnabled", label: "تشغيل محسن" },
      { key: "agentVoice", label: "الإملاء الصوتي (بإذن الميكروفون)" },
      { key: "agentSuggestions", label: "اقتراحات حسب الوقت" },
    ],
  },
  {
    title: "الطقس والأخبار",
    fields: [
      { key: "city", label: "المدينة", options: CITIES.map((c) => [c.id, c.ar]) },
      {
        key: "location",
        label: "الموقع",
        options: [
          ["manual", "مدينة يدوية"],
          ["device", "موقعي (بإذن)"],
        ],
      },
      {
        key: "temperature",
        label: "وحدة الحرارة",
        options: [
          ["C", "مئوية"],
          ["F", "فهرنهايت"],
        ],
      },
    ],
  },
  {
    title: "القراءة",
    fields: [
      { key: "readingNight", label: "الوضع الليلي الافتراضي للكتب الجديدة" },
      {
        key: "readingFont",
        label: "خط القراءة",
        options: [
          ["serif", "أميري"],
          ["sans", "خط الواجهة"],
        ],
      },
    ],
  },
  {
    title: "اللغة والمنطقة",
    fields: [
      {
        key: "language",
        label: "اللغة / Language",
        options: [
          ["ar", "العربية"],
          ["en", "English"],
        ],
      },
      {
        key: "calendar",
        label: "التاريخ",
        options: [
          ["gregory", "ميلادي"],
          ["islamic-umalqura", "هجري"],
        ],
      },
      {
        key: "digits",
        label: "الأرقام",
        options: [
          ["arab", "١٢٣"],
          ["latn", "123"],
        ],
      },
    ],
  },
  { title: "الخصوصية والبيانات", fields: [{ key: "childMode", label: "وضع الطفل" }] },
  { title: "متقدم", fields: [{ key: "developer", label: "وضع المطوّر" }] },
];
export function SettingsPage() {
  const { settings: s, update } = useSettings();
  const [query, setQuery] = useState(""),
    [notice, setNotice] = useState(""),
    [confirm, setConfirm] = useState<"reset" | "clear" | "history" | null>(null),
    [cacheInfo, setCacheInfo] = useState("");
  function patch(p: Partial<Settings>) {
    try {
      update(p);
      setNotice("حُفظت الإعدادات على هذا الجهاز");
    } catch {
      setNotice("تعذّر الحفظ. تحقق من مساحة التخزين");
    }
  }
  function toggleList(key: "newsTopics" | "newsSources", value: string) {
    const a = s[key];
    patch({ [key]: a.includes(value as never) ? a.filter((x) => x !== value) : [...a, value] });
  }
  function exportSettings() {
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "waha-settings.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function destructive() {
    try {
      if (confirm === "history") {
        localStorage.removeItem("waha:agent:history");
        localStorage.removeItem("waha:agent:messages");
      }
      if (confirm === "reset") update(defaultSettings);
      if (confirm === "clear") {
        await clearWahaLocalData();
        update(defaultSettings);
      }
      setNotice(confirm === "clear" ? "مُسحت بيانات واحة المحلية" : "تم التنفيذ");
      setConfirm(null);
      if (confirm !== "history") location.reload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "تعذّر إتمام العملية");
    }
  }
  return (
    <div className="mx-auto max-w-3xl space-y-4" dir="rtl">
      <h1 className="font-display text-3xl">الإعدادات والتخصيص</h1>
      <p className="text-sm text-muted">
        تُطبّق فورًا على هذا الجهاز. لا تتوفر مزامنة إعدادات الحساب حاليًا.
      </p>
      <label className="block">
        بحث داخل الإعدادات
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-2 min-h-12 w-full rounded-xl border border-border bg-surface px-3"
        />
      </label>
      <p role="status" className="text-sm text-primary">
        {notice}
      </p>
      {groups
        .filter(
          (g) =>
            !query ||
            g.title.includes(query) ||
            g.fields.some((f) => f.label.includes(query)) ||
            (
              (
                {
                  "تخصيص الرئيسية": "اختصارات ترتيب تبويبات الشريط",
                  "الطقس والأخبار": "الأقسام المصادر المفضلة",
                  "الخصوصية والبيانات": "تصدير استيراد مسح JSON",
                  متقدم: "الإصدار البناء المصنع الأوفلاين",
                } as Record<string, string>
              )[g.title] || ""
            ).includes(query),
        )
        .map((g) => (
          <details
            key={g.title}
            open={query ? true : undefined}
            className="rounded-2xl border border-border bg-surface p-4"
          >
            <summary className="min-h-11 cursor-pointer content-center text-lg">{g.title}</summary>
            <div className="space-y-3 pt-3">
              {g.fields
                .filter((f) => !query || g.title.includes(query) || f.label.includes(query))
                .map((f) => (
                  <label
                    key={f.key}
                    className="flex min-h-12 flex-wrap items-center justify-between gap-3"
                  >
                    <span>{f.label}</span>
                    {f.options ? (
                      <select
                        aria-label={f.label}
                        value={String(s[f.key])}
                        onChange={(e) => patch({ [f.key]: e.target.value })}
                        className="min-h-11 max-w-full rounded-lg border border-border bg-bg px-3"
                      >
                        {f.options.map(([value, label]) => (
                          <option value={value} key={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="checkbox"
                        className="size-6"
                        checked={Boolean(s[f.key])}
                        onChange={(e) => patch({ [f.key]: e.target.checked })}
                      />
                    )}
                  </label>
                ))}
              {g.title === "تخصيص الرئيسية" && (
                <>
                  <h2 className="pt-2 font-medium">الاختصارات (حتى ٨) وترتيبها</h2>
                  {s.shortcuts.map((id, i) => (
                    <div key={id} className="flex items-center gap-2">
                      <span className="flex-1">
                        {SERVICES.find((x) => x.id === id)?.title.ar || id}
                      </span>
                      <button
                        aria-label={`رفع ${id}`}
                        disabled={i === 0}
                        className="min-h-11 min-w-11 border border-border disabled:opacity-40"
                        onClick={() => {
                          const a = [...s.shortcuts];
                          [a[i - 1], a[i]] = [a[i], a[i - 1]];
                          patch({ shortcuts: a });
                        }}
                      >
                        ↑
                      </button>
                      <button
                        aria-label={`خفض ${id}`}
                        disabled={i === s.shortcuts.length - 1}
                        className="min-h-11 min-w-11 border border-border disabled:opacity-40"
                        onClick={() => {
                          const a = [...s.shortcuts];
                          [a[i + 1], a[i]] = [a[i], a[i + 1]];
                          patch({ shortcuts: a });
                        }}
                      >
                        ↓
                      </button>
                      <button
                        disabled={s.shortcuts.length === 1}
                        aria-label={`إزالة ${id}`}
                        className="min-h-11 min-w-11"
                        onClick={() => patch({ shortcuts: s.shortcuts.filter((x) => x !== id) })}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <select
                    aria-label="إضافة اختصار"
                    value=""
                    disabled={s.shortcuts.length >= 8}
                    onChange={(e) => patch({ shortcuts: [...s.shortcuts, e.target.value] })}
                    className="min-h-11 w-full border border-border bg-bg"
                  >
                    <option value="">إضافة اختصار…</option>
                    {SERVICES.filter((x) => !s.shortcuts.includes(x.id)).map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.title.ar}
                      </option>
                    ))}
                  </select>
                  <h2>تبويبات الشريط (الرئيسية ثابتة، حتى ٥)</h2>
                  {[
                    ["/", "الرئيسية"],
                    ["/books", "الكتب"],
                    ["/tools", "الأدوات"],
                    ["/games", "الألعاب"],
                    ["/me", "حسابي"],
                  ].map(([value, label]) => (
                    <label key={value} className="flex min-h-11 items-center gap-3">
                      <input
                        className="size-6"
                        type="checkbox"
                        disabled={value === "/"}
                        checked={s.tabs.includes(value as never)}
                        onChange={(e) =>
                          patch({
                            tabs: (e.target.checked
                              ? [...s.tabs, value]
                              : s.tabs.filter((t) => t !== value)) as Settings["tabs"],
                          })
                        }
                      />
                      {label}
                    </label>
                  ))}
                </>
              )}
              {g.title === "محسن" && (
                <>
                  <AgentSettings />
                  <button className="min-h-11 text-primary" onClick={() => setConfirm("history")}>
                    مسح سجل الأوامر
                  </button>
                </>
              )}
              {g.title === "الطقس والأخبار" && (
                <>
                  <h2>الأقسام المفضلة (الكل عند تركها فارغة)</h2>
                  {NEWS_TOPICS.filter((t) => t !== "الكل").map((t) => (
                    <label key={t} className="flex min-h-11 items-center gap-3">
                      <input
                        className="size-6"
                        type="checkbox"
                        checked={s.newsTopics.includes(t)}
                        onChange={() => toggleList("newsTopics", t)}
                      />
                      {t}
                    </label>
                  ))}
                  <h2>المصادر المفضلة</h2>
                  {NEWS_SOURCES.map((x) => (
                    <label key={x.name} className="flex min-h-11 items-center gap-3">
                      <input
                        className="size-6"
                        type="checkbox"
                        checked={s.newsSources.includes(x.name)}
                        onChange={() => toggleList("newsSources", x.name)}
                      />
                      {x.name}
                    </label>
                  ))}
                </>
              )}
              {g.title === "الخصوصية والبيانات" && (
                <>
                  <button
                    className="min-h-11 w-full text-start text-primary"
                    onClick={exportSettings}
                  >
                    تصدير الإعدادات JSON
                  </button>
                  <label className="block min-h-11">
                    استيراد الإعدادات JSON
                    <input
                      type="file"
                      accept="application/json,.json"
                      className="block max-w-full py-3"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          if (file.size > 20000) throw new Error();
                          const next = parseSettings(JSON.parse(await file.text()));
                          patch(next);
                        } catch {
                          setNotice("ملف إعدادات غير صالح؛ لم تُغيّر إعداداتك");
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <button className="min-h-11 text-danger" onClick={() => setConfirm("clear")}>
                    مسح البيانات المحلية لواحة
                  </button>
                  <p className="text-sm text-muted">
                    يشمل الملاحظات والمهام والتفضيلات. لا يمس الكتب والصور المحلية في IndexedDB أو
                    الحساب.
                  </p>
                </>
              )}
              {g.title === "متقدم" && (
                <>
                  <button className="min-h-11 text-primary" onClick={() => setConfirm("reset")}>
                    إعادة ضبط الإعدادات الافتراضية (ضبط المصنع)
                  </button>
                  {s.developer && (
                    <div className="space-y-2 text-sm">
                      <p>واحة 1.2.1 · جولة محسن · {import.meta.env.MODE}</p>
                      <p>حالة الاتصال: {navigator.onLine ? "متصل" : "دون اتصال"}</p>
                      <button
                        className="min-h-11 text-primary"
                        onClick={async () => {
                          try {
                            const names = await caches.keys();
                            const estimate = await navigator.storage?.estimate();
                            setCacheInfo(
                              `${names.length} ذاكرة مؤقتة · ${Math.round((estimate?.usage || 0) / 1024 / 1024)} MB مستخدمة`,
                            );
                          } catch {
                            setCacheInfo("معلومات التخزين غير متاحة");
                          }
                        }}
                      >
                        فحص الذاكرة المؤقتة والأوفلاين
                      </button>
                      <p>{cacheInfo}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </details>
        ))}
      {confirm && (
        <div
          role="alert"
          className="sticky bottom-20 rounded-2xl border border-danger bg-surface p-4"
        >
          <p>
            تأكيد{" "}
            {confirm === "history"
              ? "مسح سجل الأوامر"
              : confirm === "reset"
                ? "إعادة ضبط الإعدادات"
                : "مسح البيانات المحلية لواحة"}
            ؟ لا يمكن التراجع عن المسح.
          </p>
          <button onClick={destructive} className="min-h-11 px-4 text-danger">
            تأكيد
          </button>
          <button onClick={() => setConfirm(null)} className="min-h-11 px-4">
            إلغاء
          </button>
        </div>
      )}
    </div>
  );
}
