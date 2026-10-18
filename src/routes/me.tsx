import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/home-page";
export const Route = createFileRoute("/me")({
  head: () => ({ meta: [{ title: "أنا · واحة" }, { name: "robots", content: "noindex" }] }),
  component: HomePage,
});
