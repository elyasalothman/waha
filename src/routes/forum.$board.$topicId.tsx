import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { getForumBoard, isForumBoardId } from "@/lib/forum/boards";
import { createReply, findTopic, readForumDraft, repliesFor, writeForumDraft } from "@/lib/forum/store";
import { readHiddenPosts } from "@/lib/admin";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/forum/$board/$topicId")({ component: ForumTopicPage });

function ForumTopicPage() {
  const lang = useAppStore((s) => s.lang);
  const { board: boardId, topicId } = Route.useParams();
  const board = isForumBoardId(boardId) ? getForumBoard(boardId) : undefined;
  const [body, setBody] = useState("");
  const [rev, setRev] = useState(0);

  const data = useMemo(() => {
    const storage = typeof localStorage === "undefined" ? null : localStorage;
    const draft = readForumDraft(storage);
    const hidden = readHiddenPosts(storage);
    return {
      topic: findTopic(topicId, draft, hidden.forum),
      replies: repliesFor(topicId, draft),
    };
  }, [topicId, rev]);

  if (!board || !data.topic) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-muted">{t(lang, "empty")}</p>
        <Link to="/forum" className="mt-4 inline-block text-sm text-primary">
          {t(lang, "forum")}
        </Link>
      </div>
    );
  }

  function send() {
    const storage = typeof localStorage === "undefined" ? null : localStorage;
    const draft = readForumDraft(storage);
    const next = createReply(topicId, body, draft);
    if ("error" in next) return;
    writeForumDraft(next.draft, storage);
    setBody("");
    setRev((n) => n + 1);
  }

  return (
    <article className="mx-auto max-w-2xl">
      <p className="text-sm text-muted">
        <Link to="/forum" className="hover:text-fg">
          {t(lang, "forum")}
        </Link>
        <span className="mx-2 text-subtle">/</span>
        <Link to="/forum/$board" params={{ board: board.id }} className="hover:text-fg">
          {board.title[lang]}
        </Link>
      </p>
      <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight">{data.topic.title}</h1>
      <p className="mt-2 text-xs text-subtle">{data.topic.author.name}</p>
      <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-fg">{data.topic.body}</p>

      <ol className="mt-10 space-y-3">
        {data.replies.map((reply) => (
          <li key={reply.id} className="rounded-2xl border border-border bg-surface px-5 py-4">
            <p className="text-xs text-subtle">{reply.author.name}</p>
            <p className="mt-2 leading-relaxed">{reply.body}</p>
          </li>
        ))}
      </ol>

      <section className="mt-8">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={lang === "ar" ? "رد هادئ…" : "A quiet reply…"}
        />
        <Button className="mt-3" type="button" onClick={send}>
          {t(lang, "reply")}
        </Button>
      </section>
    </article>
  );
}
