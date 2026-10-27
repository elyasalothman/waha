import { PrivacyLinks } from "@/components/privacy-links";
import { createFileRoute, Link } from "@tanstack/react-router";
import { HomePage } from "@/components/home-page";
import { PasskeyCard } from "@/components/passkey-card";
import { DesktopDownloadLink } from "@/components/desktop-download";
export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "أنا · واحة" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "حسابك وتفضيلاتك ومتابعتك في واحة." },
    ],
  }),
  component: () => (
    <>
      <Link
        to="/settings"
        className="mx-auto mb-5 flex min-h-12 max-w-3xl items-center rounded-xl border border-border p-4 text-primary"
      >
        ⚙ الإعدادات والتخصيص ←
      </Link>
      <PasskeyCard />
      <div className="mx-auto mb-5 flex max-w-3xl">
        <DesktopDownloadLink className="flex min-h-12 w-full items-center gap-2 rounded-xl border border-border p-4 text-primary" />
      </div>
      <PrivacyLinks />
      <HomePage />
    </>
  ),
});
