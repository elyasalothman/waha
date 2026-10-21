import { isReaderToggleTap } from "@/lib/books/reader-interaction";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export const READING_GAP = 16;

export function readingScrollOffset(headerHeight: number, toolbarHeight: number): number {
  return Math.ceil(Math.max(0, headerHeight) + Math.max(0, toolbarHeight) + READING_GAP);
}

/** A semantic paragraph anchor must win over a stale native pixel position. */
export function holdReaderScrollRestoration(history: Pick<History, "scrollRestoration">) {
  if (!("scrollRestoration" in history)) return () => {};
  const previous = history.scrollRestoration;
  history.scrollRestoration = "manual";
  let released = false;
  return () => {
    if (released) return;
    released = true;
    history.scrollRestoration = previous;
  };
}

/** Ignore both covered content and paragraphs still below the visible viewport. */
export function firstVisibleReadingAnchor<
  T extends { id: string; getBoundingClientRect(): { top: number; bottom: number } },
>(nodes: Iterable<T>, top: number, bottom: number): T | undefined {
  if (bottom <= top) return undefined;
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (rect.bottom > rect.top && rect.bottom > top && rect.top < bottom) return node;
  }
  return undefined;
}

/** Shared geometry for both readers, including multi-row mobile controls. */
export function useReaderLayout(active = true) {
  const [controlsVisible, setControlsVisible] = useState(false);
  const reader = useRef<HTMLElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const headerHeight = useRef(56);
  const scrollRequest = useRef(0);

  useLayoutEffect(() => {
    if (!active) return;
    document.documentElement.dataset.readerControls = controlsVisible ? "visible" : "hidden";
    return () => {
      delete document.documentElement.dataset.readerControls;
    };
  }, [active, controlsVisible]);

  useEffect(() => {
    if (!active) return;
    let start: { x: number; y: number } | undefined;
    const down = (event: PointerEvent) => {
      start = { x: event.clientX, y: event.clientY };
    };
    const tap = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || !reader.current?.contains(event.target)) return;
      if (
        !isReaderToggleTap({
          x: event.clientX,
          y: event.clientY,
          width: innerWidth,
          height: innerHeight,
          start,
          interactive: Boolean(
            event.target.closest(
              "a, button, input, select, textarea, label, summary, [role=button]",
            ),
          ),
          selection: window.getSelection()?.toString() ?? "",
        })
      )
        return;
      setControlsVisible((value) => !value);
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector('[role="dialog"], dialog[open]'))
        setControlsVisible(true);
    };
    document.addEventListener("pointerdown", down);
    document.addEventListener("click", tap);
    document.addEventListener("keydown", keyboard);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("click", tap);
      document.removeEventListener("keydown", keyboard);
    };
  }, [active]);

  // Do this before either reader's passive restore/load effects mount its article.
  // In particular, the private reader initially calls this hook with active=false.
  useLayoutEffect(() => holdReaderScrollRestoration(window.history), []);

  const measure = useCallback(() => {
    const root = reader.current;
    const controls = toolbar.current;
    if (!root || !controls) return;
    const header = document.querySelector<HTMLElement>(".waha-shell .native-safe-top");
    headerHeight.current = header?.getBoundingClientRect().height ?? 0;
    root.style.setProperty("--reader-header-height", `${headerHeight.current}px`);
    root.style.setProperty(
      "--reader-scroll-offset",
      `${readingScrollOffset(headerHeight.current, controls.getBoundingClientRect().height)}px`,
    );
  }, []);

  useEffect(() => {
    if (!active || !toolbar.current) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(toolbar.current);
    const header = document.querySelector<HTMLElement>(".waha-shell .native-safe-top");
    if (header) observer.observe(header);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [active, controlsVisible, measure]);

  const getViewport = useCallback(() => {
    const visual = window.visualViewport;
    const top =
      Math.max(
        visual?.offsetTop ?? 0,
        headerHeight.current,
        toolbar.current?.getBoundingClientRect().bottom ?? 0,
      ) + READING_GAP;
    const bottomBar = document
      .querySelector<HTMLElement>(".waha-shell > nav")
      ?.getBoundingClientRect();
    const bottom = Math.min(
      window.innerHeight,
      visual ? visual.offsetTop + visual.height : window.innerHeight,
      bottomBar && bottomBar.height > 0 ? bottomBar.top : window.innerHeight,
    );
    return { top, bottom };
  }, []);

  const scrollTo = useCallback(
    async (target: HTMLElement | null) => {
      const request = ++scrollRequest.current;
      // A cold-cache font swap changes paragraph heights. Keep each reader's
      // pending anchor until those metrics settle, before tracking scroll again.
      // Resolve style/layout first so newly mounted chapter fonts are requested.
      target?.getBoundingClientRect();
      await document.fonts.ready;
      if (!target?.isConnected || request !== scrollRequest.current) return;
      // Measure now as well as on ResizeObserver, before positioning a jump.
      measure();
      target.scrollIntoView({ block: "start", behavior: "instant" });
    },
    [measure],
  );

  return {
    reader,
    toolbar,
    getViewport,
    scrollTo,
    controlsVisible,
    toggleControls: () => setControlsVisible((value) => !value),
  };
}
