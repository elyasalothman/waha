import { useEffect, useState } from "react";
import { formatLiveStamp, lastSuccessfulFetch, readLiveStamp } from "@/lib/live-stamp";
import { t, type Lang } from "@/lib/i18n";

export function OfflineBanner({ lang }: { lang: Lang }) {
  const [online, setOnline] = useState(true);
  const [stamp, setStamp] = useState<number | null>(null);

  useEffect(() => {
    const sync = () => {
      setOnline(typeof navigator === "undefined" ? true : navigator.onLine);
      const last = lastSuccessfulFetch(
        readLiveStamp(typeof localStorage === "undefined" ? null : localStorage),
      );
      setStamp(last);
    };
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      className="mb-4 rounded-lg border border-warn/40 bg-surface px-3 py-2 text-sm text-muted"
    >
      <span className="font-medium text-fg">{t(lang, "offline")}</span>
      {stamp ? (
        <span>
          {" · "}
          {t(lang, "lastUpdated")} {formatLiveStamp(stamp, lang)}
        </span>
      ) : null}
    </div>
  );
}
