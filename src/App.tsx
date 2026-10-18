import { lazy, Suspense, useEffect, useState } from "react";
import { FileStack, FileUser, ShieldCheck, WifiOff } from "lucide-react";
import { NavContext, type ToolId } from "./nav";

const PdfStudioApp = lazy(() => import("./tools/pdf-studio").then((m) => ({ default: m.PdfStudioApp })));
const CvBuilderApp = lazy(() => import("./tools/cv-builder").then((m) => ({ default: m.CvBuilderApp })));

const TOOLS = [
  {
    id: "pdf" as const,
    name: "استوديو PDF",
    desc: "ادمج ملفات PDF والصور، رتّب الصفحات ودوّرها واحذفها، استخرج صفحات، وأضف توقيعك وختمًا وأرقام صفحات.",
    Icon: FileStack,
  },
  {
    id: "cv" as const,
    name: "منشئ السيرة الذاتية",
    desc: "سيرة احترافية بالعربية أو الإنجليزية بثلاثة قوالب، تُحفظ تلقائيًا على جهازك وتُصدَّر PDF بجودة الطباعة.",
    Icon: FileUser,
  },
];

const startTool = (): ToolId => {
  const h = window.location.hash.replace("#", "");
  return h === "pdf" || h === "cv" ? h : "home";
};

export function App() {
  const [tool, setTool] = useState<ToolId>(startTool);
  useEffect(() => {
    window.location.hash = tool === "home" ? "" : tool;
    window.scrollTo(0, 0);
    document.title = tool === "home" ? "واحة للكمبيوتر" : `${TOOLS.find((t) => t.id === tool)?.name} · واحة`;
  }, [tool]);

  return (
    <NavContext.Provider value={setTool}>
      <main dir="rtl" className="min-h-dvh px-4 py-6 sm:px-8">
        {tool === "home" ? (
          <Home open={setTool} />
        ) : (
          <Suspense fallback={<p role="status" className="p-6 text-center text-muted">جارٍ فتح الأداة…</p>}>
            {tool === "pdf" ? <PdfStudioApp /> : <CvBuilderApp />}
          </Suspense>
        )}
      </main>
    </NavContext.Provider>
  );
}

function Home({ open }: { open: (t: ToolId) => void }) {
  return (
    <section className="mx-auto max-w-4xl space-y-8 pb-10">
      <header className="flex items-center gap-4">
        <img src="/logo.png" alt="" className="size-16 rounded-2xl shadow-[var(--shadow-soft)]" />
        <div>
          <h1 className="font-display text-4xl">واحة للكمبيوتر</h1>
          <p className="text-muted">أدوات مجانية بديلة للبرامج المدفوعة، تعمل على جهازك.</p>
        </div>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map(({ id, name, desc, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => open(id)}
            className="group space-y-3 rounded-2xl border border-border bg-surface p-5 text-start shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span className="inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-6" aria-hidden="true" />
            </span>
            <h2 className="text-xl font-semibold">{name}</h2>
            <p className="text-sm leading-7 text-muted">{desc}</p>
            <span className="text-sm font-medium text-primary">افتح الأداة ←</span>
          </button>
        ))}
      </div>
      <ul className="flex flex-wrap gap-4 text-xs text-muted">
        <li className="flex items-center gap-1.5">
          <ShieldCheck className="size-4 text-primary" aria-hidden="true" /> ملفاتك لا تغادر جهازك
        </li>
        <li className="flex items-center gap-1.5">
          <WifiOff className="size-4 text-primary" aria-hidden="true" /> تعمل دون إنترنت
        </li>
      </ul>
    </section>
  );
}
