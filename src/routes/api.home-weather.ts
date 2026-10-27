import { createFileRoute } from "@tanstack/react-router";
import { fetchWeather } from "@/lib/weather";
/** Optional widget snapshot: absence is explicit, never a fabricated temperature. */
export const Route = createFileRoute("/api/home-weather")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const lat = Number(url.searchParams.get("lat")),
          lon = Number(url.searchParams.get("lon"));
        if (
          !url.searchParams.has("lat") ||
          !url.searchParams.has("lon") ||
          !Number.isFinite(lat) ||
          !Number.isFinite(lon) ||
          Math.abs(lat) > 90 ||
          Math.abs(lon) > 180
        )
          return Response.json({ status: "invalid", payload: null }, { status: 400 });
        try {
          const payload = await fetchWeather(lat, lon, AbortSignal.timeout(6500));
          return Response.json(
            { status: "live", payload, source: "Open-Meteo" },
            { headers: { "Cache-Control": "public, max-age=300" } },
          );
        } catch {
          return Response.json(
            { status: "unavailable", payload: null, source: "Open-Meteo" },
            { headers: { "Cache-Control": "public, max-age=60" } },
          );
        }
      },
    },
  },
});
