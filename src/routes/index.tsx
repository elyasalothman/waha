import { createFileRoute } from "@tanstack/react-router";
import { HomeLauncher } from "@/components/os/home-launcher";
import { useAppStore } from "@/store/app-store";
import { WorkHome } from "@/components/os/work-home";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const audience = useAppStore((s) => s.audience);
  return audience === "work" ? <WorkHome /> : <HomeLauncher />;
}
