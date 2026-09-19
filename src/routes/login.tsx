import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/components/os/login-form";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  return <LoginForm />;
}
