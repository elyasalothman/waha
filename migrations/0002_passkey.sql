-- Passkeys (WebAuthn) for Better Auth's @better-auth/passkey plugin.
-- camelCase columns stay double-quoted (Better Auth queries them by that case).
create table if not exists "passkey" (
  "id" text not null primary key,
  "name" text,
  "publicKey" text not null,
  "userId" text not null references "user" ("id") on delete cascade,
  "credentialID" text not null,
  "counter" integer not null,
  "deviceType" text not null,
  "backedUp" boolean not null,
  "transports" text,
  "createdAt" timestamptz default CURRENT_TIMESTAMP,
  "aaguid" text
);
create index if not exists "passkey_userId_idx" on "passkey" ("userId");
create index if not exists "passkey_credentialID_idx" on "passkey" ("credentialID");
