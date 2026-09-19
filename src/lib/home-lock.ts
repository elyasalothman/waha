/** King IA lock: `/` is a quiet day-shadow. Games and the Maydan line are never the hero. */
export type HomeItem = { id: string; category: string; lane: string };

export function isPlayItem(item: HomeItem): boolean {
  return item.category === "games" || item.lane === "play" || item.id === "luma";
}

export function forSeriousHome<T extends HomeItem>(items: T[]): T[] {
  return items.filter((item) => !isPlayItem(item));
}
