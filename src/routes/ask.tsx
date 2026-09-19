import { createFileRoute } from "@tanstack/react-router";
import { ChatApp } from "@/apps/studio/chat";
import { t } from "@/lib/i18n";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/ask")({ component: AskPage });

function AskPage() {
  const lang = useAppStore((s) => s.lang);
  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-1 text-xs tracking-wide text-muted">{t(lang, "ask")}</p>
      <h1 className="mb-6 font-display text-4xl tracking-tight">{t(lang, "ask")}</h1>
      <ChatApp />
    </div>
  );
}
