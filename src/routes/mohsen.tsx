import { createFileRoute } from "@tanstack/react-router";
import { MohsenChat } from "@/components/mohsen-chat";
export const Route = createFileRoute("/mohsen")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s.q === "string" ? s.q.slice(0, 8000) : "",
    mode: (["chat", "image", "clip", "cv", "interview", "plan"].includes(String(s.mode))
      ? s.mode
      : "chat") as "chat" | "image" | "clip" | "cv" | "interview" | "plan",
    attach: s.attach === true || s.attach === "true",
  }),
  head: () => ({
    meta: [
      { title: "محسن · واحة" },
      {
        name: "description",
        content: "اسأل محسن وحلّل ملفاتك وأنشئ صورة وخطّط لمستقبلك، بسجل محلي على جهازك.",
      },
    ],
    links: [{ rel: "canonical", href: "https://waha.hajdah.com/mohsen" }],
  }),
  component: function MohsenPage() {
    const search = Route.useSearch();
    return <MohsenChat key={`${search.mode}-${search.attach}`} {...search} />;
  },
});
