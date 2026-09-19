import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { getForumBoard, isForumBoardId } from "@/lib/forum/boards";
import {
  createTopic,
  readForumDraft,
  replyCount,
  topicsForBoard,
  writeForumDraft,
} from "@/lib/forum/store";
import { readHiddenPosts } from "@/lib/admin";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/forum/$board/")({ component: ForumBoardPage });

function ForumBoardPage() {
  const lang = useAppStore((s) => s.lang);
  const { board: boardId } = Route.useParams();
  const board = isForumBoardId(boardId) ? getForumBoard(boardId) : undefined;
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState(false);
  const [rev, setRev] = useState(0);

  const topics = useMemo(() => {
    if (!board) return [];
    const draft = readForumDraft(typeof localStorage === "undefined" ? null : localStorage);
    const hidden = readHiddenPosts(typeof localStorage === "undefined" ? null : localStorage);
    return topicsForBoard(board.id, draft, hidden.forum).map((topic) => ({
      topic,
      replies: replyCount(topic.id, draft),
    }));
  }, [board, rev]);

  if (!board) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-muted">{t(lang, "empty")}</p>
        <Link to="/forum" className="mt-4 inline-block text-sm text-primary">
          {t(lang, "forum")}
        </Link>
      </div>
    );
  }

  const currentBoard = board;

  function publish() {
    const storage = typeof localStorage === "undefined" ? null : localStorage;
    const draft = readForumDraft(storage);
    const next = createTopic(currentBoard.id, title, body, draft);
    if ("error" in next) {
      setError(true);
      return;
    }
    writeForumDraft(next.draft, storage);
    setTitle("");
    setBody("");
    setError(false);
    setRev((n) => n + 1);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/forum" className="text-sm text-muted hover:text-fg">
        {t(lang, "forum")}
      </Link>
      <h1 className="mt-3 font-display text-4xl tracking-tight">{board.title[lang]}</h1>
      <p className="mt-2 text-muted">{board.blurb[lang]}</p>

      <section className="mt-8 rounded-2xl border border-border bg-surface p-4">
        <p className="text-sm text-muted">{t(lang, "newTopic")}</p>
        <Input
          className="mt-3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={lang === "ar" ? "عنوان هادئ" : "A quiet title"}
        />
        <Textarea
          className="mt-2 min-h-24"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={lang === "ar" ? "اكتب بتمهّل…" : "Write slowly…"}
        />
        {error ? <p className="mt-2 text-sm text-danger">{t(lang, "empty")}</p> : null}
        <Button className="mt-3" type="button" onClick={publish}>
          {t(lang, "add")}
        </Button>
      </section>

      <ol className="mt-8 grid gap-2">
        {topics.map(({ topic, replies }) => (
          <li key={topic.id}>
            <Link
              to="/forum/$board/$topicId"
              params={{ board: currentBoard.id, topicId: topic.id }}
              className="block rounded-2xl border border-border bg-surface px-5 py-4 hover:bg-surface-2"
            >
              <p className="font-medium leading-snug">{topic.title}</p>
              <p className="mt-2 line-clamp-2 text-sm text-muted">{topic.body}</p>
              <p className="mt-3 text-xs text-subtle">
                {topic.author.name}
                <span className="mx-2">·</span>
                {replies} {t(lang, "replies")}
              </p>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
