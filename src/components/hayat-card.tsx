import { ArrowUpLeft, Gamepad2 } from "lucide-react";
import { ExternalLink } from "@/components/external-link";
import { getHouseSite } from "@/lib/house-sites";
import { useAppStore } from "@/store/app-store";

export function HayatCard() {
  const lang = useAppStore((s) => s.lang);
  const hayat = getHouseSite("hayat")!;
  return (
    <ExternalLink
      href={hayat.href}
      data-play-hayat
      className="flex min-h-28 items-center gap-4 rounded-2xl border border-primary/40 bg-primary/10 p-5 hover:bg-primary/15"
    >
      <Gamepad2 className="size-9 shrink-0 text-primary" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block font-display text-2xl">
          {lang === "ar" ? "العب حياة" : "Play Hayat"}
        </span>
        <span className="mt-1 block text-sm text-muted">
          {lang === "ar"
            ? "ادخل عالم حياة — تفتح اللعبة في نافذة كاملة."
            : "Step into Hayat — the game opens in a full window."}
        </span>
      </span>
      <ArrowUpLeft className="size-5 shrink-0 text-primary" aria-hidden="true" />
    </ExternalLink>
  );
}
