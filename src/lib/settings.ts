import { NEWS_TOPICS } from "./arabic-news.ts";
import { CITIES } from "./cities.ts";
import { SERVICES } from "./superapp.ts";
import { z } from "zod";
export const SETTINGS_KEY = "waha:settings:v1";
export const settingsSchema = z
  .object({
    theme: z.enum(["auto", "dark", "light"]).default("auto"),
    accent: z.enum(["green", "blue", "purple", "red", "brown", "teal"]).default("green"),
    fontSize: z.enum(["small", "normal", "large", "largest"]).default("normal"),
    density: z.enum(["comfortable", "compact"]).default("comfortable"),
    reducedMotion: z.boolean().default(false),
    background: z.enum(["plain", "sand", "garden"]).default("plain"),
    shortcuts: z
      .array(
        z
          .string()
          .max(80)
          .refine((id) => SERVICES.some((s) => s.id === id)),
      )
      .min(1)
      .max(8)
      .refine((a) => new Set(a).size === a.length)
      .default(["midad", "quran", "tahajjud", "hissati", "store", "calc", "mohsin", "dallah"]),
    tabs: z
      .array(z.enum(["/", "/books", "/tools", "/games", "/me"]))
      .min(1)
      .max(5)
      .refine((a) => new Set(a).size === a.length && a.includes("/"))
      .default(["/", "/books", "/tools", "/games", "/me"]),
    weatherWidget: z.boolean().default(true),
    newsWidget: z.boolean().default(true),
    liveWidget: z.boolean().default(true),
    agentEnabled: z.boolean().default(true),
    agentVoice: z.boolean().default(false),
    agentSuggestions: z.boolean().default(true),
    city: z
      .string()
      .max(80)
      .refine((id) => CITIES.some((c) => c.id === id))
      .default("riyadh"),
    location: z.enum(["manual", "device"]).default("manual"),
    temperature: z.enum(["C", "F"]).default("C"),
    newsTopics: z.array(z.enum(NEWS_TOPICS)).max(6).default([]),
    newsSources: z
      .array(z.enum(["BBC عربي", "الجزيرة", "الشرق"]))
      .max(3)
      .default([]),
    readingNight: z.boolean().default(false),
    readingFont: z.enum(["sans", "serif"]).default("serif"),
    language: z.enum(["ar", "en"]).default("ar"),
    calendar: z.enum(["gregory", "islamic-umalqura"]).default("gregory"),
    digits: z.enum(["arab", "latn"]).default("arab"),
    childMode: z.boolean().default(false),
    developer: z.boolean().default(false),
  })
  .strict();
export type Settings = z.infer<typeof settingsSchema>;
export const defaultSettings = settingsSchema.parse({});
export function parseSettings(raw: unknown): Settings {
  return settingsSchema.parse(raw);
}
export function settingChange(key: string, value: unknown): Settings {
  if (!(key in settingsSchema.shape)) throw new Error("إعداد غير معروف");
  return parseSettings({ ...defaultSettings, [key]: value });
}
export type SettingsStorage = Pick<Storage, "getItem" | "setItem">;
export function loadSettings(storage: SettingsStorage): Settings {
  try {
    const raw = storage.getItem(SETTINGS_KEY);
    return raw ? parseSettings(JSON.parse(raw)) : defaultSettings;
  } catch {
    return defaultSettings;
  }
}
export function saveSettings(
  storage: SettingsStorage,
  current: Settings,
  patch: Partial<Settings>,
): Settings {
  const next = parseSettings({ ...current, ...patch });
  storage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}
