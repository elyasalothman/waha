import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { runAskMedia, type AskMediaResponse } from "./ask-media.ts";
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
 * اسأل واحة v0.2 — يوم محلي من shadowDayNow قبل أي شبكة؛ محسن ≤8ث بلا xAI.
 * ترجمة/كتابة unavailable صريحاً.
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

const MediaInput = z.object({
  kind: z.enum(["image", "video"]),
  prompt: z.string().max(2000),
  lang: z.enum(["ar", "en"]).optional(),
});

/**
 * انظر — نص→وسائط عبر محسن فقط (serverFn → ai.alhajda.com).
 * بلا مفاتيح في العميل. بلا مزود ظاهر. فيديو stub.
 */
export const generateAskMedia = createServerFn({ method: "POST" })
  .validator(MediaInput)
  .handler(async ({ data }): Promise<AskMediaResponse> => {
    return runAskMedia({
      kind: data.kind,
      prompt: data.prompt,
      lang: data.lang,
    });
  });
