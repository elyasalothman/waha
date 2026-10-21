import { createFileRoute, Link } from "@tanstack/react-router";
import { HomePage } from "@/components/home-page";
export const Route = createFileRoute("/me")({
  head: () => ({ meta: [{ title: "أنا · واحة" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <>
      <Link
        to="/settings"
        className="mx-auto mb-5 flex min-h-12 max-w-3xl items-center rounded-xl border border-border p-4 text-primary"
      >
        ⚙ الإعدادات والتخصيص ←
      </Link>
      <HomePage />
    </>
  ),
});
