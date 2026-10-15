import { createFileRoute, Navigate } from "@tanstack/react-router";
import { WelcomePage } from "@/components/welcome-page";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { welcomeHead } from "@/lib/welcome-seo";
export const Route = createFileRoute("/")({ head: welcomeHead, component: Home });
function Home() {
  const { user, isPending } = useCurrentUserState();
  if (!isPending && user && !user.isDevFallback) return <Navigate to="/today" replace />;
  return <WelcomePage />;
}
