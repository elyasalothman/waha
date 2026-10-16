import { HouseExperience } from "@/components/house-experience";
import { getHouseSite } from "@/lib/house-sites";
import { HOUSE_INTEGRATIONS } from "@/lib/house-integrations";
import { Suspense, useEffect } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { APPS } from "@/apps/registry";
import { AppStage } from "@/components/app-stage";
import { ChildMoneyGate } from "@/components/child-money-gate";
import { getApp } from "@/lib/catalog";
import { hideMoney, isMoneySurface } from "@/lib/child-mode";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/app/$id")({
  head: ({ params }) => {
    const item = getApp(params.id) ?? getHouseSite(params.id);
    return {
      meta: [
        { title: `${item?.title.ar ?? "أداة غير موجودة"} · واحة` },
        { name: "description", content: item?.blurb.ar ?? "استكشف أدوات واحة العربية." },
      ],
    };
  },
  component: AppPage,
});

function AppPage() {
  const { id } = Route.useParams();
  const item = getApp(id);
  const lang = useAppStore((s) => s.lang);
  const segment = useAppStore((s) => s.segment);
  const pushRecent = useAppStore((s) => s.pushRecent);

  useEffect(() => {
    if (item) pushRecent(item.id);
  }, [item, pushRecent]);

  const destination = HOUSE_INTEGRATIONS[id];
  if (destination && destination !== `/app/${id}`) return <Navigate to={destination} />;
  if (getHouseSite(id)) return <HouseExperience key={id} id={id} />;

  if (id === "madar") {
    return <Navigate to="/madar" />;
  }

  if (id === "clips") {
    return <Navigate to="/clips" />;
  }

  if (id === "midad") {
    return <Navigate to="/books" />;
  }

  if (id === "ask") {
    return <Navigate to="/app/$id" params={{ id: "chat" }} />;
  }

  if (item && hideMoney(segment) && isMoneySurface(item)) {
    return <ChildMoneyGate lang={lang} />;
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
    <AppStage
      item={item}
      lang={lang}
      compact={id === "chat"}
      wide={
        item.category === "games" ||
        item.id === "invoice" ||
        item.id === "asma" ||
        item.id === "names"
      }
    >
      {Comp ? (
        <Suspense
          fallback={
            <p role="status" className="min-h-40 animate-pulse py-8 text-center text-muted">
              {t(lang, "loading")}
            </p>
          }
        >
          <Comp />
        </Suspense>
      ) : (
        <p className="text-sm text-muted">{t(lang, "loading")}</p>
      )}
    </AppStage>
  );
}
