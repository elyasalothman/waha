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
  const tried = useRef(false);
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
  function stop(node: HTMLVideoElement) {
    node.pause();
    node.removeAttribute("src");
    node.load();
  }
  function start() {
    const node = video.current;
    if (!node || tried.current) return;
    if (!navigator.onLine) {
      setState("offline");
      return;
    }
    if (!browserCanPlayHls(node)) {
      tried.current = true;
      setState("unsupported");
      return;
    }
    tried.current = true;
    node.muted = true;
    node.src = MARKET_LIVE_PLAYLIST;
    setState("starting");
    let failed = false;
    let timer = 0;
    const fail = () => {
      if (failed) return;
      failed = true;
      window.clearTimeout(timer);
      stop(node);
      setState("error");
    };
    timer = window.setTimeout(() => {
      if (node.error || node.readyState < 2 || node.videoWidth === 0 || node.currentTime <= 0) fail();
      else setState("playing");
    }, 2500);
    node.onerror = fail;
    void node.play().catch(fail);
  }
  async function fullscreen() {
    const node = video.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (!node) return;
    if (node.requestFullscreen) await node.requestFullscreen().catch(() => undefined);
    else node.webkitEnterFullscreen?.();
  }
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
          className="min-h-11 rounded-full bg-primary px-4 text-primary-fg focus-visible:outline-2 disabled:opacity-40"
          onClick={start}
          disabled={!online || !canPlay || tried.current || state === "starting" || state === "playing"}
        >
          تجربة واحدة صامتة
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
          ? "لا يوجد اتصال. لا يُعرض بث محفوظ بدل الصورة."
          : !checked
            ? "جارٍ فحص دعم البث في هذا المتصفح…"
            : !canPlay || state === "unsupported"
              ? "هذا المتصفح لا يشغّل بث HLS داخل واحة. الزر التالي يفتح صفحة منضدة السوق، وليس مشغّلًا هنا."
              : state === "error"
                ? "المحاولة الواحدة لم تُبقِ صورة. البث لا يعمل داخل واحة على هذا المتصفح. الصفحة التالية هي صفحة السوق."
                : state === "playing"
                  ? "الصورة مستمرة في هذه المحاولة والصوت مغلق. إن توقفت، افتح صفحة السوق."
                  : state === "starting"
                    ? "تجربة واحدة صامتة. لن تُعاد تلقائيًا."
                    : "يمكن تجربة التشغيل الصامت مرة واحدة. إن لم تستمر الصورة، افتح صفحة منضدة السوق."}
      </p>
      <ExternalLink direct href={MARKET_LIVE_PAGE} className="mt-3 inline-flex min-h-11 items-center text-primary">
        فتح البث على منضدة السوق
      </ExternalLink>
    </div>
  );
}
