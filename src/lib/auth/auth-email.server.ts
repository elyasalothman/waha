/** Transactional auth email via Resend (server-only). Never logs addresses or codes. */
const env = (key: string, source: Record<string, string | undefined> = process.env) => {
  const value = source[key]?.trim();
  return value ? value : undefined;
};

export function authEmailConfigured(source: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env("RESEND_API_KEY", source) && env("AUTH_EMAIL_FROM", source));
}

type AuthEmail = { subject: string; text: string; html: string };

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

/** Right-to-left Arabic shell so Gmail/Outlook render the message correctly. */
function rtlHtml(body: string): string {
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head><body dir="rtl" style="margin:0;padding:24px;background:#f6f3ec;font-family:Tahoma,Arial,sans-serif;direction:rtl;text-align:right;color:#1f2a24"><div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:24px;line-height:1.8"><div style="font-size:20px;font-weight:bold;margin-bottom:12px">واحة</div>${body}<div style="margin-top:20px;font-size:12px;color:#6b7280">إن لم تطلب هذه الرسالة، تجاهلها.</div></div></body></html>`;
}

export function resetPasswordEmail(url: string): AuthEmail {
  const safe = escapeHtml(url);
  return {
    subject: "استعادة كلمة مرور واحة",
    text: `لاستعادة كلمة مرورك في واحة، افتح الرابط التالي:\n${url}\nإن لم تطلب ذلك، تجاهل هذه الرسالة.`,
    html: rtlHtml(
      `<p style="margin:0 0 16px">لاستعادة كلمة مرورك في واحة، اضغط الزر التالي:</p><p style="margin:0 0 16px"><a href="${safe}" style="display:inline-block;background:#1f6f4a;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold">تعيين كلمة مرور جديدة</a></p><p style="margin:0;font-size:12px;color:#6b7280;word-break:break-all" dir="ltr">${safe}</p>`,
    ),
  };
}

export function otpEmail(otp: string, type: string): AuthEmail {
  const purpose =
    type === "forget-password"
      ? "لاستعادة كلمة مرورك"
      : type === "email-verification"
        ? "لتأكيد بريدك"
        : "للدخول إلى حسابك";
  return {
    subject: `رمز واحة: ${otp}`,
    text: `رمزك ${purpose} في واحة هو: ${otp}\nصالح لمدة 10 دقائق. لا تشاركه مع أحد.\nإن لم تطلبه، تجاهل هذه الرسالة.`,
    html: rtlHtml(
      `<p style="margin:0 0 12px">رمزك ${purpose} في واحة:</p><div dir="ltr" style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;background:#f0f7f3;border-radius:12px;padding:12px 0;margin:0 0 12px">${escapeHtml(otp)}</div><p style="margin:0">صالح لمدة 10 دقائق. لا تشاركه مع أحد.</p>`,
    ),
  };
}

export async function sendAuthEmail(message: { to: string; subject: string; text: string; html?: string }) {
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
