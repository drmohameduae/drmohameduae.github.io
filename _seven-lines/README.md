# Seven Lines monthly editions

This directory builds the complete June–October 2026 collection for the Reading Room in English, Arabic, French, Spanish, Russian and Chinese.

## Publication files

- `data/editions.json`: audited English source content, with source-page references.
- `data/locales/{ar,fr,es,ru,zh}.json`: complete translations, including the activities and answers.
- `data/ui.json`: interface labels and editorial notices in all six languages.
- `data/breakers.json`: six verified quotations, translations, attributions and source references.
- `data/media.json`: original-PDF checksums and the cover/photo inventory.
- `../assets/seven-lines/pdf/`: the five original, unmodified bilingual newsletters.
- `../assets/seven-lines/covers/` and `photos/`: web images derived from the supplied PDFs.

The public collection is at `/{locale}/reading-room/#seven-lines-monthly-editions`. Each issue has its own route, for example `/en/reading-room/seven-lines/june-2026/`.

## Build

Run from the repository root with Node.js:

```sh
node _seven-lines/build-magazines.js
```

The build requires all five complete translation files; missing or incomplete languages stop the build. It writes 30 static readers, updates the six Reading Rooms, search indexes and human-readable sitemaps, and registers the reader URLs in `sitemap.xml`. It also writes `publication-manifest.json` with source digests.

The published HTML is committed directly. GitHub Pages does not need a new build service, package installation or external reader dependency. Existing navigation and site styling are reused.

For a single-language development preview, add `--locale en` (or another locale). This does not update the collection indexes or publication manifest.

## Verification

Python 3 and Beautiful Soup are used for source-content and link checks:

```sh
python -m pip install beautifulsoup4
python _seven-lines/validate.py
```

Validation checks every prose field against the generated HTML, issue and page counts, all six quotation attributions, original-PDF SHA-256 checksums, controls, language direction, image attributes, duplicate IDs and local links. Its result is written to `validation.json`.

For DOM interaction checks, install the test-only dependency and run:

```sh
npm --prefix _seven-lines install
npm --prefix _seven-lines test
```

These checks cover all six languages, page navigation, animation state, keyboard focus, Arabic direction, text size, continuous reading, fullscreen fallback, crossword input and print state. DOM tests do not replace visual testing in a deployed browser.

The reader fits A4-proportioned sheets to the available screen and adds continuation sheets where text would otherwise overflow. Without JavaScript, the full publication is available as consecutive sections. It includes reduced-motion support, touch navigation, keyboard navigation, page selection, continuous reading, text enlargement and fullscreen with a fallback. Arabic reverses the page-turn direction. Printing reveals all pages. October uses 20 pages because its final two source pieces are short exercises; each other issue uses 22 pages. The final page is always the back cover.

Translations are prepared from the audited source text. The supplied bilingual PDFs remain available independently. Religious quotation translations are identified as literary renderings; source links remain available on each interlude. The crossword retains its original English answers because they must fit the supplied grid, while its instructions are translated.

## Release

After a successful full build and validation, commit all changed source files, generated HTML and media, then push the reviewed commit to the repository's existing GitHub Pages branch. Verify the deployed Reading Room and at least one complete reader, including an Arabic reader, after Pages finishes deployment. Do not treat a local build or commit as proof of publication.

The November 2026 draft was withdrawn. Its source can be recovered from commit ba64cc0 when the edition is ready to publish.
