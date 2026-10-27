import { test } from "node:test";
import assert from "node:assert/strict";
import { authEmailConfigured, otpEmail, resetPasswordEmail } from "./auth-email.server.ts";

test("auth email is off unless both Resend key and sender are set", () => {
  assert.equal(authEmailConfigured({}), false);
  assert.equal(authEmailConfigured({ RESEND_API_KEY: "x" }), false);
  assert.equal(authEmailConfigured({ RESEND_API_KEY: "x", AUTH_EMAIL_FROM: " " }), false);
  assert.equal(authEmailConfigured({ RESEND_API_KEY: "x", AUTH_EMAIL_FROM: "واحة <no-reply@hajdah.com>" }), true);
});

test("OTP email is Arabic RTL with the code in text and html", () => {
  const mail = otpEmail("123456", "sign-in");
  assert.match(mail.subject, /123456/);
  assert.match(mail.text, /للدخول إلى حسابك/);
  assert.match(mail.html, /dir="rtl"/);
  assert.match(mail.html, /123456/);
});

test("reset email escapes the link and keeps RTL", () => {
  const mail = resetPasswordEmail('https://waha.hajdah.com/reset?token=a"b<c');
  assert.match(mail.html, /dir="rtl"/);
  assert.ok(!mail.html.includes('a"b<c'));
  assert.match(mail.html, /a&quot;b&lt;c/);
  assert.match(mail.text, /token=a"b<c/);
});
