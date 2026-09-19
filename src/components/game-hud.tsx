import { useEffect, useState, type ReactNode } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stat } from "@/components/app-stage";
import { isSfxMuted, setSfxMuted } from "@/lib/games/sfx";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/cn";

export function SfxToggle({ className }: { className?: string }) {
  const lang = useAppStore((s) => s.lang);
  const [muted, setMuted] = useState(false);
  useEffect(() => setMuted(isSfxMuted()), []);
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className={className}
      onClick={() => {
        const next = !muted;
        setSfxMuted(next);
        setMuted(next);
      }}
      aria-label={lang === "ar" ? "الصوت" : "Sound"}
    >
      {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      {lang === "ar" ? (muted ? "صامت" : "صوت") : muted ? "Muted" : "Sound"}
    </Button>
  );
}

export function GameHud({
  stats,
  children,
}: {
  stats: { label: string; value: string | number }[];
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {stats.map((s) => (
        <Stat key={s.label} label={s.label} value={s.value} />
      ))}
      <SfxToggle className="ms-auto" />
      {children}
    </div>
  );
}

export function GameOver({
  title,
  body,
  children,
}: {
  title: string;
  body?: string;
  children: ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-bg/80 p-4 text-center">
      <p className="font-display text-2xl">{title}</p>
      {body ? <p className="text-sm text-muted">{body}</p> : null}
      <div className="flex flex-wrap justify-center gap-2">{children}</div>
    </div>
  );
}

export function toneClass(tone?: "correct" | "present" | "absent") {
  return cn(
    tone === "correct" && "border-success bg-success/25 text-fg",
    tone === "present" && "border-warn bg-warn/25 text-fg",
    tone === "absent" && "border-border bg-surface-2 text-muted",
    !tone && "border-border bg-surface",
  );
}
