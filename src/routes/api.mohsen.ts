import { createFileRoute } from "@tanstack/react-router";
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
          if (raw.length > 16000)
            return Response.json({ error: "الرسالة طويلة" }, { status: 413, headers });
          const body = JSON.parse(raw);
          if (
            typeof body.message !== "string" ||
            !body.message.trim() ||
            body.message.length > 3000
          )
            return Response.json({ error: "اكتب سؤالًا أقصر" }, { status: 400, headers });
          const history = Array.isArray(body.messages)
            ? body.messages
                .slice(-8)
                .filter(
                  (m: { role?: string; content?: string }) =>
                    ["user", "assistant"].includes(m?.role ?? "") &&
                    typeof m?.content === "string" &&
                    m.content.length <= 3000,
                )
                .map((m: { role: string; content: string }) => ({
                  role: m.role,
                  content: m.content,
                }))
            : [];
          const r = await fetch("https://ai.alhajda.com/api/chat", {
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
              reply: result.reply.slice(0, 16000),
              source:
                typeof result.source === "string" && result.source.startsWith("https://")
                  ? result.source
                  : null,
            },
            { headers },
          );
        } catch {
          return Response.json(
            { error: "تعذّر الاتصال بمحسن. جرّب لاحقًا أو افتح موقعه." },
            { status: 503, headers },
          );
        }
      },
    },
  },
});
