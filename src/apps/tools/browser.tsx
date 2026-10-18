import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { usePersistent } from "@/lib/storage";
import { browserUrl } from "@/lib/browser";
type Tab = { entries: string[]; index: number };
export function BrowserApp() {
  const [address, setAddress] = useState("https://ar.wikipedia.org");
  const [tabs, setTabs] = useState<Tab[]>([{ entries: [], index: -1 }]);
  const [active, setActive] = useState(0);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState("");
  const [history, setHistory, ready] = usePersistent<string[]>("waha:browser:history", []);
  const [favorites, setFavorites, favoritesReady] = usePersistent<string[]>(
    "waha:browser:favorites",
    [],
  );
  const [panel, setPanel] = useState<"history" | "favorites" | null>(null);
  const tab = tabs[active],
    url = tab.entries[tab.index] || "";
  async function nativeOpen(target: string) {
    if (Capacitor.isNativePlatform()) {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url: target });
    }
  }
  async function open(value: string) {
    try {
      const target = browserUrl(value);
      setTabs((all) =>
        all.map((t, i) =>
          i === active
            ? { entries: [...t.entries.slice(0, t.index + 1), target], index: t.index + 1 }
            : t,
        ),
      );
      setAddress(target);
      setError("");
      if (ready) setHistory((h) => [target, ...h.filter((u) => u !== target)].slice(0, 100));
      await nativeOpen(target);
    } catch {
      setError("تعذر فتح العنوان. استخدم رابط HTTPS صالحًا.");
    }
  }
  useEffect(() => {
    if (!ready) return;
    const pending = sessionStorage.getItem("waha:browser:pending");
    if (pending) {
      sessionStorage.removeItem("waha:browser:pending");
      void open(pending);
    }
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps
  function move(delta: number) {
    const index = tab.index + delta;
    if (index < 0 || index >= tab.entries.length) return;
    setTabs((all) => all.map((t, i) => (i === active ? { ...t, index } : t)));
    setAddress(tab.entries[index]);
    void nativeOpen(tab.entries[index]).catch(() => setError("تعذر فتح الصفحة."));
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" aria-label="التبويبات">
        {tabs.map((t, i) => (
          <div key={i} className="flex rounded-xl border border-border">
            <button
              aria-pressed={i === active}
              className="min-h-11 px-3"
              onClick={() => {
                setActive(i);
                setAddress(t.entries[t.index] || "https://ar.wikipedia.org");
              }}
            >
              تبويب {i + 1}
            </button>
            {tabs.length > 1 && (
              <button
                aria-label={`إغلاق تبويب ${i + 1}`}
                className="min-h-11 px-3"
                onClick={() => {
                  setTabs((all) => all.filter((_, n) => n !== i));
                  setActive(0);
                  setAddress(tabs[i === 0 ? 1 : 0].entries.at(-1) || "https://ar.wikipedia.org");
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          disabled={tabs.length >= 8}
          className="min-h-11 px-3"
          onClick={() => {
            setTabs([...tabs, { entries: [], index: -1 }]);
            setActive(tabs.length);
            setAddress("https://ar.wikipedia.org");
          }}
        >
          تبويب جديد +
        </button>
      </div>
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
        <button disabled={!ready} className="min-h-12 rounded-xl bg-primary px-4 text-primary-fg">
          اذهب
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        {[
          ["رجوع", -1],
          ["تقدم", 1],
        ].map(([label, d]) => (
          <button
            key={label}
            className="min-h-11 rounded-xl border border-border px-3 disabled:opacity-40"
            disabled={d === -1 ? tab.index <= 0 : tab.index >= tab.entries.length - 1}
            onClick={() => move(Number(d))}
          >
            {label}
          </button>
        ))}
        <button
          className="min-h-11 px-3"
          disabled={!url}
          onClick={() => {
            setReload((n) => n + 1);
            void nativeOpen(url).catch(() => setError("تعذر التحديث"));
          }}
        >
          تحديث
        </button>
        <button
          className="min-h-11 px-3"
          disabled={!url || !favoritesReady}
          onClick={() =>
            setFavorites((f) => (f.includes(url) ? f.filter((u) => u !== url) : [...f, url]))
          }
        >
          {favorites.includes(url) ? "★ محفوظ" : "☆ حفظ"}
        </button>
        <button
          className="min-h-11 px-3"
          onClick={() => setPanel(panel === "favorites" ? null : "favorites")}
        >
          المفضلة
        </button>
        <button
          className="min-h-11 px-3"
          onClick={() => setPanel(panel === "history" ? null : "history")}
        >
          السجل
        </button>
      </div>
      {panel && (
        <section className="space-y-2 rounded-xl border border-border p-3">
          <h2>{panel === "history" ? "السجل المحلي" : "المفضلة"}</h2>
          <button
            className="min-h-11 text-primary"
            onClick={() => (panel === "history" ? setHistory([]) : setFavorites([]))}
          >
            مسح {panel === "history" ? "السجل" : "المفضلة"}
          </button>
          {(panel === "history" ? history : favorites).map((u) => (
            <button
              key={u}
              dir="ltr"
              className="block min-h-11 w-full break-all text-start text-sm"
              onClick={() => void open(u)}
            >
              {u}
            </button>
          ))}
        </section>
      )}
      {error && <p role="alert">{error}</p>}
      {url && !Capacitor.isNativePlatform() && (
        <>
          <p className="text-sm text-muted">
            قد يمنع الموقع التضمين. روابطه الداخلية لا تغيّر شريط عنوان واحة؛ استخدم الشريط للتنقل
            المسجّل.
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
            key={`${url}:${reload}`}
            title="متصفح واحة"
            src={url}
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-forms"
            className="h-[55vh] w-full rounded-xl border border-border"
          />
        </>
      )}
      {!url && (
        <p className="rounded-xl bg-surface p-5 text-muted">
          اكتب عنوانًا لبدء التصفح. السجل والمفضلة على هذا الجهاز؛ صفحات المواقع تحتاج اتصالًا.
        </p>
      )}
    </div>
  );
}
