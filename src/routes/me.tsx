import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/settings-page";

/** Same page as /settings. Kept so the OAuth callback /me does not redirect. */
export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "الحساب والإعدادات · واحة" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "حسابك وإعدادات واحة على هذا الجهاز." },
    ],
  }),
  component: SettingsPage,
});
