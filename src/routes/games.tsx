import { createFileRoute } from "@tanstack/react-router";
import { GamesHub } from "@/components/games-hub";

export const Route = createFileRoute("/games")({ component: GamesPage });

function GamesPage() {
  return <GamesHub />;
}
