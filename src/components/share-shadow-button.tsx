import { useState } from "react";
import { Share2 } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";
import { shareShadow, type ShadowShare } from "@/lib/share-shadow";
import { cn } from "@/lib/cn";

export function ShareShadowButton({
  lang,
  payload,
  className,
}: {
  lang: Lang;
  payload: ShadowShare;
  className?: string;
}) {
  const [status, setStatus] = useState<"idle" | "busy" | "done">("idle");

  async function onShare() {
    if (status === "busy") return;
    setStatus("busy");
    try {
      await shareShadow(payload, lang);
      setStatus("done");
      window.setTimeout(() => setStatus("idle"), 1600);
    } catch {
      setStatus("idle");
    }
  }

  return (
    <button
      type="button"
      data-testid="share-shadow"
      onClick={() => void onShare()}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-3 text-sm hover:bg-surface-2",
        className,
      )}
    >
      <Share2 className="size-3.5" strokeWidth={1.75} />
      {status === "done" ? t(lang, "copied") : t(lang, "shareShadow")}
    </button>
  );
}
