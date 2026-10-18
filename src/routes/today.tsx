import { createFileRoute } from "@tanstack/react-router";
import { SuperAppHome as HomePage } from "@/components/superapp-home";
export const Route = createFileRoute("/today")({
  head: () => ({
    meta: [
      { title: "يومي · واحة" },
      { name: "description", content: "أخبارك ووردك وكتبك وألعابك في واحة يومك." },
    ],
  }),
  component: HomePage,
});
