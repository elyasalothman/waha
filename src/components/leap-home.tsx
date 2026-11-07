import { Link } from "@tanstack/react-router";
import { useSettings } from "@/store/settings-store";
import { HomeNews } from "./home-news";
import { HomeWeather } from "./home-weather";
import { DisplayDate, DisplayPrayer, DisplayReading, DisplayResearch } from "./home-display";
import type { HomeWidgetId } from "@/lib/home-widgets";

function HomeSlot({ id }: { id: HomeWidgetId }) {
  if (id === "weather") return <HomeWeather plain />;
  if (id === "headlines") return <HomeNews plain />;
  if (id === "reading") return <DisplayReading />;
  if (id === "research") return <DisplayResearch />;
  if (id === "prayer") return <DisplayPrayer />;
  return <DisplayDate />;
}

/** Display, plus one customization entry. Other controls live in settings and the app bar. */
export function LeapHome() {
  const widgets = useSettings((s) => s.settings.homeWidgets);
  const size = useSettings((s) => s.settings.homeSize);
  const ready = useSettings((s) => s.ready);
  return (
    <div
      className={size === "compact" ? "mx-auto max-w-3xl space-y-3" : "mx-auto max-w-3xl space-y-5"}
      dir="rtl"
      data-home-display="only"
      data-home-size={size}
    >
      <header className="flex items-end justify-between gap-3 pt-2">
        <div>
          <p className="text-sm text-muted">🌿</p>
          <h1 className="font-display text-4xl tracking-tight text-fg">اليوم</h1>
        </div>
        <Link
          to="/settings"
          hash="home-display"
          className="inline-flex min-h-11 items-center rounded-full px-3 text-sm text-primary focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          تخصيص
        </Link>
      </header>
      {!ready ? (
        <p role="status" className="text-muted">
          جارٍ تحضير العرض…
        </p>
      ) : widgets.length === 0 ? (
        <p className="leading-8 text-muted">لا ودجات في هذا العرض.</p>
      ) : (
        widgets.map((id) => <HomeSlot key={id} id={id} />)
      )}
    </div>
  );
}
