import { createFileRoute, Link } from "@tanstack/react-router";
import { DayShadow } from "@/components/square/day-shadow";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/")({ component: Home });

/** `/` = ظل اليوم بطل واحد + عدّاد حي. الميدان على `/maydan`. */
function Home() {
  const lang = useAppStore((s) => s.lang);
  return (
    <div className="mx-auto max-w-xl" data-home-hero="day-shadow">
      <DayShadow />
      <p className="mt-8 text-center text-sm text-subtle">
        <Link to="/maydan" className="text-primary hover:underline">
          {t(lang, "home")}
        </Link>
      </p>
    </div>
  );
}
