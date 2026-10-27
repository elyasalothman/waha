import { useEffect, useState } from "react";
import { Monitor } from "lucide-react";
import { isNativeApp } from "@/lib/auth/social";

export const DESKTOP_DOWNLOAD_URL = "https://alhajda.com/download/waha/";

/** «تنزيل للكمبيوتر — ويندوز وماك». Hidden inside the phone app (store rules). */
export function DesktopDownloadLink({ className = "landing-secondary" }: { className?: string }) {
  const [native, setNative] = useState(true);
  useEffect(() => setNative(isNativeApp()), []);
  if (native) return null;
  return (
    <a className={className} href={DESKTOP_DOWNLOAD_URL} rel="noopener">
      <Monitor size={18} aria-hidden="true" /> تنزيل للكمبيوتر — ويندوز وماك
    </a>
  );
}
