import { createFileRoute } from "@tanstack/react-router";
import { SquarePage } from "@/components/square/square-page";

export const Route = createFileRoute("/maydan")({ component: MaydanPage });

function MaydanPage() {
  return <SquarePage />;
}
