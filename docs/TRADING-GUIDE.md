# دليل المضاربة والتداول في الأسهم الأمريكية

A guide-only publication based on production commit `35bf44fe9e3eacdb9ee2d5191b3d5211307a4568`. It deliberately excludes the unrelated Mohsen URL change that was pending on `main`.

## Routes and content

- `/books/trading-guide`: 23 reflowable sections including 17 chapters, contents and appendices.
- `/books/trading-guide/trading-guide.pdf`: 54-page public PDF derivative.
- `/books`: a visible guide card; existing shelves and Alhajda reader remain intact.
- The reviewed 7 October 2026 source content is unchanged: 1,250 paragraphs, 19 tables, 194 links and one image. Financial information is explicitly dated, not presented as current recommendations.
- The public version omits the private cover dedication. The original files are untouched. The public PDF also removes the now-stale Content Credentials attachment after redaction; it does not claim the original signature remains valid. Links and bookmarks are retained.
- Public PDF SHA-256: `e7d84e6ab6e5de70f3913af94cf65255e78e8a09986376efbad11d96a06fed31`.

## Readability and local state

Self-hosted Noto Naskh Arabic for body text and Noto Kufi Arabic for headings, 24 px default, 18–40 px controls, approximately double line spacing, RTL, contained horizontally scrollable tables, three themes, search, contents, bookmarks and saved paragraph position. Browser zoom is not disabled. The toolbar is non-sticky in short/landscape viewports so it does not obscure the reading area.

The guide uses `waha:curated:trading-guide:20261007`. The existing Alhajda reader and `waha:curated:alhajda:edition1` are unchanged. The guide does not require authentication, a database migration or configuration changes.

## Verification

Run `npm run build`, `npm run typecheck`, `npm test` and `npm run lint`.

The browser audit covers 320, 360, 390 and 768 px portrait, 844 × 390 landscape, contained tables, default font loading, size limits, 200% text-size stress, contents, cross-chapter source links, search, repeated navigation, progress/bookmark restoration, existing reader-state isolation, unavailable storage, library return, browser Back/Forward and the public PDF response.

```sh
node scripts/audit-trading-guide.mjs https://PREVIEW_HOST /tmp/waha-trading-guide-audit
```

Use `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` only when a system Chromium is required. `AUDIT_IGNORE_HTTPS_ERRORS=1` is available solely for test environments with an HTTPS inspection proxy, not as an application setting. Outputs include screenshots and `report.json`; a failure writes `failure.json`. Emulation does not replace physical iPhone/VoiceOver or native pinch-zoom testing.

Local build, typecheck and tests passed. Lint has no errors and the same 24 pre-existing warnings as the production baseline. Local browser subprocess startup is blocked by this executor's sandbox; preview/live browser results must be established before publication is claimed.
