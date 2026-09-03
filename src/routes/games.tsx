import { createFileRoute } from "@tanstack/react-router";
import { Hub } from "@/components/hub";

export const Route = createFileRoute("/games")({ component: GamesPage });

function GamesPage() {
  return <Hub category="games" />;
}
