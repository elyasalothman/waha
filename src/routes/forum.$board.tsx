import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/forum/$board")({
  head: () => ({
    meta: [
      { title: "المجلس · واحة" },
      { name: "description", content: "موضوعات ونقاشات المجلس في واحة." },
    ],
  }),
  component: ForumBoardLayout,
});

function ForumBoardLayout() {
  return <Outlet />;
}
