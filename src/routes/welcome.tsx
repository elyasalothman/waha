import { createFileRoute } from "@tanstack/react-router";
import { WelcomePage } from "@/components/welcome-page";
import { welcomeHead } from "@/lib/welcome-seo";
export const Route = createFileRoute("/welcome")({ head: welcomeHead, component: WelcomePage });
