import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { usePersistent } from "@/lib/storage";
import { browserUrl } from "@/lib/browser";
export function BrowserApp() {
  const [address, setAddress] = useState("https://ar.wikipedia.org");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  async function open(value: string) {
    try {
      const target = browserUrl(value);
      setUrl(target);
      setAddress(target);
      setError("");
      if (Capacitor.isNativePlatform()) {
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url: target });
      }
    } catch {
      setError("تعذر فتح العنوان. استخدم رابط HTTPS صالحًا.");
    }
  }
  useEffect(() => {
    const pending = sessionStorage.getItem("waha:browser:pending");
    if (pending) {
      sessionStorage.removeItem("waha:browser:pending");
      void open(pending);
    }
  }, []);
  return (
    <div className="space-y-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void open(address);
        }}
      >
        <input
          aria-label="عنوان الموقع"
          dir="ltr"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="min-h-12 min-w-0 flex-1 rounded-xl border border-border bg-surface p-3"
        />
        <button className="min-h-12 rounded-xl bg-primary px-4 text-primary-fg">اذهب</button>
      </form>
      {error && <p role="alert">{error}</p>}
      {url && !Capacitor.isNativePlatform() && (
        <>
          <p className="text-sm text-muted">
            بعض المواقع تمنع التضمين. إذا لم يظهر الموقع يمكنك فتحه في نافذة آمنة.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block min-h-11 text-primary"
          >
            فتح الموقع في نافذة آمنة
          </a>
          <iframe
            title="متصفح واحة"
            src={url}
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-forms"
            className="h-[55vh] w-full rounded-xl border border-border"
          />
        </>
      )}
    </div>
  );
}
