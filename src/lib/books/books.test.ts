import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SEED_POSTS } from "../square/seed.ts";
import { SQUARE_STORAGE_KEY, mergeFeed, emptyLocal } from "../square/logic.ts";
import { CLIPS_STORAGE_KEY } from "../clips/types.ts";
import { BOOK_CARDS, BOOK_IDS, BOOKS_SEED, BOOKS_SEED_COUNT, isAllowedBookHost } from "./seed.ts";
import { booksByUiSection, hydrateBooksState, listBooks, markOpened, uiSectionOf } from "./logic.ts";
import { BOOK_SEED_SECTIONS, BOOK_SOURCE_KINDS, BOOK_STAMP, BOOKS_STORAGE_KEY } from "./types.ts";
import {
  EMPTY_KUTUBI,
  KUTUBI_PUBLIC_DRAFT_STATUS,
  KUTUBI_STORAGE_KEY,
  accountOwnsKutubi,
  addToKutubi,
  hydrateKutubi,
  isOnKutubi,
  kutubiPublishesToPublic,
  listKutubiBooks,
  publicDraftOf,
  removeFromKutubi,
  requestPublicDraft,
} from "./kutubi.ts";
import cards from "./waha-kutub-shelf-cards-v1.json" with { type: "json" };
import lock from "./waha-kutub-shelf-seed-v1.json" with { type: "json" };

const FORBIDDEN = ["قرصنة", "pirate", "torrent", "mega.nz", "mediafire", "شراء ورقي", "amazon", "jarir", "إسلام ويب", "shamela", "sh.rewaya"];

describe("books seed lock", () => {
  it("ships the king-approved twelve shelf cards after pruning رياض الصالحين", () => {
    assert.equal(BOOKS_SEED.status, "king-approved");
    assert.equal(BOOKS_SEED.lock.doNotModifySeed, true);
    assert.equal(BOOK_CARDS.length, BOOKS_SEED_COUNT);
    assert.equal(BOOKS_SEED.books.length, 12);
    assert.equal((cards as { id: string }[]).length, 12);
    assert.equal(BOOKS_SEED.meta.count, 12);
    assert.deepEqual(BOOKS_SEED.meta.bySection, { أخلاق: 3, "علم شرعي": 4, "عام مفيد": 5 });
    assert.deepEqual(
      BOOK_CARDS.map((b) => b.id),
      BOOKS_SEED.books.map((b) => b.id),
    );
    assert.deepEqual(
      BOOK_CARDS.map((b) => b.url),
      (lock as typeof BOOKS_SEED).books.map((b) => b.url),
    );
    const riyad = BOOK_CARDS.filter((b) => b.titleAr === "رياض الصالحين");
    assert.equal(riyad.length, 1);
    assert.equal(riyad[0]?.id, "bk-akhlaq-01");
    assert.equal(riyad[0]?.url, "https://islamhouse.com/ar/books/231837/");
    assert.ok(BOOKS_SEED.meta.dropped.some((row) => row.includes("إسلام ويب")));
    assert.ok(BOOKS_SEED.meta.dropped.some((row) => row.includes("الشاملة")));
  });

  it("keeps every link on a marked legal host and refuses paper purchase", () => {
    assert.ok(BOOKS_SEED.lock.wave1NoPaperPurchase);
    assert.ok(BOOKS_SEED.books.every((book) => book.paperPurchase === false));
    assert.ok(BOOKS_SEED.books.every((book) => book.onMaydanFeed === false));
    for (const book of BOOK_CARDS) {
      assert.equal(isAllowedBookHost(book.url), true, book.id);
      assert.equal(book.stamp, BOOK_STAMP);
      assert.equal((BOOK_SOURCE_KINDS as readonly string[]).includes(book.sourceKind), true, book.id);
      assert.equal((BOOK_SEED_SECTIONS as readonly string[]).includes(book.section), true, book.id);
    }
    assert.equal(
      BOOK_CARDS.some((b) => b.sourceKind === "midad-original"),
      true,
    );
  });

  it("allows two الأربعون النووية cards only because the benefit differs", () => {
    assert.equal(BOOKS_SEED.lock.arbaeenTwoOkIfDifferentBenefit, true);
    const arbaeen = BOOK_CARDS.filter((b) => b.titleAr.includes("الأربعون النووية"));
    assert.equal(arbaeen.length, 2);
    assert.notEqual(arbaeen[0]?.benefitAr, arbaeen[1]?.benefitAr);
    assert.notEqual(arbaeen[0]?.url, arbaeen[1]?.url);
  });

  it("locks the council: /books, مداد door, no scrape, no 48-mix", () => {
    assert.equal(BOOKS_SEED.lock.route, "/books");
    assert.equal(BOOKS_SEED.lock.door, "باب مداد في الأبواب");
    assert.equal(BOOKS_SEED.lock.outsideMaydanFeed, true);
    assert.equal(BOOKS_SEED.lock.buildAfter, "clips-clean");
    assert.equal(BOOKS_SEED.replaces.includes("maydan-kutub-mufida"), true);
  });
});

describe("books store isolation", () => {
  it("uses waha:books:v1 and never Maydan, clips, or من العالم keys", () => {
    assert.equal(BOOKS_STORAGE_KEY, "waha:books:v1");
    assert.equal(SQUARE_STORAGE_KEY, "waha:square:v1");
    assert.equal(CLIPS_STORAGE_KEY, "waha:clips:v1");
    assert.equal(KUTUBI_STORAGE_KEY, "waha:kutubi:v1");
    assert.notEqual(BOOKS_STORAGE_KEY, SQUARE_STORAGE_KEY);
    assert.notEqual(BOOKS_STORAGE_KEY, CLIPS_STORAGE_KEY);
    assert.notEqual(BOOKS_STORAGE_KEY, "waha:square:world:v1");
    assert.notEqual(KUTUBI_STORAGE_KEY, BOOKS_STORAGE_KEY);
    assert.notEqual(KUTUBI_STORAGE_KEY, SQUARE_STORAGE_KEY);
    assert.notEqual(KUTUBI_STORAGE_KEY, CLIPS_STORAGE_KEY);
  });

  it("lists seed order only — no shuffle and no ranking", () => {
    assert.deepEqual(
      listBooks().map((b) => b.id),
      BOOK_IDS,
    );
    assert.equal(listBooks()[0]?.id, "bk-akhlaq-01");
    assert.equal(listBooks()[11]?.id, "bk-general-05");
  });

  it("groups the shelf into أخلاق / شرعي / مداد", () => {
    const groups = booksByUiSection();
    assert.deepEqual(
      groups.map((g) => g.section),
      ["أخلاق", "شرعي", "مداد"],
    );
    assert.deepEqual(
      groups.map((g) => g.books.length),
      [3, 4, 5],
    );
    assert.ok(groups[2]?.books.every((b) => b.sourceKind === "midad-original"));
    assert.equal(uiSectionOf({ section: "علم شرعي" }), "شرعي");
    assert.equal(uiSectionOf({ section: "عام مفيد" }), "مداد");
  });

  it("hydrates opened ids against the locked seed and ignores strangers", () => {
    const next = hydrateBooksState(
      { version: 1, seededIds: ["old"], opened: ["bk-akhlaq-01", "book-001", "clip-001"] },
      BOOK_IDS,
    );
    assert.deepEqual(next.seededIds, BOOK_IDS);
    assert.deepEqual(next.opened, ["bk-akhlaq-01"]);
    const marked = markOpened(next, "bk-general-01");
    assert.deepEqual(marked.opened, ["bk-akhlaq-01", "bk-general-01"]);
    assert.deepEqual(markOpened(marked, "seed-001").opened, marked.opened);
  });
});

describe("books stay off the Maydan line", () => {
  it("does not mix book ids or pirate copy into the 48-post seed", () => {
    assert.equal(SEED_POSTS.length, 48);
    const ids = new Set(SEED_POSTS.map((p) => p.id));
    for (const id of BOOK_IDS) assert.equal(ids.has(id), false, id);
    const blob = SEED_POSTS.map((p) => p.text).join("\n");
    assert.equal(blob.includes("كتب مفيدة"), false);
    assert.equal(blob.includes("رف الكتب"), false);
    for (const banned of FORBIDDEN) {
      assert.equal(blob.toLowerCase().includes(banned.toLowerCase()), false, banned);
    }
  });

  it("keeps mergeFeed free of book rows", () => {
    const feed = mergeFeed(emptyLocal(), "forYou", Date.now(), "ar");
    assert.equal(
      feed.some((item) => item.id.startsWith("bk-") || item.text.includes("كتاب مفيد")),
      false,
    );
  });

  it("keeps SquarePage and the books page from importing each other", () => {
    const square = readFileSync(new URL("../../components/square/square-page.tsx", import.meta.url), "utf8");
    const page = readFileSync(new URL("../../apps/books/page.tsx", import.meta.url), "utf8");
    const route = readFileSync(new URL("../../routes/books.tsx", import.meta.url), "utf8");
    const doors = readFileSync(new URL("../doors.ts", import.meta.url), "utf8");
    const strip = readFileSync(new URL("../../components/doors-strip.tsx", import.meta.url), "utf8");
    assert.doesNotMatch(square, /lib\/books|waha:books|kutub-shelf|waha:kutubi|كتبي/);
    assert.doesNotMatch(page, /square\/|maydan-seed|waha:square|من العالم|waha:clips/);
    assert.match(route, /createFileRoute\("\/books"\)/);
    assert.match(page, /data-book-stamp="visible"/);
    assert.match(page, /\{book\.stamp\}/);
    assert.match(page, /data-books-lane="shelf-v1"/);
    assert.match(page, /data-kutubi="local-v1"/);
    assert.match(page, /data-kutubi-publish="never"/);
    assert.match(page, /data-kutubi-scope="device"/);
    assert.match(page, /data-kutubi-auth="none"/);
    assert.doesNotMatch(page, /data-kutubi-guest/);
    assert.doesNotMatch(page, /useCurrentUserState|createAccount/);
    assert.match(page, /from ["']@\/components\/external-link["']/);
    assert.doesNotMatch(page, /<(input|form)\b/);
    assert.doesNotMatch(page, /fetch\(|scrape|cheerio|WebView/);
    assert.doesNotMatch(page, /kutubiPublishesToPublic\(\) \? true/);
    assert.match(doors, /MIDAD_SHELF_PATH = "\/books"/);
    assert.match(strip, /to="\/books"/);
    assert.match(strip, /doorOpensInternalShelf/);
  });

  it("opens باب مداد from the catalog onto /books — not a chrome tab, not featured on /", () => {
    const catalog = readFileSync(new URL("../catalog.ts", import.meta.url), "utf8");
    const nav = readFileSync(new URL("../nav.ts", import.meta.url), "utf8");
    const home = readFileSync(new URL("../../routes/index.tsx", import.meta.url), "utf8");
    const card = readFileSync(new URL("../../components/app-card.tsx", import.meta.url), "utf8");
    assert.match(catalog, /door\.id === "midad"/);
    assert.match(catalog, /portal: true/);
    assert.doesNotMatch(catalog, /id: "books"/);
    assert.doesNotMatch(nav, /to: "\/books"/);
    assert.match(card, /to="\/books"/);
    assert.match(home, /SquarePage/);
    assert.doesNotMatch(home, /BooksPage|lib\/books|waha:kutubi|كتبي|WebView/);
  });

  it("refuses forbidden lanes and pirate hosts in the shelf blob", () => {
    const blob = BOOK_CARDS.map((b) => `${b.titleAr} ${b.benefitAr} ${b.url} ${b.sourceLabel}`).join("\n");
    for (const banned of ["pirate", "torrent", "mega.nz", "mediafire", "شراء ورقي", "amazon", "jarir", "إسلام ويب", "shamela"]) {
      assert.equal(blob.toLowerCase().includes(banned.toLowerCase()), false, banned);
    }
    assert.ok(BOOK_CARDS.every((b) => isAllowedBookHost(b.url)));
    assert.equal(isAllowedBookHost("https://islamweb.net/ar/library/"), false);
    assert.equal(isAllowedBookHost("https://shamela.ws/book/1"), false);
    assert.ok(BOOK_CARDS[0]?.legalNote.includes("لا من مواقع قرصنة"));
  });
});

describe("كتبي stays a private local slot", () => {
  it("is device-local for everyone and never publishes to the public shelf", () => {
    assert.equal(accountOwnsKutubi({ sliceChosen: false, signedInRealUser: false }), true);
    assert.equal(accountOwnsKutubi({ sliceChosen: true, signedInRealUser: false }), true);
    assert.equal(accountOwnsKutubi({ sliceChosen: false, signedInRealUser: true }), true);
    assert.equal(accountOwnsKutubi(), true);
    assert.equal(kutubiPublishesToPublic(), false);
    assert.deepEqual(EMPTY_KUTUBI, { version: 1, items: [] });
  });

  it("pins only locked public ids onto waha:kutubi:v1 and drops strangers", () => {
    const dirty = hydrateKutubi(
      {
        version: 1,
        items: [
          { bookId: "bk-akhlaq-01", addedAt: 1 },
          { bookId: "pirate-001", addedAt: 2 },
          { bookId: "clip-001", addedAt: 3 },
          { bookId: "bk-akhlaq-01", addedAt: 4 },
        ],
      },
      BOOK_IDS,
    );
    assert.deepEqual(
      dirty.items.map((item) => item.bookId),
      ["bk-akhlaq-01"],
    );
    const added = addToKutubi(dirty, "bk-general-01", 9);
    assert.equal(isOnKutubi(added, "bk-general-01"), true);
    assert.deepEqual(
      listKutubiBooks(added).map((book) => book.id),
      ["bk-akhlaq-01", "bk-general-01"],
    );
    assert.deepEqual(addToKutubi(added, "seed-001").items, added.items);
    assert.deepEqual(
      removeFromKutubi(added, "bk-akhlaq-01").items.map((item) => item.bookId),
      ["bk-general-01"],
    );
  });

  it("keeps أضف للعامة as a legal-review draft that never publishes", () => {
    const page = readFileSync(new URL("../../apps/books/page.tsx", import.meta.url), "utf8");
    const i18n = readFileSync(new URL("../i18n.ts", import.meta.url), "utf8");
    const store = readFileSync(new URL("./store.ts", import.meta.url), "utf8");
    const before = listBooks().map((book) => book.id);
    const pinned = addToKutubi(EMPTY_KUTUBI, "bk-akhlaq-01", 1);
    const drafted = requestPublicDraft(pinned, "bk-akhlaq-01", 2);
    assert.equal(KUTUBI_PUBLIC_DRAFT_STATUS, "legal-review");
    assert.equal(publicDraftOf(drafted, "bk-akhlaq-01")?.status, "legal-review");
    assert.deepEqual(requestPublicDraft(drafted, "pirate-001").items, drafted.items);
    assert.deepEqual(listBooks().map((book) => book.id), before);
    assert.equal(kutubiPublishesToPublic(), false);
    const stripped = hydrateKutubi({
      version: 1,
      items: [
        {
          bookId: "bk-akhlaq-01",
          addedAt: 1,
          publicDraft: { status: "published" as "legal-review", requestedAt: 3 },
        },
      ],
    });
    assert.equal(publicDraftOf(stripped, "bk-akhlaq-01"), undefined);
    assert.match(store, /requestPublicDraft/);
    assert.match(page, /kutubiOfferPublic/);
    assert.match(page, /data-kutubi-draft/);
    assert.match(page, /legal-review/);
    assert.match(i18n, /أضف للعامة/);
    assert.match(i18n, /مراجعة قانونية/);
    assert.doesNotMatch(page, /WebView|fetch\(|scrape/);
    assert.match(page, /kutubiAdd/);
    assert.doesNotMatch(page, /kutubiGuestHint/);
    assert.match(page, /data-kutubi-scope="device"/);
  });
});
