import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/forum/$board")({ component: ForumBoardLayout });

function ForumBoardLayout() {
  return <Outlet />;
}
