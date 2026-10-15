import { createFileRoute } from "@tanstack/react-router";
import { authAvailability } from "@/lib/auth/availability.server";
export const Route = createFileRoute("/api/auth-status")({
  server: {
    handlers: {
      GET: () => Response.json(authAvailability(), { headers: { "Cache-Control": "no-store" } }),
    },
  },
});
