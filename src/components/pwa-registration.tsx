import { useEffect, useState } from "react";
import { Button } from "./ui/button";
export function PwaRegistration() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [updating, setUpdating] = useState(false);
  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    let disposed = false,
      registration: ServiceWorkerRegistration | undefined;
    const workers = new Set<ServiceWorker>();
    const warm = () => {
      navigator.serviceWorker.controller?.postMessage({
        type: "WARM_PUBLIC_SHELL",
        urls: [
          location.origin + "/",
          location.href,
          ...performance.getEntriesByType("resource").map((e) => e.name),
        ],
      });
    };
    const check = () => {
      if (disposed || !registration) return;
      if (registration.waiting && navigator.serviceWorker.controller)
        setWaiting(registration.waiting);
      const installing = registration.installing;
      if (installing && !workers.has(installing)) {
        workers.add(installing);
        installing.addEventListener("statechange", check);
      }
    };
    const changed = () => {
      warm();
      check();
    };
    const register = () => {
      void navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then((r) => {
          if (disposed) return;
          registration = r;
          check();
          r.addEventListener("updatefound", check);
          warm();
        })
        .catch(() => {
          /* Browsing works when service workers are unavailable. */
        });
    };
    navigator.serviceWorker.addEventListener("controllerchange", changed);
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => {
      disposed = true;
      window.removeEventListener("load", register);
      navigator.serviceWorker.removeEventListener("controllerchange", changed);
      registration?.removeEventListener("updatefound", check);
      for (const worker of workers) worker.removeEventListener("statechange", check);
    };
  }, []);
  useEffect(() => {
    if (!updating) return;
    const reload = () => window.location.reload();
    navigator.serviceWorker.addEventListener("controllerchange", reload, { once: true });
    waiting?.postMessage({ type: "SKIP_WAITING" });
    return () => navigator.serviceWorker.removeEventListener("controllerchange", reload);
  }, [updating, waiting]);
  if (!waiting) return null;
  return (
    <aside
      role="status"
      className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-lg flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 shadow-lg"
    >
      <p>نسخة جديدة من واحة جاهزة. احفظ عملك قبل التحديث.</p>
      <Button disabled={updating} onClick={() => setUpdating(true)}>
        {updating ? "جارٍ التحديث…" : "تحديث متاح"}
      </Button>
    </aside>
  );
}
