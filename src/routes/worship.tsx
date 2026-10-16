import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, Suspense, lazy } from "react";
import { featureButton } from "@/lib/share-card";
const Salah = lazy(() => import("@/apps/life/salah").then((m) => ({ default: m.SalahApp })));
const Athkar = lazy(() => import("@/apps/life/athkar").then((m) => ({ default: m.AthkarApp })));
const Qibla = lazy(() => import("@/apps/life/qibla").then((m) => ({ default: m.QiblaApp })));
export const Route = createFileRoute("/worship")({
  head: () => ({
    meta: [
      { title: "تهجد · الصلاة والأذكار والقبلة داخل واحة" },
      {
        name: "description",
        content: "مواقيت الصلاة حسب مدينتك والأذكار والقبلة والمصحف داخل واحة.",
      },
    ],
  }),
  component: Worship,
});
function Worship() {
  const [tab, setTab] = useState("prayer");
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="font-display text-3xl">تهجد داخل واحة</h1>
      <p className="text-muted">مواقيت أم القرى حسب المدينة، وأذكارك والقبلة والمصحف.</p>
      <div className="flex flex-wrap gap-2" aria-label="أدوات العبادة">
        {[
          ["prayer", "مواقيت الصلاة"],
          ["athkar", "الأذكار"],
          ["qibla", "القبلة"],
        ].map(([id, title]) => (
          <button
            key={id}
            className={featureButton}
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
          >
            {title}
          </button>
        ))}
        <Link to="/quran" search={{ surah: 1, ayah: 1 }} className={featureButton}>
          المصحف
        </Link>
      </div>
      <Suspense fallback={<p role="status">جارٍ التحميل…</p>}>
        {tab === "prayer" ? <Salah /> : tab === "athkar" ? <Athkar /> : <Qibla />}
      </Suspense>
    </div>
  );
}
