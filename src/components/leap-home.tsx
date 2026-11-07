import { useSettings } from "@/store/settings-store";
import { HomeNews } from "./home-news";
import { HomeWeather } from "./home-weather";
import { DisplayDate, DisplayPrayer } from "./home-display";
import type { HomeWidgetId } from "@/lib/home-widgets";

function HomeSlot({ id }: { id: HomeWidgetId }) {
  if (id === "weather") return <HomeWeather plain />;
  if (id === "headlines") return <HomeNews plain />;
  if (id === "prayer") return <DisplayPrayer />;
  return <DisplayDate />;
}

/** Display only. Widget choice and every other action live outside this page. */
export function LeapHome() {
  const widgets = useSettings((s) => s.settings.homeWidgets);
  const ready = useSettings((s) => s.ready);
  return (
    <div className="mx-auto max-w-3xl space-y-4" dir="rtl" data-home-display="only">
      <h1 className="font-display text-4xl tracking-tight">واحة</h1>
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
