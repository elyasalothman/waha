import { createFileRoute } from "@tanstack/react-router";
import { FAMILY_SYNC_STUB } from "@/lib/messages";

export const Route = createFileRoute("/api/family-inbox")({
  server: {
    handlers: {
      GET: async () => Response.json(FAMILY_SYNC_STUB),
      POST: async () => Response.json(FAMILY_SYNC_STUB),
    },
  },
});
