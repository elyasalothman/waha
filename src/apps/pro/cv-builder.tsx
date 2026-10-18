import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, Printer, FileDown, FileUp, Sparkles, Eye, Pencil } from "lucide-react";
import { ProShell, Panel, proButton, proPrimary, proField } from "./shell";
import { saveBlob, stamp } from "@/lib/pro/files";
import {
  CV_ACCENTS,
  CV_KEY,
  CV_LABELS,
  CV_TEMPLATES,
  emptyCv,
  emptyEntry,
  filledEntries,
  lines,
  normalizeCv,
  sampleCv,
  splitList,
  type Cv,
  type CvEntry,
} from "@/lib/pro/cv";

const PRINT_CSS = `
@page { size: A4; margin: 0; }
@media print {
  html, body { background: #fff !important; }
  body > *:not(#waha-cv-print) { display: none !important; }
  #waha-cv-print { display: block !important; }
  #waha-cv-print .cv-sheet { box-shadow: none !important; margin: 0 !important; }
}
#waha-cv-print { display: none; }
.cv-sheet { width: 210mm; min-height: 297mm; background: #fff; color: #1f2937; font-family: "IBM Plex Sans Arabic", "Noto Naskh Arabic", system-ui, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.cv-sheet h1, .cv-sheet h2, .cv-sheet h3, .cv-sheet p { margin: 0; }
.cv-sheet ul { margin: 4px 0 0; padding-inline-start: 18px; }
.cv-sheet li { margin: 2px 0; }
`;

export function CvBuilderApp() {
  const [cv, setCv] = useState<Cv>(emptyCv);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [msg, setMsg] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CV_KEY);
      if (saved) setCv(normalizeCv(JSON.parse(saved)));
    } catch {
      /* start empty */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(CV_KEY, JSON.stringify(cv));
    } catch {
      setMsg("تعذّر الحفظ التلقائي على هذا المتصفح. صدّر نسخة احتياطية.");
    }
  }, [cv, ready]);

  const set = (p: Partial<Cv>) => setCv((c) => ({ ...c, ...p }));
  const setEntry = (key: "experience" | "education", i: number, p: Partial<CvEntry>) =>
    setCv((c) => ({ ...c, [key]: c[key].map((e, j) => (j === i ? { ...e, ...p } : e)) }));

  function print() {
    if (!cv.name.trim()) {
      setMsg("اكتب اسمك أولًا ثم احفظ السيرة.");
      return;
    }
    setMsg("");
    const before = document.title;
    document.title = `${cv.name.trim()} - CV`;
    window.print();
    setTimeout(() => (document.title = before), 500);
  }

  async function importJson(f: File | undefined) {
    if (!f) return;
    try {
      setCv(normalizeCv(JSON.parse(await f.text())));
      setMsg("تم استيراد السيرة.");
    } catch {
      setMsg("الملف ليس نسخة سيرة صالحة من واحة.");
    }
    if (importRef.current) importRef.current.value = "";
  }

  return (
    <ProShell
      title="منشئ السيرة الذاتية"
      subtitle="سيرة ذاتية احترافية بالعربية أو الإنجليزية بثلاثة قوالب وألوان، تُحفظ تلقائيًا على جهازك، واحفظها PDF بجودة الطباعة دون اشتراك ولا علامة مائية."
    >
      <style>{PRINT_CSS}</style>
      <div className="grid grid-cols-2 gap-2 sm:hidden" role="tablist" aria-label="عرض">
        <button
          role="tab"
          aria-selected={tab === "edit"}
          className={`${proButton} ${tab === "edit" ? "!bg-primary !text-primary-fg" : ""}`}
          onClick={() => setTab("edit")}
        >
          <Pencil className="size-4" /> تعديل
        </button>
        <button
          role="tab"
          aria-selected={tab === "preview"}
          className={`${proButton} ${tab === "preview" ? "!bg-primary !text-primary-fg" : ""}`}
          onClick={() => setTab("preview")}
        >
          <Eye className="size-4" /> معاينة
        </button>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className={`min-w-0 space-y-4 ${tab === "preview" ? "hidden sm:block" : ""}`}>
          <Panel title="القالب">
            <div className="flex flex-wrap gap-2" role="group" aria-label="القالب">
              {CV_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  aria-pressed={cv.template === t.id}
                  className={`${proButton} ${cv.template === t.id ? "!bg-primary !text-primary-fg" : ""}`}
                  onClick={() => set({ template: t.id })}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm">اللون</span>
              {CV_ACCENTS.map((a) => (
                <button
                  key={a}
                  aria-label={`لون ${a}`}
                  aria-pressed={cv.accent === a}
                  onClick={() => set({ accent: a })}
                  className={`size-9 rounded-full border-2 ${cv.accent === a ? "border-fg" : "border-transparent"}`}
                  style={{ background: a }}
                />
              ))}
            </div>
            <div className="flex gap-2" role="group" aria-label="لغة السيرة">
              <button
                aria-pressed={cv.lang === "ar"}
                className={`${proButton} flex-1 ${cv.lang === "ar" ? "!bg-primary !text-primary-fg" : ""}`}
                onClick={() => set({ lang: "ar" })}
              >
                عربية
              </button>
              <button
                aria-pressed={cv.lang === "en"}
                className={`${proButton} flex-1 ${cv.lang === "en" ? "!bg-primary !text-primary-fg" : ""}`}
                onClick={() => set({ lang: "en" })}
              >
                English
              </button>
            </div>
            {!cv.name && (
              <button className={proButton} onClick={() => setCv(sampleCv())}>
                <Sparkles className="size-4" /> املأ بمثال توضيحي
              </button>
            )}
          </Panel>
          <Panel title="البيانات الأساسية">
            <Field label="الاسم الكامل" value={cv.name} onChange={(v) => set({ name: v })} />
            <Field
              label="المسمى أو التخصص"
              value={cv.headline}
              onChange={(v) => set({ headline: v })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Field label="الجوال" value={cv.phone} onChange={(v) => set({ phone: v })} ltr />
              <Field label="المدينة" value={cv.city} onChange={(v) => set({ city: v })} />
            </div>
            <Field label="البريد" value={cv.email} onChange={(v) => set({ email: v })} ltr />
            <Field
              label="رابط (لينكدإن أو معرض أعمال)"
              value={cv.link}
              onChange={(v) => set({ link: v })}
              ltr
            />
            <Field
              label="نبذة مختصرة"
              value={cv.summary}
              onChange={(v) => set({ summary: v })}
              multiline
            />
          </Panel>
          <EntriesEditor
            title="الخبرات"
            items={cv.experience}
            titleLabel="المسمى الوظيفي"
            orgLabel="الجهة"
            onChange={(i, p) => setEntry("experience", i, p)}
            onAdd={() => set({ experience: [...cv.experience, emptyEntry()] })}
            onRemove={(i) => set({ experience: cv.experience.filter((_, j) => j !== i) })}
          />
          <EntriesEditor
            title="التعليم"
            items={cv.education}
            titleLabel="الدرجة أو التخصص"
            orgLabel="الجامعة أو المدرسة"
            onChange={(i, p) => setEntry("education", i, p)}
            onAdd={() => set({ education: [...cv.education, emptyEntry()] })}
            onRemove={(i) => set({ education: cv.education.filter((_, j) => j !== i) })}
          />
          <Panel title="المهارات واللغات">
            <Field
              label="المهارات (افصل بفاصلة)"
              value={cv.skills}
              onChange={(v) => set({ skills: v })}
              multiline
            />
            <Field label="اللغات" value={cv.languages} onChange={(v) => set({ languages: v })} />
            <Field
              label="الشهادات والدورات (سطر لكل شهادة)"
              value={cv.certificates}
              onChange={(v) => set({ certificates: v })}
              multiline
            />
          </Panel>
        </div>
        <div className={`min-w-0 space-y-3 ${tab === "edit" ? "hidden sm:block" : ""}`}>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface-2 p-2">
            <ScaledSheet cv={cv} />
          </div>
        </div>
      </div>
      <Panel title="الحفظ">
        <button className={`${proPrimary} w-full`} onClick={print}>
          <Printer className="size-5" aria-hidden="true" /> احفظ PDF أو اطبع
        </button>
        <p className="text-xs leading-6 text-muted">
          من نافذة الطباعة اختر «حفظ كملف PDF». على الآيفون: اضغط مشاركة ثم «حفظ في الملفات».
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            className={proButton}
            onClick={() =>
              saveBlob(
                new Blob([JSON.stringify(cv, null, 2)], { type: "application/json" }),
                `waha-cv-${stamp()}.json`,
              )
            }
          >
            <FileDown className="size-4" /> نسخة احتياطية
          </button>
          <label className={`${proButton} cursor-pointer`}>
            <FileUp className="size-4" /> استيراد نسخة
            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(e) => importJson(e.target.files?.[0])}
            />
          </label>
        </div>
        <button
          className="text-sm text-muted underline"
          onClick={() => {
            if (confirm("مسح كل بيانات السيرة من هذا الجهاز؟")) setCv(emptyCv());
          }}
        >
          مسح السيرة
        </button>
        {msg && (
          <p role="status" className="text-sm text-primary">
            {msg}
          </p>
        )}
      </Panel>
      {ready &&
        typeof document !== "undefined" &&
        createPortal(
          <div id="waha-cv-print">
            <CvSheet cv={cv} />
          </div>,
          document.body,
        )}
    </ProShell>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
  ltr,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  ltr?: boolean;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span>{label}</span>
      {multiline ? (
        <textarea
          className={`${proField} min-h-24`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={proField}
          value={value}
          dir={ltr ? "ltr" : "auto"}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

function EntriesEditor({
  title,
  items,
  titleLabel,
  orgLabel,
  onChange,
  onAdd,
  onRemove,
}: {
  title: string;
  items: CvEntry[];
  titleLabel: string;
  orgLabel: string;
  onChange: (i: number, p: Partial<CvEntry>) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <Panel title={title}>
      {items.map((e, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-border p-3">
          <Field label={titleLabel} value={e.title} onChange={(v) => onChange(i, { title: v })} />
          <div className="grid grid-cols-2 gap-2">
            <Field label={orgLabel} value={e.org} onChange={(v) => onChange(i, { org: v })} />
            <Field label="الفترة" value={e.period} onChange={(v) => onChange(i, { period: v })} />
          </div>
          <Field
            label="الإنجازات والمهام (سطر لكل نقطة)"
            value={e.details}
            onChange={(v) => onChange(i, { details: v })}
            multiline
          />
          <button className={proButton} onClick={() => onRemove(i)}>
            <Trash2 className="size-4" /> حذف
          </button>
        </div>
      ))}
      <button className={proButton} onClick={onAdd}>
        <Plus className="size-4" /> أضف
      </button>
    </Panel>
  );
}

/** Fit the A4 sheet into the preview column. */
function ScaledSheet({ cv }: { cv: Cv }) {
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.5);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setK(el.clientWidth / 794));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} dir="ltr" className="w-full overflow-hidden" style={{ height: 1123 * k }} aria-label="معاينة السيرة">
      <div style={{ transform: `scale(${k})`, transformOrigin: "top left", width: 794 }}>
        <div className="shadow-lg">
          <CvSheet cv={cv} />
        </div>
      </div>
    </div>
  );
}

function CvSheet({ cv }: { cv: Cv }) {
  const L = CV_LABELS[cv.lang];
  const dir = cv.lang === "ar" ? "rtl" : "ltr";
  const exp = filledEntries(cv.experience);
  const edu = filledEntries(cv.education);
  const skills = splitList(cv.skills);
  const langs = splitList(cv.languages);
  const certs = lines(cv.certificates);
  const contact = [cv.phone, cv.email, cv.city, cv.link].filter((x) => x.trim());
  const H2 = ({ children }: { children: React.ReactNode }) => (
    <h2
      style={{
        color: cv.accent,
        fontSize: 15,
        fontWeight: 700,
        borderBottom: `2px solid ${cv.accent}22`,
        paddingBottom: 4,
        marginBottom: 8,
        marginTop: 18,
      }}
    >
      {children}
    </h2>
  );
  const Entries = ({ list }: { list: CvEntry[] }) => (
    <>
      {list.map((e, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <strong style={{ fontSize: 13.5 }}>{e.title}</strong>
            <span style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>{e.period}</span>
          </div>
          {e.org && <div style={{ fontSize: 12.5, color: cv.accent }}>{e.org}</div>}
          {lines(e.details).length > 0 && (
            <ul style={{ fontSize: 12.5, lineHeight: 1.7 }}>
              {lines(e.details).map((l, j) => (
                <li key={j}>{l}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </>
  );
  const Main = () => (
    <>
      {cv.summary.trim() && (
        <>
          <H2>{L.summary}</H2>
          <p style={{ fontSize: 13, lineHeight: 1.8 }}>{cv.summary}</p>
        </>
      )}
      {exp.length > 0 && (
        <>
          <H2>{L.experience}</H2>
          <Entries list={exp} />
        </>
      )}
      {edu.length > 0 && (
        <>
          <H2>{L.education}</H2>
          <Entries list={edu} />
        </>
      )}
    </>
  );
  const Side = ({ light }: { light?: boolean }) => (
    <>
      {skills.length > 0 && (
        <>
          <H2>{L.skills}</H2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {skills.map((s) => (
              <span
                key={s}
                style={{
                  fontSize: 12,
                  padding: "3px 9px",
                  borderRadius: 999,
                  background: light ? "#ffffff" : `${cv.accent}14`,
                  color: "#1f2937",
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </>
      )}
      {langs.length > 0 && (
        <>
          <H2>{L.languages}</H2>
          <ul style={{ fontSize: 12.5, lineHeight: 1.7 }}>
            {langs.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </>
      )}
      {certs.length > 0 && (
        <>
          <H2>{L.certificates}</H2>
          <ul style={{ fontSize: 12.5, lineHeight: 1.7 }}>
            {certs.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </>
      )}
    </>
  );
  const Name = () => (
    <>
      <h1
        style={{ fontSize: cv.template === "compact" ? 26 : 30, fontWeight: 800, color: "#111827" }}
      >
        {cv.name || (cv.lang === "ar" ? "اسمك هنا" : "Your name")}
      </h1>
      {cv.headline && (
        <p style={{ fontSize: 15, color: cv.accent, marginTop: 4, fontWeight: 600 }}>
          {cv.headline}
        </p>
      )}
    </>
  );
  const Contact = ({ column }: { column?: boolean }) => (
    <div
      style={{
        display: "flex",
        flexDirection: column ? "column" : "row",
        flexWrap: "wrap",
        gap: column ? 6 : "4px 16px",
        fontSize: 12.5,
        color: "#4b5563",
        marginTop: column ? 0 : 10,
      }}
    >
      {contact.map((c) => (
        <span key={c} dir="auto">
          {c}
        </span>
      ))}
    </div>
  );
  if (cv.template === "modern")
    return (
      <div
        className="cv-sheet"
        dir={dir}
        style={{ display: "grid", gridTemplateColumns: "34% 66%" }}
      >
        <aside
          style={{
            background: `${cv.accent}10`,
            padding: "36px 22px",
            borderInlineEnd: `4px solid ${cv.accent}`,
          }}
        >
          <H2>{L.contact}</H2>
          <Contact column />
          <Side light />
        </aside>
        <main style={{ padding: "36px 30px" }}>
          <Name />
          <Main />
        </main>
      </div>
    );
  if (cv.template === "compact")
    return (
      <div className="cv-sheet" dir={dir} style={{ padding: "30px 36px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 16,
            borderBottom: `3px solid ${cv.accent}`,
            paddingBottom: 12,
          }}
        >
          <div>
            <Name />
          </div>
          <Contact column />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 26 }}>
          <div>
            <Main />
          </div>
          <div>
            <Side />
          </div>
        </div>
      </div>
    );
  return (
    <div className="cv-sheet" dir={dir} style={{ padding: "40px 46px" }}>
      <div
        style={{ textAlign: "center", borderBottom: `3px solid ${cv.accent}`, paddingBottom: 14 }}
      >
        <Name />
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Contact />
        </div>
      </div>
      <Main />
      <Side />
    </div>
  );
}
