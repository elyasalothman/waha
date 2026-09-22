import { createFileRoute, Navigate } from "@tanstack/react-router";

/** Canonical Ask lives at /app/chat; keep /ask as a stable short URL. */
export const Route = createFileRoute("/ask")({
  component: AskRedirect,
});

function AskRedirect() {
  return <Navigate to="/app/$id" params={{ id: "chat" }} replace />;
}
