import { createFileRoute, Link } from "@tanstack/react-router";
import { moreOverflowNav } from "@/lib/nav";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/more")({ component: MorePage });

function MorePage() {
  const lang = useAppStore((s) => s.lang);
  const audience = useAppStore((s) => s.audience);
  const segment = useAppStore((s) => s.segment);
  const hubs = moreOverflowNav(audience, segment);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <h1 className="font-display text-4xl tracking-tight">{t(lang, "more")}</h1>
        <p className="mt-2 max-w-xl text-muted">{t(lang, "moreBlurb")}</p>
      </header>
      <Link
        to="/forum"
        className="mb-6 flex min-h-14 items-center justify-between rounded-xl border border-border bg-surface px-4 text-fg hover:bg-surface-2"
      >
        <span>
          <span className="block font-medium">{t(lang, "forum")}</span>
          <span className="mt-0.5 block text-sm text-muted">{t(lang, "forumBlurb")}</span>
        </span>
      </Link>
      <nav aria-label={t(lang, "more")} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {hubs.map((hub) => (
          <Link
            key={hub.to}
            to={hub.to as "/life" | "/money" | "/tools" | "/games" | "/studio" | "/workspace"}
            className="flex min-h-14 items-center rounded-xl border border-border bg-surface px-4 text-fg hover:bg-surface-2"
          >
            <span className="font-medium">{t(lang, hub.key)}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
