import { createFileRoute } from "@tanstack/react-router";
import { SquarePage } from "@/components/square/square-page";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <SquarePage />;
}
