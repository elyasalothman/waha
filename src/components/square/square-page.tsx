import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useNow } from "@/hooks/use-now";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { displayNameOf, mergeFeed, useSquare } from "@/lib/square/store";
import type { SquareTab } from "@/lib/square/types";
import { worldCards } from "@/lib/square/world";
import { t } from "@/lib/i18n";
import { PALETTE } from "@/lib/palette";
import { cn } from "@/lib/cn";
import { useAppStore } from "@/store/app-store";
import { DoorsStrip } from "@/components/doors-strip";
import { HomeSpend } from "@/components/home-spend";
import { Composer } from "./composer";
import { DayAyah } from "./day-ayah";
import { DayShadow } from "./day-shadow";
import { PostCard } from "./post-card";
import { ProfilePanel } from "./profile-panel";
import { SupportCard } from "./support-card";
import { SupportPanel } from "./support-panel";
import { SupportRow } from "./support-row";
import { WorldCard } from "./world-card";
import { WorldStrip } from "./world-strip";

type MaydanLane = SquareTab | "world";

export function SquarePage() {
  const lang = useAppStore((s) => s.lang);
  const audience = useAppStore((s) => s.audience);
  const segment = useAppStore((s) => s.segment);
  const user = useCurrentUser();
  const { local, publish, like, reply, saveProfile } = useSquare();
  const [tab, setTab] = useState<MaydanLane>("forYou");
  const [profileOpen, setProfileOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const clock = useNow(60_000);
  const now = clock.getTime();
  const world = useMemo(() => worldCards(), []);

  const signedName = user && !user.isDevFallback ? (user.displayName ?? "").trim() : "";
  const profile = {
    name: local.profile.name || signedName,
    bio: local.profile.bio,
  };
  const visitorName = displayNameOf(profile, "ضيف الواحة", "Oasis guest", lang);
  const feed = useMemo(() => {
    if (tab === "world") return [];
    return mergeFeed({ ...local, profile }, tab, now, lang);
  }, [local, profile.name, profile.bio, tab, now, lang]);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const onWorldLane = tab === "world";

  return (
    <div className="mx-auto max-w-xl" data-home-sections="day-shadow house-doors square">
      <DayShadow />
      {audience === "personal" ? <HomeSpend lang={lang} segment={segment} /> : null}
      <div className="pt-3">
        <DoorsStrip lang={lang} row />
      </div>
      <DayAyah />

      <header className="pt-3 pb-2" data-home-section="square">
        <h1 className="font-display text-xl tracking-tight">{L("الميدان", "The Square")}</h1>
      </header>

      <WorldStrip lang={lang} cards={world} active={onWorldLane} onOpenLane={() => setTab("world")} />

      <div className="mt-3 grid grid-cols-3 rounded-lg border border-border bg-surface p-1">
        {(
          [
            { id: "forYou" as const, ar: "للجميع", en: "For you" },
            { id: "following" as const, ar: "تتبع", en: "Following" },
            { id: "world" as const, ar: "من العالم", en: "World" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            data-world-tab={item.id === "world" ? "من العالم" : undefined}
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

      {onWorldLane ? null : (
        <>
          <div className="mt-4">
            <Composer
              lang={lang}
              name={visitorName}
              tone={PALETTE.primary}
              onPublish={publish}
              onOpenProfile={() => setProfileOpen(true)}
            />
          </div>

          <SupportRow lang={lang} onSupport={() => setSupportOpen(true)} />
          <div className="mt-1">
            <SupportCard lang={lang} onSupport={() => setSupportOpen(true)} />
          </div>
        </>
      )}

      <div className="mt-2" data-world-lane={onWorldLane ? "من العالم" : undefined}>
        {onWorldLane ? (
          world.length > 0 ? (
            world.map((card) => <WorldCard key={card.id} card={card} lang={lang} />)
          ) : (
            <p data-world-empty className="py-10 text-center text-sm text-subtle">
              {L("لا جديد من العالم", "Nothing new from the world")}
            </p>
          )
        ) : (
          feed.map((item) => (
            <PostCard
              key={item.id}
              item={item}
              lang={lang}
              now={now}
              visitorName={visitorName}
              onLike={() => like(item.id)}
              onReply={(text) => reply(item.id, text, visitorName)}
            />
          ))
        )}
      </div>

      <p className="py-8 text-center text-sm text-subtle">
        {L("النقاش الأطول في قسمه.", "Longer talk lives in its section.")}{" "}
        <Link to="/forum" className="text-primary hover:underline">
          {t(lang, "forum")}
        </Link>
      </p>

      <ProfilePanel
        open={profileOpen}
        lang={lang}
        profile={profile}
        onClose={() => setProfileOpen(false)}
        onSave={saveProfile}
        onSupport={() => {
          setProfileOpen(false);
          setSupportOpen(true);
        }}
      />
      <SupportPanel open={supportOpen} lang={lang} onClose={() => setSupportOpen(false)} />
    </div>
  );
}
