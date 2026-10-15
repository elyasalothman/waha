import { useEffect } from "react";

export function PwaRegistration() {
  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    // Register after load so installation does not compete with the first render.
    const register = () => {
      void navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {
        // Browsing still works when service workers are unavailable (e.g. private mode).
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);
  return null;
}
