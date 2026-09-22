import { createFileRoute, redirect } from "@tanstack/react-router";

/** مسار مختصر → تطبيق الذكاء (/app/chat). */
export const Route = createFileRoute("/ask")({
  beforeLoad: () => {
    throw redirect({
      to: "/app/$id",
      params: { id: "chat" },
      replace: true,
    });
  },
});
