import { createFileRoute } from "@tanstack/react-router";
import { ChatApp } from "@/apps/studio/chat";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/studio")({ component: StudioPage });

function StudioPage() {
  const lang = useAppStore((s) => s.lang);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 font-display text-4xl">{t(lang, "studio")}</h1>
      <p className="mb-6 text-muted">{t(lang, "studioBlurb")}</p>
      <ChatApp />
    </div>
  );
}
