import surahs from "../quran-index.json" with { type: "json" };
import { z } from "zod";
import { CATALOG } from "../catalog.ts";
import { SERVICES } from "../superapp.ts";
import { settingChange } from "../settings.ts";
const text = z.string().trim().min(1).max(500);
const empty = z.object({}).strict();
const tool = <T extends z.ZodType>(description: string, schema: T, changing = false) => ({
  description,
  schema,
  changing,
});
export const registry = {
  open_app: tool(
    "افتح تطبيقًا من كتالوج واحة",
    z
      .object({
        id: text.refine(
          (id) =>
            id === "settings" ||
            CATALOG.some((x) => x.id === id) ||
            SERVICES.some((x) => x.id === id),
        ),
      })
      .strict(),
  ),
  search: tool("ابحث في خدمات واحة", z.object({ q: text }).strict()),
  calculate: tool("احسب تعبيرًا رياضيًا", z.object({ expr: text }).strict()),
  weather: tool("طقس مدينة", z.object({ city: text.optional() }).strict()),
  news: tool("عناوين الأخبار", z.object({ topic: text.optional() }).strict()),
  live: tool("افتح الموجز المباشر المسموع", empty),
  open_book: tool("افتح كتابًا بعنوانه", z.object({ title: text }).strict()),
  continue_reading: tool("تابع آخر كتاب", empty),
  quran: tool(
    "افتح سورة وآية",
    z
      .object({
        surah: z.number().int().min(1).max(114),
        ayah: z.number().int().min(1).max(286).default(1),
      })
      .strict()
      .refine((p) => p.ayah <= (surahs[p.surah - 1]?.count || 0), "الآية خارج السورة"),
  ),
  set_theme: tool(
    "غيّر المظهر",
    z.object({ theme: z.enum(["dark", "light", "auto"]) }).strict(),
    true,
  ),
  set_language: tool("غيّر اللغة", z.object({ language: z.enum(["ar", "en"]) }).strict(), true),
  set_font_size: tool(
    "غيّر حجم خط الواجهة",
    z.object({ size: z.enum(["small", "normal", "large", "largest"]) }).strict(),
    true,
  ),
  play_game: tool(
    "افتح لعبة من الكتالوج",
    z
      .object({
        id: text.refine(
          (id) =>
            CATALOG.some((x) => x.id === id && x.category === "games") ||
            SERVICES.some((x) => x.id === id && x.pillar === "fun"),
        ),
      })
      .strict(),
  ),
  ask_mohsen: tool("اسأل محسن سؤالًا معرفيًا", z.object({ q: text }).strict()),
  add_note: tool("أضف ملاحظة محلية", z.object({ text }).strict(), true),
  reminder: tool(
    "أضف تذكيرًا إلى قائمة المهام المحلية دون إشعار",
    z.object({ text }).strict(),
    true,
  ),
  open_url: tool(
    "افتح رابط HTTPS في متصفح واحة",
    z
      .object({
        url: text.refine((s) => {
          try {
            const u = new URL(s);
            return u.protocol === "https:" && !u.username && !u.password;
          } catch {
            return false;
          }
        }),
      })
      .strict(),
  ),
  set_setting: tool(
    "غيّر إعدادًا محليًا باسم الحقل وقيمته",
    z
      .object({ key: text, value: z.unknown() })
      .strict()
      .superRefine((v, ctx) => {
        try {
          settingChange(v.key, v.value);
        } catch {
          ctx.addIssue({ code: "custom", message: "إعداد أو قيمة غير صالحة" });
        }
      }),
    true,
  ),
};
export type ToolName = keyof typeof registry;
export type AgentCommand = {
  [K in ToolName]: { tool: K; args: z.infer<(typeof registry)[K]["schema"]> };
}[ToolName];
export function validateCommand(raw: unknown): AgentCommand {
  const envelope = z
    .object({
      tool: z.enum(Object.keys(registry) as [ToolName, ...ToolName[]]),
      args: z.record(z.string(), z.unknown()),
    })
    .strict()
    .parse(raw);
  return {
    tool: envelope.tool,
    args: registry[envelope.tool].schema.parse(envelope.args),
  } as AgentCommand;
}
export const toolDescriptions = Object.entries(registry).map(([name, entry]) => ({
  name,
  description: entry.description,
  parameters: z.toJSONSchema(entry.schema, { unrepresentable: "any" }),
}));
