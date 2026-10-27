import { parseMohsenReply } from "@/lib/agent/mohsen";
import { createFileRoute } from "@tanstack/react-router";
import { MOHSEN_BODY_LIMIT, MOHSEN_MESSAGE_LIMIT, mohsenHistory } from "@/lib/mohsen-request";
export const Route = createFileRoute("/api/mohsen")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const headers = { "Cache-Control": "no-store" };
        const origin = request.headers.get("origin");
        if (!origin || origin !== new URL(request.url).origin)
          return Response.json({ error: "أصل غير مسموح" }, { status: 403, headers });
        try {
          const raw = await request.text();
          if (raw.length > MOHSEN_BODY_LIMIT)
            return Response.json({ error: "الرسالة طويلة" }, { status: 413, headers });
          const body = JSON.parse(raw);
          if (
            typeof body.message !== "string" ||
            !body.message.trim() ||
            body.message.length > MOHSEN_MESSAGE_LIMIT
          )
            return Response.json(
              { error: "اكتب سؤالًا بين حرف واحد و٨٠٠٠ حرف" },
              { status: 400, headers },
            );
          const history = mohsenHistory(body.messages).slice(-2);
          const r = await fetch("https://si.alhajda.com/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: body.message, messages: history }),
            signal: AbortSignal.timeout(25000),
          });
          if (!r.ok) throw new Error("upstream");
          const result = await r.json();
          if (typeof result.reply !== "string" || !result.reply.trim()) throw new Error("response");
          return Response.json(
            {
              ...parseMohsenReply(result),
            },
            { headers },
          );
        } catch (error) {
          if (error instanceof SyntaxError)
            return Response.json({ error: "صيغة الطلب غير صالحة" }, { status: 400, headers });
          return Response.json(
            { error: "تعذّر الاتصال بمحسن. جرّب لاحقًا أو افتح موقعه." },
            { status: 503, headers },
          );
        }
      },
    },
  },
});
