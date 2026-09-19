import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useNow } from "@/hooks/use-now";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { displayNameOf, mergeFeed, useSquare } from "@/lib/square/store";
import type { SquareTab } from "@/lib/square/types";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { useAppStore } from "@/store/app-store";
import { Composer } from "./composer";
import { DayShadow } from "./day-shadow";
import { PostCard } from "./post-card";
import { ProfilePanel } from "./profile-panel";

export function SquarePage() {
  const lang = useAppStore((s) => s.lang);
  const audience = useAppStore((s) => s.audience);
  const user = useCurrentUser();
  const { local, ready, publish, like, echo, reply, saveProfile } = useSquare();
  const [tab, setTab] = useState<SquareTab>("forYou");
  const [profileOpen, setProfileOpen] = useState(false);
  const clock = useNow(60_000);
  const now = clock.getTime();

  const signedName = user && !user.isDevFallback ? (user.displayName ?? "").trim() : "";
  const profile = {
    name: local.profile.name || signedName,
    bio: local.profile.bio,
  };
  const visitorName = displayNameOf(profile, "ضيف الواحة", "Oasis guest", lang);
  const feed = useMemo(
    () => mergeFeed({ ...local, profile }, tab, now, lang),
    [local, profile.name, profile.bio, tab, now, lang],
  );
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  return (
    <div className="mx-auto max-w-xl">
      <DayShadow />

      <header className="pt-5 pb-3">
        <p className="text-xs font-medium tracking-wide text-subtle">{t(lang, audience === "work" ? "work" : "personal")}</p>
        <h1 className="mt-1 font-display text-4xl tracking-tight">{L("الميدان", "The Square")}</h1>
        <p className="mt-2 text-sm text-muted">
          {L("خط الناس في الواحة — اكتب، أجب، ومرّ. البذرة هنا من أول فتح.", "Waha’s people line — write, reply, pass through. The seed is here from the first open.")}
        </p>
      </header>

      <div className="grid grid-cols-2 rounded-lg border border-border bg-surface p-1">
        {(
          [
            { id: "forYou" as const, ar: "للجميع", en: "For you" },
            { id: "following" as const, ar: "تتبع", en: "Following" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "h-9 rounded-md text-sm font-medium",
              tab === item.id ? "bg-surface-2 text-fg" : "text-muted hover:text-fg",
            )}
          >
            {L(item.ar, item.en)}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <Composer
          lang={lang}
          name={visitorName}
          tone="#c5d0c4"
          onPublish={publish}
          onOpenProfile={() => setProfileOpen(true)}
        />
      </div>

      <div className="mt-2">
        {!ready ? <p className="py-6 text-sm text-muted">{t(lang, "loading")}</p> : null}
        {feed.map((item) => (
          <PostCard
            key={item.id}
            item={item}
            lang={lang}
            now={now}
            visitorName={visitorName}
            onLike={() => like(item.id)}
            onEcho={() => echo(item.id)}
            onReply={(text) => reply(item.id, text, visitorName)}
          />
        ))}
      </div>

      <p className="py-8 text-center text-sm text-subtle">
        {L("الآبار للخدمة، والميدان للكلام.", "Wells for service, the Square for speech.")}{" "}
        <Link to={audience === "work" ? "/workspace" : "/life"} className="text-primary hover:underline">
          {audience === "work" ? t(lang, "workCatalog") : t(lang, "catalogCta")}
        </Link>
      </p>

      <ProfilePanel
        open={profileOpen}
        lang={lang}
        profile={profile}
        onClose={() => setProfileOpen(false)}
        onSave={saveProfile}
      />
    </div>
  );
}
