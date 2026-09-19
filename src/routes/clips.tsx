import { createFileRoute } from "@tanstack/react-router";
import { ClipsPage } from "@/apps/clips/page";

export const Route = createFileRoute("/clips")({
  component: ClipsRoute,
});

function ClipsRoute() {
  return <ClipsPage />;
}
