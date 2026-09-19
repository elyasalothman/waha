import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchWeatherSafe } from "@/lib/weather";
import { fetchHeadlines } from "@/lib/news";

/** RPC — not a `.server.ts` import, so the home route can ship in the client bundle. */
export const loadHomeLive = createServerFn({ method: "GET" })
  .validator(z.object({ lat: z.number(), lon: z.number() }))
  .handler(async ({ data }) => {
    const [weather, headlines] = await Promise.all([
      fetchWeatherSafe(data.lat, data.lon),
      fetchHeadlines(),
    ]);
    return { weather, headlines };
  });
