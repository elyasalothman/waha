import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/settings-page";
export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "الإعدادات والتخصيص · واحة" }, { name: "robots", content: "noindex" }],
  }),
  component: SettingsPage,
});
