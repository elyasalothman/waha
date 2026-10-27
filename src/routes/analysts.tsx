import { createFileRoute } from "@tanstack/react-router";
import { Analysts } from "@/components/analysts";
export const Route = createFileRoute("/analysts")({
  head: () => ({
    meta: [
      { title: "المحللون · واحة" },
      { name: "description", content: "آخر آراء المحللين من هدوء السوق مع تاريخها ومصادرها." },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-5 font-display text-3xl">المحللون</h1>
      <Analysts />
    </div>
  ),
});
