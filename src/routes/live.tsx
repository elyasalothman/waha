import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type Hls from "hls.js";
import { ExternalLink } from "@/components/external-link";
import {
  AVC_AAC_MIME,
  browserCanPlayHls,
  MARKET_LIVE_PAGE,
  MARKET_LIVE_PLAYLIST,
  pictureFollow,
  pictureHeld,
  playbackPlan,
} from "@/lib/market-live";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "البث المباشر · واحة" },
      {
        name: "description",
        content:
          "تلفزيون هدوء السوق. الصورة تبدأ بطلبك، والصوت يبقى مغلقًا حتى تطلبه. استمرار الصورة هو شرط النجاح.",
      },
    ],
  }),
  component: LivePage,
});

type PlayState = "idle" | "starting" | "playing" | "failed" | "offline";

function LivePage() {
  const video = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const attempt = useRef(0);
  const [online, setOnline] = useState(true);
  const [state, setState] = useState<PlayState>("idle");
  const [soundOn, setSoundOn] = useState(false);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, []);
  function stop(node: HTMLVideoElement) {
    hlsRef.current?.destroy();
    hlsRef.current = null;
    node.pause();
    node.removeAttribute("src");
    node.load();
  }
  function giveUp(node: HTMLVideoElement, id: number) {
    if (attempt.current !== id) return;
    attempt.current = id + 1;
    stop(node);
    setState("failed");
  }
  async function hold(node: HTMLVideoElement, id: number) {
    const started = performance.now();
    let marked: number | null = null;
    let confirmed = false;
    let lastMove = { time: 0, at: started };
    while (attempt.current === id) {
      const at = performance.now();
      const sample = {
        time: node.currentTime,
        width: node.videoWidth,
        error: Boolean(node.error),
        ended: node.ended,
      };
      if (!confirmed) {
        if (sample.width > 0 && sample.time > 0 && marked == null) marked = sample.time;
        const verdict = pictureHeld(marked, sample, at - started);
        if (verdict === "playing") {
          confirmed = true;
          lastMove = { time: sample.time, at };
          if (attempt.current !== id) return;
          setState("playing");
        } else if (verdict === "failed" || sample.error || sample.ended) {
          giveUp(node, id);
          return;
        }
      } else {
        const follow = pictureFollow(lastMove, sample, at);
        if (follow === "playing" && sample.time > lastMove.time + 0.2) lastMove = { time: sample.time, at };
        if (follow === "stalled" || follow === "ended") {
          giveUp(node, id);
          return;
        }
      }
      await new Promise((resolve) => window.setTimeout(resolve, 400));
    }
  }
  async function start() {
    const node = video.current;
    if (!node || state === "starting") return;
    if (!navigator.onLine) {
      setState("offline");
      return;
    }
    const id = attempt.current + 1;
    attempt.current = id;
    setSoundOn(false);
    setState("starting");
    stop(node);
    node.muted = true;
    try {
      let readable = false;
      try {
        const response = await fetch(MARKET_LIVE_PLAYLIST, {
          mode: "cors",
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        });
        readable = response.ok;
      } catch {
        readable = false;
      }
      if (attempt.current !== id) return;
      const mse =
        typeof MediaSource !== "undefined" &&
        MediaSource.isTypeSupported(AVC_AAC_MIME);
      const plan = playbackPlan({
        playlistReadable: readable,
        mse,
        nativeHls: browserCanPlayHls(node),
      });
      if (plan === "unavailable") {
        setState("failed");
        return;
      }
      if (plan === "mse") {
        const { default: Hls } = await import("hls.js");
        if (attempt.current !== id) return;
        const hls = new Hls({
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 6,
          maxBufferLength: 12,
          backBufferLength: 10,
        });
        hlsRef.current = hls;
        let recovered = false;
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal || attempt.current !== id) return;
          if (!recovered && data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            recovered = true;
            hls.recoverMediaError();
            return;
          }
          giveUp(node, id);
        });
        hls.loadSource(MARKET_LIVE_PLAYLIST);
        hls.attachMedia(node);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (attempt.current === id) void node.play().catch(() => undefined);
        });
      } else {
        node.src = MARKET_LIVE_PLAYLIST;
        void node.play().catch(() => undefined);
      }
      await hold(node, id);
    } catch {
      giveUp(node, id);
    }
  }
  function sound() {
    const node = video.current;
    if (!node || state !== "playing") return;
    node.muted = false;
    node.volume = 1;
    setSoundOn(true);
    void node.play().catch(() => undefined);
  }
  async function fullscreen() {
    const node = video.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (!node || state !== "playing") return;
    if (node.requestFullscreen) await node.requestFullscreen().catch(() => undefined);
    else node.webkitEnterFullscreen?.();
  }
  return (
    <div className="mx-auto max-w-3xl" dir="rtl">
      <header className="mb-6">
        <p className="kicker-rose text-sm">📺 تلفزيون هدوء السوق</p>
        <h1 className="mt-1 font-display text-4xl">البث المباشر</h1>
        <p className="mt-3 max-w-xl leading-8 text-muted">
          نشرات أسواق من منضدة السوق. المحتوى تعليمي وليس توصية. الصورة لا تبدأ وحدها، والصوت يبقى مغلقًا حتى تطلبه.
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
          onClick={() => void start()}
          disabled={!online || state === "starting"}
        >
          تشغيل الصورة
        </button>
        <button
          type="button"
          className="min-h-11 rounded-full border border-border px-4 focus-visible:outline-2 disabled:opacity-40"
          onClick={sound}
          disabled={state !== "playing"}
        >
          تشغيل الصوت
        </button>
        <button
          type="button"
          className="min-h-11 rounded-full border border-border px-4 focus-visible:outline-2 disabled:opacity-40"
          onClick={() => void fullscreen()}
          disabled={state !== "playing"}
        >
          ملء الشاشة
        </button>
      </div>
      <p role="status" className="mt-4 text-sm leading-7 text-muted">
        {!online || state === "offline"
          ? "لا يوجد اتصال. لا يُعرض بث محفوظ بدل الصورة."
          : state === "starting"
            ? "جارٍ طلب الصورة. لا يُحسب النجاح قبل أن تستمر."
            : state === "playing"
              ? soundOn
                ? "الصورة مستمرة وطلب الصوت أُرسل. هذه الصفحة لا تقيس مستوى صوت المصدر."
                : "الصورة مستمرة والصوت مغلق حتى تضغط تشغيل الصوت."
              : state === "failed"
                ? "لم تستمر صورة من هذا العنوان. فتح الصفحة أو وصول قائمة التشغيل لا يكفي."
                : "اضغط تشغيل الصورة. النجاح هو صورة تستمر، لا مجرد فتح الصفحة."}
      </p>
      <p className="mt-3 text-sm leading-7 text-muted">
        الرابط التالي صفحة المصدر. فتحه لا يعني أن المشغّل هنا نجح.
      </p>
      <ExternalLink direct href={MARKET_LIVE_PAGE} className="mt-1 inline-flex min-h-11 items-center text-primary">
        صفحة البث على منضدة السوق
      </ExternalLink>
    </div>
  );
}
