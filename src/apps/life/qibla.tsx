import { useEffect, useState } from "react";
import { CitySelect } from "@/components/city-select";
import { Card } from "@/components/ui/card";
import { qiblaDeg } from "@/lib/prayer";
import { useAppStore } from "@/store/app-store";

export function QiblaApp() {
  const lang = useAppStore((s) => s.lang);
  const city = useAppStore((s) => s.city);
  const bearing = ((qiblaDeg(city.lat, city.lon) % 360) + 360) % 360;
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    function onOrient(e: DeviceOrientationEvent) {
      const anyE = e as DeviceOrientationEvent & { webkitCompassHeading?: number };
      const h = anyE.webkitCompassHeading ?? (typeof e.alpha === "number" ? 360 - e.alpha : null);
      if (h != null) setHeading(h);
    }
    window.addEventListener("deviceorientation", onOrient);
    return () => window.removeEventListener("deviceorientation", onOrient);
  }, []);

  const needle = heading == null ? bearing : bearing - heading;

  return (
    <div className="space-y-4">
      <CitySelect />
      <Card className="flex flex-col items-center p-6">
        <div className="relative size-56">
          <div className="absolute inset-0 rounded-full border border-border bg-surface-2" />
          <div
            className="absolute inset-6 rounded-full border border-border"
            style={{ transform: `rotate(${needle}deg)` }}
          >
            <div className="absolute start-1/2 top-0 h-1/2 w-0.5 -translate-x-1/2 bg-primary" />
            <div className="absolute start-1/2 top-2 size-3 -translate-x-1/2 rounded-full bg-primary" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center font-mono text-xl tabular-nums">
            {Math.round(bearing)}°
          </div>
        </div>
        <p className="mt-4 text-sm text-muted">
          {lang === "ar"
            ? "الاتجاه من موقعك نحو الكعبة المشرفة."
            : "Bearing from your location toward the Kaaba."}
        </p>
        <p className="mt-1 text-xs text-subtle">
          {heading == null
            ? lang === "ar"
              ? "ثبّت الهاتف واتجه مع السهم، أو اسمح بالبوصلة."
              : "Hold the phone and follow the needle, or enable compass access."
            : lang === "ar"
              ? "البوصلة حيّة — واجه السهم."
              : "Live compass — face the needle."}
        </p>
      </Card>
    </div>
  );
}
