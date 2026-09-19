import { registerPlugin, WebPlugin } from "@capacitor/core";

/** First-party iOS overlay WKWebView — not `@capacitor/browser` / SFSafari. */

export type HouseDoorOpenOptions = {
  url: string;
  title: string;
  closeLabel: string;
};

export interface HouseDoorBrowserPlugin {
  open(options: HouseDoorOpenOptions): Promise<void>;
}

export class HouseDoorBrowserWeb extends WebPlugin implements HouseDoorBrowserPlugin {
  async open(options: HouseDoorOpenOptions): Promise<void> {
    if (typeof window === "undefined") return;
    const opened = window.open(options.url, "_blank", "noopener,noreferrer");
    if (opened) opened.opener = null;
  }
}

export const HouseDoorBrowser = registerPlugin<HouseDoorBrowserPlugin>("HouseDoorBrowser", {
  web: () => Promise.resolve(new HouseDoorBrowserWeb()),
});
