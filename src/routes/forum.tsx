import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/forum")({
  head: () => ({
    meta: [
      { title: "مجالس واحة · واحة" },
      { name: "description", content: "مجالس عربية للنقاش ومشاركة الأفكار." },
    ],
  }),
  component: ForumLayout,
});

function ForumLayout() {
  return <Outlet />;
}
