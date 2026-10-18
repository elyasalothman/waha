import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
const games: Record<string, { title: string; source: string }> = {
  dallah: { title: "قفز الدلّة", source: "https://games.alhajda.com/qafz-dallah/" },
  "hayat-world": { title: "حياة · عالم مفتوح", source: "https://hayat.alhajda.com/" },
};
export const Route = createFileRoute("/play/$game")({
  head: ({ params }) => ({ meta: [{ title: `${games[params.game]?.title || "ألعاب"} · واحة` }] }),
  component: Play,
});
function Play() {
  const { game } = Route.useParams();
  const item = games[game];
  const [started, setStarted] = useState(false);
  const [full, setFull] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (!item)
    return (
      <div>
        <h1>اللعبة غير موجودة</h1>
        <Link to="/games">ألعاب واحة</Link>
      </div>
    );
  return (
    <section
      className={
        full
          ? "fixed inset-0 z-50 flex flex-col gap-3 overflow-auto bg-bg p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          : "mx-auto max-w-5xl space-y-5"
      }
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">{item.title}</h1>
        {full ? (
          <button
            className="min-h-11 rounded-xl border border-border px-4"
            onClick={() => setFull(false)}
          >
            رجوع لواحة
          </button>
        ) : (
          <Link to="/games" className="min-h-11 content-center text-primary">
            كل الألعاب
          </Link>
        )}
      </header>
      <p className="text-sm leading-7 text-muted">
        لعبة لُمعة داخل واحة. اللعب والحفظ تابعان للعبة على هذا الجهاز، ويحتاج بدء التحميل اتصالًا
        بالإنترنت.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setStarted(true)}
          className="min-h-11 rounded-xl bg-primary px-5 text-primary-fg"
        >
          ابدأ اللعب
        </button>
        <button
          className="min-h-11 rounded-xl border border-border px-4"
          onClick={() => {
            setStarted(true);
            setFull(!full);
          }}
        >
          ملء الشاشة
        </button>
      </div>
      {started && (
        <>
          <p role="status" className="text-sm text-muted">
            {loaded
              ? "إذا لم تظهر اللعبة، أعد تحميل الصفحة أو جرّب عند تحسّن الاتصال."
              : "جارٍ تحميل اللعبة…"}
          </p>
          <iframe
            key={game}
            onLoad={() => setLoaded(true)}
            title={item.title}
            src={item.source}
            sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock"
            allow="fullscreen; gamepad"
            referrerPolicy="strict-origin-when-cross-origin"
            className={
              full
                ? "min-h-96 w-full flex-1 rounded-xl border border-border"
                : "h-[75dvh] min-h-96 w-full rounded-xl border border-border"
            }
          />
        </>
      )}
    </section>
  );
}
