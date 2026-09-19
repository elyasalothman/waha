import { useState } from "react";
import { Button } from "@/components/ui/button";
import { POST_CHAR_LIMIT } from "@/lib/square/store";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { AvatarMark } from "./house-badge";

export function Composer({
  lang,
  name,
  tone,
  onPublish,
  onOpenProfile,
}: {
  lang: Lang;
  name: string;
  tone: string;
  onPublish: (text: string) => void;
  onOpenProfile: () => void;
}) {
  const [text, setText] = useState("");
  const remaining = POST_CHAR_LIMIT - text.length;
  const can = text.trim().length > 0 && text.length <= POST_CHAR_LIMIT;
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  function submit() {
    if (!can) return;
    onPublish(text);
    setText("");
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="flex gap-3">
        <button type="button" onClick={onOpenProfile} className="shrink-0 self-start" aria-label={L("الملف", "Profile")}>
          <AvatarMark letter={name.slice(0, 1)} tone={tone} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted">
            <button type="button" onClick={onOpenProfile} className="hover:text-fg">
              {name}
            </button>
            <span className="text-subtle">{L("يكتب من هذا الجهاز", "writing from this device")}</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
            }}
            maxLength={POST_CHAR_LIMIT + 20}
            rows={3}
            placeholder={L("اكتب في الميدان…", "Write in the Square…")}
            className="min-h-20 w-full resize-none bg-transparent text-[15px] leading-relaxed text-fg outline-none placeholder:text-subtle"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className={cn("font-mono text-xs tabular-nums", remaining < 0 ? "text-danger" : remaining < 20 ? "text-warn" : "text-subtle")}>
              {remaining}
            </p>
            <Button type="button" size="sm" disabled={!can} onClick={submit}>
              {L("انشر", "Post")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
