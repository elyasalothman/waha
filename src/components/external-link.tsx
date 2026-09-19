import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { openExternalUrl } from "@/lib/native-browser";

/** House https → in-app WKWebView on iOS; gov portals → Browser; web → new tab. */
export function ExternalLink({
  href,
  onClick,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
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
