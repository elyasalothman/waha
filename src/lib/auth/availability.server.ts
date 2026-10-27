/** Public capability flags only: never expose environment values. */
export function authAvailability(env: Record<string, string | undefined> = process.env) {
  const has = (keys: string[]) => keys.every((key) => Boolean(env[key]?.trim()));
  const email =
    env.VITE_AUTH_ENABLED !== "false" &&
    has(["DATABASE_URL", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL"]);
  const mailer = has(["RESEND_API_KEY", "AUTH_EMAIL_FROM"]);
  return {
    email,
    deleteAccount: email,
    google: email && has(["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]),
    apple: email && has(["APPLE_CLIENT_ID", "APPLE_TEAM_ID", "APPLE_KEY_ID", "APPLE_PRIVATE_KEY"]),
    passkey: email,
    emailOtp: email && mailer,
    passwordReset: email && mailer,
  };
}
