import { createFileRoute } from "@tanstack/react-router";
import { StoreFront } from "@/components/store-front";
export const Route = createFileRoute("/store")({
  head: () => ({
    meta: [
      { title: "المتجر · واحة" },
      {
        name: "description",
        content: "منتجات بيت الهجدة: تعلّم واقرأ والعب. مجانية لفترة الإطلاق، مع مكتبتك المحلية.",
      },
    ],
  }),
  component: StoreFront,
});
