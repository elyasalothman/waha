import { useEffect } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { APPS } from "@/apps/registry";
import { AppStage } from "@/components/app-stage";
import { getApp } from "@/lib/catalog";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/app/$id")({ component: AppPage });

function AppPage() {
  const { id } = Route.useParams();
  const item = getApp(id);
  const lang = useAppStore((s) => s.lang);
  const pushRecent = useAppStore((s) => s.pushRecent);

  useEffect(() => {
    if (item) pushRecent(item.id);
  }, [item, pushRecent]);

  useEffect(() => {
    if (item?.href) window.location.replace(item.href);
  }, [item]);

  if (id === "madar") {
    return <Navigate to="/madar" />;
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-muted">{t(lang, "notFound")}</p>
        <Link to="/" className="mt-4 inline-block text-primary">
          {t(lang, "home")}
        </Link>
      </div>
    );
  }

  if (item.href) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-muted">{t(lang, "doorHint")}</p>
        <a href={item.href} className="mt-4 inline-block text-primary">
          {item.title[lang]}
        </a>
      </div>
    );
  }

  const Comp = APPS[id];
  return (
    <AppStage item={item} lang={lang} wide={item.category === "games" || item.id === "invoice" || item.id === "asma" || item.id === "names"}>
      {Comp ? (
        <Comp />
      ) : (
        <p className="text-sm text-muted">{t(lang, "loading")}</p>
      )}
    </AppStage>
  );
}
