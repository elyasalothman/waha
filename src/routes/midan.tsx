import { createFileRoute } from "@tanstack/react-router";
import { SquarePage } from "@/components/square/square-page";

export const Route = createFileRoute("/midan")({ component: MidanPage });

function MidanPage() {
  return <SquarePage />;
}
