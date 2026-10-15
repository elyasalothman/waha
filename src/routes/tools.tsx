import { createFileRoute, Link } from "@tanstack/react-router";
import { featureButton } from "@/lib/share-card";
import { Hub } from "@/components/hub";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "الأدوات · واحة" },
      {
        name: "description",
        content: "حاسبات وتحويل وحدات وأدوات نصوص وتواريخ ورموز QR باللغة العربية.",
      },
    ],
  }),
  component: ToolsPage,
});

function ToolsPage() {
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-2" aria-label="أدوات مدمجة">
        <Link to="/compare" className={featureButton}>
          قرارك · مقارنة الخيارات
        </Link>
        <Link to="/app/$id" params={{ id: "vat" }} className={featureButton}>
          حاسبة الضريبة
        </Link>
        <Link to="/app/$id" params={{ id: "calc" }} className={featureButton}>
          الحاسبة العلمية
        </Link>
      </nav>
      <Hub category="tools" />
    </div>
  );
}
