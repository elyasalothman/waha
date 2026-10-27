import { Link } from "@tanstack/react-router";
import { STORIES, STORY_SHELF_LABEL, type StoryShelf } from "@/lib/books/stories";

const ORDER: StoryShelf[] = ["mystery-novella", "mystery-flash"];

export function StoriesCard() {
  return (
    <section
      className="mb-8 rounded-2xl border border-primary/25 bg-surface p-5 sm:p-6"
      data-stories-series="mystery"
    >
      <p className="text-xs text-primary">سلسلة · فريق الهجدة</p>
      <h2 className="mt-2 font-display text-3xl">قصص غموض</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        ألغاز سعودية تناسب العائلة، وكل الأدلة أمامك قبل الحل. رواية قصيرة جديدة كل أسبوع، ومعها قصص
        قصيرة جداً.
      </p>
      {ORDER.map((shelf) => {
        const list = STORIES.filter((s) => s.shelf === shelf);
        if (!list.length) return null;
        return (
          <div key={shelf} className="mt-5" data-story-shelf={shelf}>
            <h3 className="text-sm font-medium text-primary">{STORY_SHELF_LABEL[shelf]}</h3>
            <ul className="mt-2 grid gap-2">
              {list.map((story) => (
                <li key={story.slug}>
                  <Link
                    to="/books/stories/$slug"
                    params={{ slug: story.slug }}
                    className="block min-h-11 rounded-xl border border-border p-3 hover:border-primary/50"
                  >
                    <span className="font-display text-xl">{story.title}</span>
                    <span className="block text-xs text-muted">
                      {story.subtitle} · {story.chapters}{" "}
                      {story.shelf === "mystery-flash" ? "قصص" : "فصول"} · {story.minutes} دقيقة
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted">{story.hook}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
