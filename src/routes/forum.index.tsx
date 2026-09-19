import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { boardCounts, readForumDraft } from "@/lib/forum/store";
import { readHiddenPosts } from "@/lib/admin";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/forum/")({ component: ForumIndex });

function ForumIndex() {
  const lang = useAppStore((s) => s.lang);
  const [tick] = useState(0);
  const counts = useMemo(() => {
    const draft = readForumDraft(typeof localStorage === "undefined" ? null : localStorage);
    const hidden = readHiddenPosts(typeof localStorage === "undefined" ? null : localStorage);
    return boardCounts(draft, hidden.forum);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-xs tracking-wide text-muted">{t(lang, "forum")}</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">{t(lang, "forum")}</h1>
      <p className="mt-3 max-w-md text-muted">{t(lang, "forumBlurb")}</p>
      <nav className="mt-8 grid gap-2">
        {counts.map(({ board, count }) => (
          <Link
            key={board.id}
            to="/forum/$board"
            params={{ board: board.id }}
            className="flex min-h-16 items-center justify-between rounded-2xl border border-border bg-surface px-5 hover:bg-surface-2"
          >
            <span>
              <span className="block font-medium">{board.title[lang]}</span>
              <span className="mt-0.5 block text-sm text-muted">{board.blurb[lang]}</span>
            </span>
            <span className="font-mono text-sm tabular-nums text-subtle">{count}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
