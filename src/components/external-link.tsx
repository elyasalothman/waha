import { Link } from "@tanstack/react-router";
import { internalHouseHref } from "@/lib/house-integrations";
import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { openExternalUrl } from "@/lib/native-browser";

/** House https → in-app WKWebView on iOS; gov portals → Browser; web → new tab. */
export function ExternalLink({
  href,
  onClick,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const internal = internalHouseHref(href);
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
    void openExternalUrl(href);
  };

  return (
    <a href={href} target="_blank" rel="noreferrer" onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
