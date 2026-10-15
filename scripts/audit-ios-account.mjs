import { request } from "playwright";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
const baseURL = process.argv[2] || "https://waha.hajdah.com";
const proxyURL = process.env.HTTPS_PROXY ? new URL(process.env.HTTPS_PROXY) : null;
const context = await request.newContext({
  baseURL,
  ...(proxyURL
    ? {
        proxy: {
          server: proxyURL.origin,
          username: decodeURIComponent(proxyURL.username),
          password: decodeURIComponent(proxyURL.password),
          bypass: "localhost,127.0.0.1",
        },
      }
    : {}),
  extraHTTPHeaders: { Origin: new URL(baseURL).origin },
});
const password = randomBytes(24).toString("hex");
const email = `waha-release-${randomBytes(12).toString("hex")}@example.com`;
let created = false;
let deleted = false;
try {
  const flags = await (await context.get("/api/auth-status")).json();
  if (!flags.email) {
    assert.equal(flags.email, false);
    assert.equal(flags.google, false);
    console.log("Account creation disabled; native guest release gate passed");
  } else {
    assert.equal(
      flags.deleteAccount,
      true,
      "Deletion support must be deployed before creating a test account",
    );
    const signup = await context.post("/api/auth/sign-up/email", {
      data: { name: "Waha release check", email, password },
    });
    assert.equal(signup.ok(), true, `Signup HTTP ${signup.status()}`);
    created = true;
    assert.ok(
      (await (await context.get("/api/auth/get-session?disableCookieCache=true")).json())?.user,
    );
    assert.equal((await context.post("/api/auth/sign-out", { data: {} })).ok(), true);
    const login = await context.post("/api/auth/sign-in/email", { data: { email, password } });
    assert.equal(login.ok(), true, `Login HTTP ${login.status()}`);
    const removal = await context.post("/api/auth/delete-user", { data: { password } });
    assert.equal(removal.ok(), true, `Deletion HTTP ${removal.status()}`);
    assert.equal((await removal.json()).success, true);
    deleted = true;
    assert.equal(
      await (await context.get("/api/auth/get-session?disableCookieCache=true")).json(),
      null,
    );
    assert.equal(
      (await context.post("/api/auth/sign-in/email", { data: { email, password } })).ok(),
      false,
    );
    console.log(
      "PASS: signup, persisted session, logout, login, account deletion, rejected deleted identity",
    );
  }
} finally {
  if (created && !deleted) {
    const cleanup = await context.post("/api/auth/delete-user", { data: { password } });
    if (!cleanup.ok())
      console.error(`Release test cleanup required for ${email}; HTTP ${cleanup.status()}`);
  }
  await context.dispose();
}
