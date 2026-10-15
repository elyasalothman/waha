import { createFileRoute } from "@tanstack/react-router";
import { ClipsPage } from "@/apps/clips/page";

export const Route = createFileRoute("/clips")({
  head: () => ({
    meta: [
      { title: "كليبس · واحة" },
      { name: "description", content: "اكتشف بوابة كليبس من داخل واحة." },
    ],
  }),
  component: ClipsRoute,
});

function ClipsRoute() {
  return <ClipsPage />;
}
