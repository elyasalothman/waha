import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { SignInButtons } from "@/lib/auth/gates";
import { authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import type { SquareProfile } from "@/lib/square/types";
import type { Lang } from "@/lib/i18n";

export function ProfilePanel({
  open,
  lang,
  profile,
  onClose,
  onSave,
}: {
  open: boolean;
  lang: Lang;
  profile: SquareProfile;
  onClose: () => void;
  onSave: (profile: SquareProfile) => void;
}) {
  const { user, isPending } = useCurrentUserState();
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  useEffect(() => {
    if (!open) return;
    const signedName = user && !user.isDevFallback ? (user.displayName ?? "").trim() : "";
    setName(profile.name || signedName);
    setBio(profile.bio);
  }, [open, profile.name, profile.bio, user]);

  if (!open) return null;

  const realSession = Boolean(authEnabled && user && !user.isDevFallback);
  const showSignIn = authEnabled && !isPending && !user;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <button type="button" className="absolute inset-0 bg-bg/70" aria-label={L("إغلاق", "Close")} onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-t-xl border border-border bg-surface p-5 shadow-(--shadow-soft) sm:rounded-xl">
        <h2 className="font-display text-2xl">{L("ملفك في الميدان", "Your Square profile")}</h2>
        <p className="mt-1 text-sm text-muted">
          {L("اسم العرض ونبذة تُحفظان على هذا الجهاز. الحساب اختياري.", "Display name and bio stay on this device. An account is optional.")}
        </p>
        <label className="mt-4 block text-xs text-muted">{L("اسم العرض", "Display name")}</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder={L("ضيف الواحة", "Oasis guest")} className="mt-1" />
        <label className="mt-3 block text-xs text-muted">{L("نبذة", "Bio")}</label>
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={160}
          rows={3}
          placeholder={L("سطر واحد عنك…", "A line about you…")}
          className="mt-1 min-h-20"
        />
        {realSession ? (
          <p className="mt-3 text-xs text-subtle">
            {L("مسجّل:", "Signed in:")} {user?.displayName ?? user?.primaryEmail}
          </p>
        ) : null}
        {showSignIn ? (
          <div className="mt-4">
            <p className="mb-2 text-xs text-muted">{L("تسجيل اختياري إن أحببت", "Optional sign-in")}</p>
            <SignInButtons />
          </div>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {L("إغلاق", "Close")}
          </Button>
          <Button
            type="button"
            onClick={() => {
              onSave({ name, bio });
              onClose();
            }}
          >
            {L("حفظ", "Save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
