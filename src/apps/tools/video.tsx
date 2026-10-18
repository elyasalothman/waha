import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { featureButton } from "@/lib/share-card";

/** مشهد — منصة الفيديو المستقلة على tube.alhajda.com، تُفتح في متصفح واحة الداخلي. */
export const VIDEO_SITE_URL = "https://tube.alhajda.com/";

export function VideoApp() {
  const navigate = useNavigate();
  const openInBrowser = () => {
    try {
      sessionStorage.setItem("waha:browser:pending", VIDEO_SITE_URL);
    } catch {
      /* private mode: the browser opens on its default page */
    }
    void navigate({ to: "/app/$id", params: { id: "browser" }, replace: true });
  };
  useEffect(() => {
    openInBrowser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="space-y-3 rounded-xl border border-border p-5" data-video-launcher>
      <h2 className="font-display text-2xl">مشهد · فيديو</h2>
      <p className="text-muted">
        أخبار وتعليم وقرآن وتقنية وطبخ ورياضة وأطفال ووثائقيات من قنوات عربية رسمية، تُعرض بمشغّل
        يوتيوب الرسمي، ومقاطع طبيعة حرة الترخيص. سجلّك وإعجاباتك على جهازك فقط.
      </p>
      <div className="flex flex-wrap gap-2">
        <button className={featureButton} onClick={openInBrowser}>
          افتح مشهد في متصفح واحة
        </button>
        <a className={featureButton} href={VIDEO_SITE_URL} target="_blank" rel="noopener noreferrer">
          فتح في نافذة مستقلة
        </a>
      </div>
    </div>
  );
}
