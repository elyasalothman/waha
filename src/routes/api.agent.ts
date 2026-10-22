import { createFileRoute } from "@tanstack/react-router";
import { requestMohsen } from "@/lib/agent/mohsen";
export const Route = createFileRoute("/api/agent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const headers = { "Cache-Control": "no-store" };
        if (request.headers.get("origin") !== new URL(request.url).origin)
          return Response.json({ error: "أصل غير مسموح" }, { status: 403, headers });
        try {
          if (Number(request.headers.get("content-length")) > 5000)
            return Response.json({ error: "طلب طويل" }, { status: 413, headers });
          const raw = await request.text();
          if (raw.length > 5000)
            return Response.json({ error: "طلب طويل" }, { status: 413, headers });
          const body = JSON.parse(raw);
          if (
            typeof body.message !== "string" ||
            !body.message.trim() ||
            body.message.length > 1000
          )
            return Response.json({ error: "رسالة غير صالحة" }, { status: 400, headers });
          return await requestMohsen(body.message);
        } catch {
          return Response.json({ error: "رسالة غير صالحة" }, { status: 400, headers });
        }
      },
    },
  },
});
