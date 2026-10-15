import { createFileRoute } from "@tanstack/react-router";
import { GamesHub } from "@/components/games-hub";

export const Route = createFileRoute("/games")({
  head: () => ({
    meta: [
      { title: "الألعاب · واحة" },
      {
        name: "description",
        content: "ألعاب عربية خفيفة للذاكرة والكلمات والأرقام، مناسبة للجوال.",
      },
    ],
  }),
  component: GamesPage,
});

function GamesPage() {
  return <GamesHub />;
}
