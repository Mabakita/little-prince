# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, RTL Hebrew educational website about *The Little Prince* (הנסיך הקטן), built for teachers and students in grades ד'-ו' (4th-6th). Pure HTML/CSS/vanilla JS — no build step, no framework, no package manager, not currently a git repository. Open the HTML files directly in a browser (or serve the folder with any static file server) to preview changes.

## Architecture

**One chapter is fully implemented (chapter 1); the rest are placeholders.** The site is designed to be extended chapter-by-chapter, and the pattern below must be repeated identically for each new chapter.

### Data flow for chapter pages

Chapter content is *not* hardcoded into HTML. It flows like this:

1. **`data/activities.docx`** is the source-of-truth table a teacher maintains (chapter name, summary, activities, files) — it cannot be read directly by the static site.
2. **`data/chapters.js`** is a hand-maintained JS "translation" of that docx into a `CHAPTERS_DATA` object keyed by chapter number (as a string). Every edit to the docx must be manually re-applied here.
3. **`chapters/chapter-XX.html`** contains a `<main data-chapter="N">` element with empty placeholders (`#chapter-title`, `#chapter-summary`, `#chapter-activities`).
4. **`js/chapter-loader.js`** reads `data-chapter` off that `<main>`, looks up `CHAPTERS_DATA[chapterKey]`, and populates the title/summary/activity cards into the DOM at page load. Activity cards with a `file` field get a thumbnail (from `images/downloads-thumbs/`) and a download link (to `downloads/`).

To add a new chapter: add its entry to `CHAPTERS_DATA` in `data/chapters.js`, create `chapters/chapter-XX.html` copied from `chapters/chapter-01.html` (update `data-chapter`, the illustration path, breadcrumb, and pager links), and flip its card in `index.html` from `.chapter-card.disabled` to a live `<a>` link. The chapter `<select>` dropdown (duplicated across every page's nav) also needs its matching `<option>` un-disabled.

### File/asset naming conventions

- `images/chapters/chapterN.png` — banner illustration for chapter N.
- `images/menu/N.png` — small icon used on the chapter's card on the home page grid.
- `images/downloads-thumbs/<filename-without-extension>.png` — auto-looked-up preview thumbnail for a downloadable activity file (see `chapter-loader.js`'s thumbnail logic); if missing, the `<img>` is silently removed via `onerror`.
- `downloads/<file>` — the actual downloadable activity files (PDFs, etc.) referenced by `file` in `chapters.js`.

### Shared nav/JS behavior (`js/main.js`)

Every page repeats the same `<header class="site-header">` nav markup (logo, hamburger toggle, links, chapter-jump `<select>`). `main.js` wires up the mobile hamburger toggle and the `<select>`'s `change` → `location.href` navigation. There's no templating, so nav changes (e.g. adding a new chapter link) must be copy-pasted into every HTML file: `index.html`, `about.html`, and every `chapters/chapter-XX.html`.

### Styling

All styles live in one file, `css/style.css`, organized in sections via Hebrew comment banners (nav, hero, ornament decorations, chapters grid/cards, chapter page content, activities). The site uses `dir="rtl"` throughout and a paper/star-themed decorative motif (`.ornament`, background textures) — match this visual language when styling new content rather than introducing new patterns.

## Working in this repo

- No build/lint/test tooling exists. Verify changes by opening the HTML file(s) in a browser.
- Keep RTL Hebrew text and `lang="he" dir="rtl"` consistent in any new page.
- Since there's no templating engine, any shared-markup change (nav, footer, chapter `<select>`) must be applied to every HTML file by hand — check `index.html`, `about.html`, and all files under `chapters/`.
