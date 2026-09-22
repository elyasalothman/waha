import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy /ask → Ask Waha chat surface. */
export const Route = createFileRoute("/ask")({
  beforeLoad: () => {
    throw redirect({ to: "/app/$id", params: { id: "chat" }, replace: true });
  },
});
