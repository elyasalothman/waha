import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ADMIN_SESSION_KEY,
  adminStats,
  hidePost,
  listSquarePosts,
  pinMatches,
  readHiddenPosts,
  unhidePost,
  writeHiddenPosts,
} from "@/lib/admin";
import { allTopics, readForumDraft } from "@/lib/forum/store";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function unlocked(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function AdminPage() {
  const lang = useAppStore((s) => s.lang);
  const [pin, setPin] = useState("");
  const [ok, setOk] = useState(unlocked);
  const [wrong, setWrong] = useState(false);
  const [rev, setRev] = useState(0);
  const storage = typeof localStorage === "undefined" ? null : localStorage;

  const stats = useMemo(() => adminStats(storage), [rev, storage]);
  const hidden = useMemo(() => readHiddenPosts(storage), [rev, storage]);
  const forum = useMemo(() => {
    const draft = readForumDraft(storage);
    return allTopics(draft, []);
  }, [rev, storage]);
  const maydan = useMemo(() => listSquarePosts([]), [rev]);

  function enter() {
    if (!pinMatches(pin, storage)) {
      setWrong(true);
      return;
    }
    try {
      sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    setOk(true);
    setWrong(false);
  }

  function toggle(kind: "forum" | "maydan", id: string, isHidden: boolean) {
    if (!storage) return;
    const next = isHidden ? unhidePost(kind, id, hidden) : hidePost(kind, id, hidden);
    writeHiddenPosts(next, storage);
    setRev((n) => n + 1);
  }

  if (!ok) {
    return (
      <div className="mx-auto max-w-sm">
        <p className="text-xs tracking-wide text-muted">{t(lang, "admin")}</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">{t(lang, "admin")}</h1>
        <p className="mt-3 text-sm text-muted">
          {lang === "ar"
            ? "رقم سري محلي على هذا الجهاز. إن وُجد مسبقاً يُحترم."
            : "A local secret on this device. An existing one is honored."}
        </p>
        <Input
          className="mt-6"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder={t(lang, "adminPin")}
        />
        {wrong ? <p className="mt-2 text-sm text-danger">{t(lang, "adminWrong")}</p> : null}
        <Button className="mt-4" type="button" onClick={enter}>
          {t(lang, "adminUnlock")}
        </Button>
        <p className="mt-6 text-sm">
          <Link to="/more" className="text-muted hover:text-fg">
            {t(lang, "more")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-xs tracking-wide text-muted">{t(lang, "admin")}</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">{t(lang, "admin")}</h1>
      <dl className="mt-8 grid grid-cols-3 gap-2">
        {(
          [
            [lang === "ar" ? "مواضيع ظاهرة" : "Visible topics", stats.forumTopics],
            [lang === "ar" ? "سطور الميدان" : "Maydan lines", stats.maydanPosts],
            [lang === "ar" ? "مخفي" : "Hidden", stats.hiddenTotal],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-surface px-3 py-3">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="mt-1 font-mono text-2xl tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "forum")}</h2>
        <ul className="grid gap-2">
          {forum.map((topic) => {
            const isHidden = hidden.forum.includes(topic.id);
            return (
              <li
                key={topic.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm"
              >
                <span className={isHidden ? "text-subtle line-through" : ""}>{topic.title}</span>
                <Button type="button" size="sm" variant="secondary" onClick={() => toggle("forum", topic.id, isHidden)}>
                  {isHidden ? t(lang, "unhide") : t(lang, "hide")}
                </Button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-medium text-muted">{t(lang, "maydan")}</h2>
        <ul className="grid gap-2">
          {maydan.map((post) => {
            const isHidden = hidden.maydan.includes(post.id);
            return (
              <li
                key={post.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm"
              >
                <span className={isHidden ? "text-subtle line-through" : ""}>{post.text}</span>
                <Button type="button" size="sm" variant="secondary" onClick={() => toggle("maydan", post.id, isHidden)}>
                  {isHidden ? t(lang, "unhide") : t(lang, "hide")}
                </Button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
