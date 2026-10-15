import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy /ask → Ask Waha chat surface at /app/chat. */
export const Route = createFileRoute("/ask")({
  head: () => ({
    meta: [
      { title: "اسأل واحة · واحة" },
      { name: "description", content: "مساعدك للوصول إلى إجابات وأدوات واحة." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/app/$id", params: { id: "chat" }, replace: true });
  },
});
