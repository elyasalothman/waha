import { useState, type ReactNode } from "react";
import { Heart, MessageCircle } from "lucide-react";
import type { FeedItem } from "@/lib/square/types";
import { formatElapsed } from "@/lib/square/time";
import { POST_CHAR_LIMIT } from "@/lib/square/store";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { AvatarMark, HouseBadge, SampleStamp } from "./house-badge";
import { VisualWash } from "./visual-wash";

export function PostCard({
  item,
  lang,
  now,
  visitorName,
  onLike,
  onReply,
}: {
  item: FeedItem;
  lang: Lang;
  now: number;
  visitorName: string;
  onLike: () => void;
  onReply: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const author = item.author;
  const letter = (lang === "ar" ? author.nameAr : author.nameEn).slice(0, 1);
  const when = item.relativeTime ?? formatElapsed(item.createdAt, now, lang);
  const replyCount = item.userReplies.length;
  const href = author.href;

  return (
    <article className="border-b border-border px-1 py-4">
      <div className="flex gap-3">
        <AvatarMark letter={letter} tone={author.tone} house={author.kind === "house"} />
        <div className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {href ? (
              <a href={href} className="font-medium text-fg hover:underline">
                {item.source === "seed" ? author.nameAr : lang === "ar" ? author.nameAr : author.nameEn}
              </a>
            ) : (
              <span className="font-medium text-fg">
                {item.source === "seed" ? author.nameAr : lang === "ar" ? author.nameAr : author.nameEn}
              </span>
            )}
            {item.badge === "بيت" || author.kind === "house" ? <HouseBadge lang={lang} /> : null}
            {item.badge === "عيّنة" || author.kind === "sample" ? <SampleStamp lang={lang} /> : null}
            {item.source === "you" ? (
              <span className="text-[10px] text-subtle">{L("من جهازك", "from this device")}</span>
            ) : null}
            <span className="text-xs text-subtle">{author.handle}</span>
            <span className="text-xs text-subtle">{when}</span>
          </header>

          <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-fg/95">{item.text}</p>

          {item.visual ? <VisualWash visual={item.visual} className="mt-3" /> : null}

          <footer className="mt-3 flex items-center gap-1 text-muted">
            <Action label={L("إعجاب", "Like")} active={item.liked} count={item.likes} onClick={onLike}>
              <Heart className={cn("size-4", item.liked && "fill-current")} strokeWidth={1.75} />
            </Action>
            <Action label={L("رد", "Reply")} count={replyCount} onClick={() => setOpen((v) => !v)}>
              <MessageCircle className="size-4" strokeWidth={1.75} />
            </Action>
          </footer>

          {open || replyCount > 0 ? (
            <div className="mt-3 space-y-2 border-s border-border/80 ps-3">
              {item.userReplies.map((r) => (
                <p key={r.id} className="text-sm leading-relaxed text-fg/90">
                  <span className="text-muted">{r.authorName} · </span>
                  {r.text}
                  <span className="ms-2 text-[11px] text-subtle">{formatElapsed(r.createdAt, now, lang)}</span>
                </p>
              ))}
              {open ? (
                <div className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (!draft.trim()) return;
                        onReply(draft);
                        setDraft("");
                      }
                    }}
                    maxLength={POST_CHAR_LIMIT}
                    placeholder={L(`ردّ باسم ${visitorName}…`, `Reply as ${visitorName}…`)}
                    className="h-10 flex-1 rounded-md border border-border bg-bg px-3 text-sm outline-none placeholder:text-subtle"
                  />
                  <button
                    type="button"
                    className="h-10 rounded-md px-3 text-sm text-primary hover:bg-surface-2 disabled:opacity-40"
                    disabled={!draft.trim()}
                    onClick={() => {
                      onReply(draft);
                      setDraft("");
                    }}
                  >
                    {L("رد", "Reply")}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function Action({
  label,
  count,
  active,
  onClick,
  children,
}: {
  label: string;
  count: number;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-xs hover:bg-surface-2 hover:text-fg",
        active && "text-primary",
      )}
    >
      {children}
      {count > 0 ? <span className="tabular-nums">{count}</span> : null}
    </button>
  );
}
