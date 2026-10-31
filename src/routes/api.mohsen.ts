import { createFileRoute } from "@tanstack/react-router";
import { handleMohsenRequest } from "@/lib/mohsen-api";

export const Route = createFileRoute("/api/mohsen")({
  server: {
    handlers: {
      POST: ({ request }) => handleMohsenRequest(request),
    },
  },
});
