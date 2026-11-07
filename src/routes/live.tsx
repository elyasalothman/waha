import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "@/components/external-link";
import { browserCanPlayHls, MARKET_LIVE_PAGE, MARKET_LIVE_PLAYLIST } from "@/lib/market-live";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "البث المباشر · واحة" },
      {
        name: "description",
        content:
          "تلفزيون هدوء السوق من منضدة السوق. التشغيل داخل واحة صامت حتى تطلبه، وإلا تُفتح صفحة البث نفسها.",
      },
    ],
  }),
  component: LivePage,
});

type PlayState = "idle" | "starting" | "playing" | "unsupported" | "error" | "offline";

function LivePage() {
  const video = useRef<HTMLVideoElement>(null);
  const [online, setOnline] = useState(true);
  const [checked, setChecked] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const [state, setState] = useState<PlayState>("idle");
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  useEffect(() => {
    const node = video.current;
    if (!node) return;
    setCanPlay(browserCanPlayHls(node));
    setChecked(true);
  }, []);
  function start() {
    const node = video.current;
    if (!node) return;
    if (!navigator.onLine) {
      setState("offline");
      return;
    }
    if (!browserCanPlayHls(node)) {
      setState("unsupported");
      return;
    }
    node.muted = true;
    node.src = MARKET_LIVE_PLAYLIST;
    setState("starting");
    const timer = window.setTimeout(() => {
      if (node.paused || node.readyState < 2) setState("error");
    }, 12000);
    void node.play().catch(() => {
      window.clearTimeout(timer);
      setState("error");
    });
    node.onplaying = () => {
      window.clearTimeout(timer);
      setState("playing");
    };
    node.onerror = () => {
      window.clearTimeout(timer);
      setState("error");
    };
  }
  async function fullscreen() {
    const node = video.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (!node) return;
    if (node.requestFullscreen) await node.requestFullscreen().catch(() => undefined);
    else node.webkitEnterFullscreen?.();
  }
  const blocked =
    !online ||
    state === "unsupported" ||
    state === "error" ||
    state === "offline" ||
    (checked && !canPlay);
  return (
    <div className="mx-auto max-w-3xl" dir="rtl">
      <header className="mb-6">
        <p className="kicker-rose text-sm">📺 تلفزيون هدوء السوق</p>
        <h1 className="mt-1 font-display text-4xl">البث المباشر</h1>
        <p className="mt-3 max-w-xl leading-8 text-muted">
          نشرات أسواق من منضدة السوق. المحتوى تعليمي وليس توصية. الصوت لا يبدأ وحده.
        </p>
      </header>
      <div className="waha-card tint-rose overflow-hidden p-0">
        <video
          ref={video}
          className="aspect-video w-full bg-black"
          controls
          muted
          playsInline
          preload="none"
          aria-label="بث تلفزيون هدوء السوق"
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="min-h-11 rounded-full bg-primary px-4 text-primary-fg focus-visible:outline-2"
          onClick={start}
          disabled={!online || state === "starting"}
        >
          {state === "playing" ? "إعادة الاتصال" : "تشغيل البث صامتًا"}
        </button>
        <button
          type="button"
          className="min-h-11 rounded-full border border-border px-4 focus-visible:outline-2"
          onClick={() => void fullscreen()}
          disabled={state !== "playing"}
        >
          ملء الشاشة
        </button>
      </div>
      <p role="status" className="mt-4 text-sm leading-7 text-muted">
        {!online || state === "offline"
          ? "لا يوجد اتصال. البث يحتاج الإنترنت، ولن يُعرض شيء محفوظ بدلًا منه."
          : !checked
            ? "جارٍ فحص دعم البث في هذا المتصفح…"
            : !canPlay || state === "unsupported"
              ? "هذا المتصفح لا يشغّل بث HLS مباشرة. صفحة السوق نفسها تمنع التضمين، وخادم البث لا يأذن بجلب القائمة من نطاق آخر."
              : state === "error"
                ? "تعذّر عرض الصورة داخل واحة. يمكنك فتح صفحة البث على منضدة السوق."
                : state === "playing"
                  ? "الصورة تعمل والصوت مغلق. فعّله من أزرار المشغّل إن رغبت."
                  : state === "starting"
                    ? "جارٍ الاتصال بالبث…"
                    : "جاهز. التشغيل يبدأ عندما تضغط، ويبقى صامتًا."}
      </p>
      {blocked ? (
        <ExternalLink direct href={MARKET_LIVE_PAGE} className="mt-3 inline-flex min-h-11 items-center text-primary">
          فتح البث على منضدة السوق
        </ExternalLink>
      ) : null}
    </div>
  );
}
