import { createFileRoute, redirect } from "@tanstack/react-router";

/** The reading-first home is `/`. This address stays for older links and sign-in returns. */
export const Route = createFileRoute("/today")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
});
