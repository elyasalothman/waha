import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

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
  const reader = useRef<HTMLElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const headerHeight = useRef(56);

  // Do this before either reader's passive restore/load effects mount its article.
  // In particular, the private reader initially calls this hook with active=false.
  useLayoutEffect(() => holdReaderScrollRestoration(window.history), []);

  const measure = useCallback(() => {
    const root = reader.current;
    const controls = toolbar.current;
    if (!root || !controls) return;
    const header = document.querySelector<HTMLElement>(".waha-shell .native-safe-top");
    headerHeight.current = header?.getBoundingClientRect().height ?? 56;
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
  }, [active, measure]);

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
    (target: HTMLElement | null) => {
      // Measure now as well as on ResizeObserver, before positioning a jump.
      measure();
      target?.scrollIntoView({ block: "start", behavior: "instant" });
    },
    [measure],
  );

  return { reader, toolbar, getViewport, scrollTo };
}
