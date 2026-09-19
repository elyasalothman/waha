import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { runAskWaha, type AskWahaResponse } from "./ask-waha.ts";

const Message = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(4000),
});

const City = z.object({
  id: z.string().max(64),
  ar: z.string().max(80),
  en: z.string().max(80),
  lat: z.number(),
  lon: z.number(),
  tz: z.string().max(64),
  countryAr: z.string().max(80).optional(),
  countryEn: z.string().max(80).optional(),
});

const Input = z.object({
  mode: z.enum(["chat", "translate", "write"]),
  lang: z.enum(["ar", "en"]),
  messages: z.array(Message).max(12),
  city: City.optional(),
});

/**
 * اسأل واحة v0.1 — DayContext من shadowDayNow + السؤال → POST محسن (serverFn فقط).
 * لا xAI على المعرفة. ترجمة/كتابة unavailable صريحاً.
 */
export const askWaha = createServerFn({ method: "POST" })
  .validator(Input)
  .handler(async ({ data }): Promise<AskWahaResponse> => {
    return runAskWaha({
      mode: data.mode,
      lang: data.lang,
      messages: data.messages,
      city: data.city
        ? {
            ...data.city,
            countryAr: data.city.countryAr ?? "",
            countryEn: data.city.countryEn ?? "",
          }
        : undefined,
    });
  });
