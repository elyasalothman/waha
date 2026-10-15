import { useEffect, useState } from "react";
import { INTERESTS, interestKey, normalizeInterests } from "@/lib/interests";
import { signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Link } from "@tanstack/react-router";
import { HouseDoors } from "@/components/house-doors";
import { PersonalDay } from "@/components/personal-day";
import { Compass } from "lucide-react";
import { CompanyWatchlist } from "@/components/company-watchlist";
import { DailyActions } from "@/components/daily-actions";
import { useAppStore } from "@/store/app-store";

export function HomePage() {
  const { user } = useCurrentUserState();
  const [signOutError, setSignOutError] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  useEffect(() => {
    try {
      setInterests(
        normalizeInterests(JSON.parse(localStorage.getItem(interestKey(user?.id)) || "[]")),
      );
    } catch {
      /* Default daily view remains available. */
    }
  }, [user?.id]);
  const lang = useAppStore((s) => s.lang);
  return (
    <div
      className="daily-home mx-auto max-w-3xl"
      data-home-sections="hayat house-sites news watchlist shortcuts"
      data-guest-read="open"
    >
      <header className="daily-heading mb-5 flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl tracking-tight">
          {lang === "ar" ? "يومك في واحة" : "Your day in Waha"}
        </h1>
        <Link
          to="/more"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-medium text-primary hover:bg-surface-2"
        >
          <Compass className="size-4" aria-hidden="true" />
          {lang === "ar" ? "استكشف" : "Explore"}
        </Link>
      </header>
      <div className="mb-4 flex items-center gap-3 text-sm">
        {user && !user.isDevFallback ? (
          <>
            <span className="min-w-0 flex-1 truncate">أهلًا، {user.displayName || "بك"}</span>
            <button
              disabled={signingOut}
              className="inline-flex min-h-11 items-center px-4 text-primary underline"
              onClick={async () => {
                setSigningOut(true);
                setSignOutError(false);
                try {
                  await signOut("/welcome");
                } catch {
                  setSignOutError(true);
                  setSigningOut(false);
                }
              }}
            >
              {signingOut ? "جارٍ الخروج…" : "تسجيل الخروج"}
            </button>
          </>
        ) : (
          <Link
            to="/register"
            search={{ mode: "signup" }}
            className="inline-flex min-h-11 items-center text-primary underline"
          >
            تسجيل حساب في واحة
          </Link>
        )}
      </div>
      {signOutError && (
        <p role="alert" className="mb-4 text-sm text-danger">
          تعذّر تسجيل الخروج. أعد المحاولة.
        </p>
      )}
      <section
        className="mb-5 rounded-xl border border-border bg-surface p-4"
        aria-label="اهتماماتك"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-medium">على ذوقك</h2>
          <Link
            to="/onboarding"
            className="inline-flex min-h-11 items-center text-sm text-primary underline"
          >
            خصص يومك
          </Link>
        </div>
        {interests.length ? (
          <div className="flex flex-wrap gap-2">
            {INTERESTS.filter((item) => interests.includes(item.id)).map((item) => (
              <a
                key={item.id}
                href={item.href}
                className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm"
              >
                {item.label}
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">اختر اهتماماتك لتجدها هنا في كل زيارة.</p>
        )}
      </section>
      <div className="space-y-4">
        <PersonalDay userId={user?.id} interests={interests} />
        <HouseDoors />
        <CompanyWatchlist lang={lang} />
        <DailyActions lang={lang} />
      </div>
    </div>
  );
}
