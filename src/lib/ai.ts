import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Message = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(4000),
});

const Input = z.object({
  mode: z.enum(["chat", "translate", "write"]),
  lang: z.enum(["ar", "en"]),
  messages: z.array(Message).max(12),
});

const SYSTEMS: Record<"chat" | "translate" | "write", { ar: string; en: string }> = {
  chat: {
    ar: "أنت واحة، مساعد عملي داخل منصة رقمية عربية. أجب باختصار ودقة، بالعربية الفصحى الواضحة ما لم يطلب المستخدم لغة أخرى. لا تختلق حقائق.",
    en: "You are Waha, a practical assistant inside a bilingual digital oasis. Be concise and accurate. Reply in the user's language. Do not invent facts.",
  },
  translate: {
    ar: "أنت مترجم محترف داخل واحة. ترجم بين العربية والإنجليزية بأمانة، وحافظ على النبرة. أعد الترجمة فقط مع سطر قصير يوضح اللغة الناتجة.",
    en: "You are a professional translator inside Waha. Translate faithfully between Arabic and English. Return the translation plus a one-line note of the target language.",
  },
  write: {
    ar: "أنت محرر داخل واحة. حسّن الصياغة أو اكتب النص المطلوب بأسلوب واضح ومهذب. إن كان المدخل عربياً فأخرج عربياً فصيحاً معاصراً.",
    en: "You are a writing editor inside Waha. Improve or draft the requested text in a clear, civil tone. Match the user's language.",
  },
};

export const askWaha = createServerFn({ method: "POST" })
  .validator(Input)
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "unavailable" };

    const last = data.messages.at(-1);
    if (!last || last.role !== "user" || !last.content.trim()) {
      return { ok: false as const, error: "empty" };
    }

    const system = SYSTEMS[data.mode][data.lang];
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.5,
        max_tokens: 700,
        messages: [{ role: "system", content: system }, ...data.messages],
      }),
    });

    if (!res.ok) return { ok: false as const, error: `api-${res.status}` };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) return { ok: false as const, error: "empty-response" };
    return { ok: true as const, text };
  });
