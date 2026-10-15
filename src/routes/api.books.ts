import { createFileRoute } from "@tanstack/react-router";
async function handle(request: Request, method: "GET" | "POST") {
  try {
    const server = await import("@/lib/books/platform/server");
    return method === "GET"
      ? await server.getPublicBooks(request)
      : await server.publishBook(request);
  } catch {
    return Response.json(
      { message: "تعذّر الاتصال بمكتبة الكتب العامة." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
export const Route = createFileRoute("/api/books")({
  server: {
    handlers: {
      GET: ({ request }) => handle(request, "GET"),
      POST: ({ request }) => handle(request, "POST"),
    },
  },
});
