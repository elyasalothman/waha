import { createFileRoute } from "@tanstack/react-router";
import { DayPage } from "@/apps/day/page";

export const Route = createFileRoute("/day")({
  component: DayRoute,
});

function DayRoute() {
  return <DayPage />;
}
