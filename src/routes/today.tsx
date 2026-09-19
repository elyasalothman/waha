import { createFileRoute } from "@tanstack/react-router";
import { FamilyTodayBoard } from "@/components/os/family-today-board";

export const Route = createFileRoute("/today")({ component: TodayPage });

function TodayPage() {
  return <FamilyTodayBoard />;
}
