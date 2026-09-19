import { createFileRoute } from "@tanstack/react-router";
import { GamesYard } from "@/components/games-yard";

export const Route = createFileRoute("/games")({ component: GamesPage });

function GamesPage() {
  return <GamesYard />;
}
