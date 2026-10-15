import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/home-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "واحتك الرقمية · واحة" },
      {
        name: "description",
        content: "أدوات يومك العربية: الصلاة والكتب والألعاب والتنظيم في مكان واحد.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return <HomePage />;
}
