import assert from "node:assert/strict";
import test from "node:test";
import { normalizeInterests, interestKey } from "./interests.ts";
import { authAvailability } from "./auth/availability.server.ts";
test("interest preferences reject malformed data and unknown or duplicate IDs", () => {
  assert.deepEqual(normalizeInterests(null), []);
  assert.deepEqual(normalizeInterests({ faith: true }), []);
  assert.deepEqual(normalizeInterests(["fun", "faith", "faith", "<script>"]), ["faith", "fun"]);
  assert.notEqual(interestKey("user-a"), interestKey("user-b"));
});
test("authentication capabilities require persistent storage and independent provider configuration", () => {
  assert.deepEqual(authAvailability({}), {
    email: false,
    deleteAccount: false,
    google: false,
    apple: false,
    passkey: false,
    emailOtp: false,
    passwordReset: false,
  });
  const core = {
    DATABASE_URL: "postgres://db",
    BETTER_AUTH_SECRET: "secret",
    BETTER_AUTH_URL: "https://waha.hajdah.com",
  };
  assert.deepEqual(authAvailability(core), {
    email: true,
    deleteAccount: true,
    google: false,
    apple: false,
    passkey: true,
    emailOtp: false,
    passwordReset: false,
  });
  assert.deepEqual(
    authAvailability({
      ...core,
      GOOGLE_CLIENT_ID: "id",
      GOOGLE_CLIENT_SECRET: "secret",
      APPLE_CLIENT_ID: "com.example.web",
      APPLE_TEAM_ID: "TEAM",
      APPLE_KEY_ID: "KEY",
      APPLE_PRIVATE_KEY: "pem",
      RESEND_API_KEY: "key",
      AUTH_EMAIL_FROM: "Waha <auth@example.com>",
    }),
    {
      email: true,
      deleteAccount: true,
      google: true,
      apple: true,
      passkey: true,
      emailOtp: true,
      passwordReset: true,
    },
  );
  assert.equal(authAvailability({ ...core, VITE_AUTH_ENABLED: "false" }).email, false);
  assert.equal(authAvailability({ ...core, DATABASE_URL: " " }).email, false);
});
