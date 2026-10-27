import { Link } from "@tanstack/react-router";
import { internalHouseHref } from "@/lib/house-integrations";
import { useState } from "react";
import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { openExternalUrl } from "@/lib/native-browser";

/** House https → in-app WKWebView on iOS; gov portals → Browser; web → new tab. */
export function ExternalLink({
  href,
  direct = false,
  onClick,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; direct?: boolean }) {
  const [error, setError] = useState("");
  const internal =
    href.startsWith("/") && !href.startsWith("//")
      ? href
      : direct
        ? undefined
        : internalHouseHref(href);
  if (internal)
    return (
      <Link to={internal} onClick={onClick} {...props}>
        {children}
      </Link>
    );
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    event.preventDefault();
    void openExternalUrl(href, {}, direct).then(
      (result) => {
        if (!result.ok) setError("تعذّر فتح الرابط؛ أعد المحاولة.");
      },
      () => setError("تعذّر فتح الرابط؛ أعد المحاولة."),
    );
  };

  return (
    <>
      <a href={href} target="_blank" rel="noreferrer" onClick={handleClick} {...props}>
        {children}
      </a>
      {error && (
        <span role="status" className="text-sm text-danger">
          {error}
        </span>
      )}
    </>
  );
}
