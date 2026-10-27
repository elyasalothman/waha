/** Transactional auth email via Resend (server-only). Never logs addresses or codes. */
const env = (key: string, source: Record<string, string | undefined> = process.env) => {
  const value = source[key]?.trim();
  return value ? value : undefined;
};

export function authEmailConfigured(source: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env("RESEND_API_KEY", source) && env("AUTH_EMAIL_FROM", source));
}

export function otpEmail(otp: string, type: string): { subject: string; text: string } {
  const purpose =
    type === "forget-password"
      ? "لاستعادة كلمة مرورك"
      : type === "email-verification"
        ? "لتأكيد بريدك"
        : "للدخول إلى حسابك";
  return {
    subject: `رمز واحة: ${otp}`,
    text: `رمزك ${purpose} في واحة هو: ${otp}\nصالح لمدة 10 دقائق. لا تشاركه مع أحد.\nإن لم تطلبه، تجاهل هذه الرسالة.`,
  };
}

export async function sendAuthEmail(message: { to: string; subject: string; text: string }) {
  const result = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: env("AUTH_EMAIL_FROM"), ...message }),
    signal: AbortSignal.timeout(10000),
  });
  if (!result.ok) throw new Error("Auth email delivery failed");
}
