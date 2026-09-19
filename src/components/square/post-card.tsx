import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Repeat2 } from "lucide-react";
import { getAccount } from "@/lib/square/accounts";
import type { FeedItem } from "@/lib/square/types";
import { formatAgeMinutes, formatElapsed } from "@/lib/square/time";
import { POST_CHAR_LIMIT } from "@/lib/square/store";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { AvatarMark, HouseBadge, SampleStamp } from "./house-badge";
import { MediaWash } from "./media-wash";

export function PostCard({
  item,
  lang,
  now,
  visitorName,
  onLike,
  onEcho,
  onReply,
}: {
  item: FeedItem;
  lang: Lang;
  now: number;
  visitorName: string;
  onLike: () => void;
  onEcho: () => void;
  onReply: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const author = item.author;
  const letter = (lang === "ar" ? author.nameAr : author.nameEn).slice(0, 1);
  const when = item.ageMinutes != null ? formatAgeMinutes(item.ageMinutes, lang) : formatElapsed(item.createdAt, now, lang);
  const replyCount = item.seedReplies.length + item.userReplies.length;

  return (
    <article className="border-b border-border px-1 py-4">
      <div className="flex gap-3">
        <AvatarMark letter={letter} tone={author.tone} house={author.kind === "house"} />
        <div className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium text-fg">{lang === "ar" ? author.nameAr : author.nameEn}</span>
            {author.kind === "house" ? <HouseBadge lang={lang} /> : null}
            {author.kind === "sample" ? <SampleStamp lang={lang} /> : null}
            {item.source === "you" ? (
              <span className="text-[10px] text-subtle">{L("من جهازك", "from this device")}</span>
            ) : null}
            <span className="text-xs text-subtle">{when}</span>
          </header>

          {item.quoteAr ? (
            <blockquote className="mt-3 border-s-2 border-primary/40 ps-3">
              <p className="font-display text-xl leading-relaxed">{lang === "ar" ? item.quoteAr : item.quoteEn}</p>
              {item.quoteAttrAr ? <p className="mt-1 text-xs text-subtle">{lang === "ar" ? item.quoteAttrAr : item.quoteAttrEn}</p> : null}
            </blockquote>
          ) : null}

          <p className="mt-2 text-[15px] leading-relaxed text-fg/95">{lang === "ar" ? item.textAr : item.textEn}</p>

          {item.media ? <MediaWash kind={item.media} className="mt-3" /> : null}

          {item.door ? (
            item.door.appId ? (
              <Link
                to="/app/$id"
                params={{ id: item.door.appId }}
                className="mt-3 flex items-center justify-between rounded-lg border border-border bg-bg/50 px-3 py-2 text-sm hover:bg-surface-2"
              >
                <span>
                  <span className="text-subtle">{L("باب", "Door")}</span>{" "}
                  <span className="font-medium">{lang === "ar" ? item.door.ar : item.door.en}</span>
                </span>
                <span className="text-xs text-muted">{lang === "ar" ? item.door.hintAr : item.door.hintEn}</span>
              </Link>
            ) : (
              <Link
                to="/life"
                className="mt-3 flex items-center justify-between rounded-lg border border-border bg-bg/50 px-3 py-2 text-sm hover:bg-surface-2"
              >
                <span>
                  <span className="text-subtle">{L("باب", "Door")}</span>{" "}
                  <span className="font-medium">{lang === "ar" ? item.door.ar : item.door.en}</span>
                </span>
                <span className="text-xs text-muted">{lang === "ar" ? item.door.hintAr : item.door.hintEn}</span>
              </Link>
            )
          ) : null}

          <footer className="mt-3 flex items-center gap-1 text-muted">
            <Action
              label={L("إعجاب", "Like")}
              active={item.liked}
              count={item.likes}
              onClick={onLike}
            >
              <Heart className={cn("size-4", item.liked && "fill-current")} strokeWidth={1.75} />
            </Action>
            <Action label={L("رد", "Reply")} count={replyCount} onClick={() => setOpen((v) => !v)}>
              <MessageCircle className="size-4" strokeWidth={1.75} />
            </Action>
            <Action label={L("إعادة نشر", "Echo")} active={item.echoed} count={item.echoes} onClick={onEcho}>
              <Repeat2 className="size-4" strokeWidth={1.75} />
            </Action>
          </footer>

          {open || replyCount > 0 ? (
            <div className="mt-3 space-y-2 border-s border-border/80 ps-3">
              {item.seedReplies.map((r) => {
                const who = r.authorId;
                return (
                  <p key={r.id} className="text-sm leading-relaxed text-fg/90">
                    <span className="text-muted">{seedAuthorName(who, lang)} · </span>
                    {lang === "ar" ? r.textAr : r.textEn}
                    <span className="ms-2 text-[11px] text-subtle">{formatAgeMinutes(r.ageMinutes, lang)}</span>
                  </p>
                );
              })}
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

function seedAuthorName(id: string, lang: Lang) {
  const who = getAccount(id);
  return lang === "ar" ? who.nameAr : who.nameEn;
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
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
