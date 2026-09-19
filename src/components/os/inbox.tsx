import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { requestFamilySync } from "@/lib/family-inbox";
import { threadPreview } from "@/lib/messages";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";
import { useMessagesStore } from "@/store/messages-store";

export function InboxList() {
  const lang = useAppStore((s) => s.lang);
  const hydrate = useMessagesStore((s) => s.hydrate);
  const compose = useMessagesStore((s) => s.compose);
  const threads = useMessagesStore((s) => s.threads);
  const messages = useMessagesStore((s) => s.messages);
  const [title, setTitle] = useState("");
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const navigate = useNavigate();
  const inbox = { threads, messages };

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <p className="text-xs tracking-wide text-muted">{t(lang, "messages")}</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">{t(lang, "inbox")}</h1>
        <p className="mt-3 text-sm text-muted">{t(lang, "inboxHonest")}</p>
      </header>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const id = compose(title);
          setTitle("");
          void navigate({ to: "/messages/$threadId", params: { threadId: id } });
        }}
      >
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t(lang, "threadTitle")} />
        <Button type="submit">{t(lang, "compose")}</Button>
      </form>

      <ul className="space-y-2">
        {threads.map((thread) => {
          const preview = threadPreview(inbox, thread.id);
          return (
            <li key={thread.id}>
              <Link
                to="/messages/$threadId"
                params={{ threadId: thread.id }}
                className="block rounded-2xl border border-border bg-surface px-4 py-3 hover:bg-surface-2"
              >
                <p className="font-medium">{thread.title}</p>
                <p className="mt-1 truncate text-sm text-muted">{preview?.body ?? t(lang, "empty")}</p>
              </Link>
            </li>
          );
        })}
      </ul>

      <Button
        type="button"
        variant="secondary"
        onClick={() => {
          void requestFamilySync().then((res) => setSyncNote(lang === "ar" ? res.messageAr : res.messageEn));
        }}
      >
        {lang === "ar" ? "حاول المزامنة" : "Try sync"}
      </Button>
      {syncNote ? <p className="text-sm text-muted">{syncNote}</p> : null}
    </div>
  );
}

export function InboxThread({ threadId }: { threadId: string }) {
  const lang = useAppStore((s) => s.lang);
  const name = useAppStore((s) => s.profileName);
  const hydrate = useMessagesStore((s) => s.hydrate);
  const send = useMessagesStore((s) => s.send);
  const markRead = useMessagesStore((s) => s.markRead);
  const threads = useMessagesStore((s) => s.threads);
  const messages = useMessagesStore((s) => s.messages);
  const [body, setBody] = useState("");
  const thread = threads.find((t) => t.id === threadId);
  const list = useMemo(
    () => messages.filter((m) => m.threadId === threadId).sort((a, b) => a.createdAt - b.createdAt),
    [messages, threadId],
  );

  useEffect(() => {
    hydrate();
    markRead();
  }, [hydrate, markRead, threadId]);

  if (!thread) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-muted">{t(lang, "empty")}</p>
        <Link to="/messages" className="mt-4 inline-block text-primary">
          {t(lang, "messages")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col">
      <Link to="/messages" className="mb-4 text-sm text-muted hover:text-fg">
        {t(lang, "back")}
      </Link>
      <h1 className="font-display text-3xl tracking-tight">{thread.title}</h1>
      <p className="mt-2 text-sm text-muted">{t(lang, "inboxHonest")}</p>
      <div className="mt-6 flex-1 space-y-3">
        {list.map((m) => (
          <div key={m.id} className="rounded-2xl border border-border bg-surface px-4 py-3">
            <p className="text-xs text-subtle">{m.author}</p>
            <p className="mt-1 text-sm leading-relaxed">{m.body}</p>
          </div>
        ))}
      </div>
      <form
        className="mt-4 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(threadId, name || (lang === "ar" ? "أنا" : "Me"), body);
          setBody("");
        }}
      >
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={t(lang, "writeMessage")} />
        <Button type="submit">{t(lang, "send")}</Button>
      </form>
    </div>
  );
}
