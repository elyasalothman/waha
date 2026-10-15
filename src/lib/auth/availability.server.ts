/** Public capability flags only: never expose environment values. */
export function authAvailability(env: Record<string, string | undefined> = process.env) {
  const has = (keys: string[]) => keys.every((key) => Boolean(env[key]?.trim()));
  const email =
    env.VITE_AUTH_ENABLED !== "false" &&
    has(["DATABASE_URL", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL"]);
  return {
    email,
    google: email && has(["GROK_AUTH_CLIENT_ID", "GROK_AUTH_CLIENT_SECRET"]),
    passwordReset: email && has(["RESEND_API_KEY", "AUTH_EMAIL_FROM"]),
  };
}
