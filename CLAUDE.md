# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

CS Guru (`README.md`) is a static, no-build German-language website ("Informatik ist einfach") that teaches CS fundamentals — number systems, switch algebra/boolean logic, and Python basics — through interactive lessons and mini-games. There is no `package.json`, bundler, transpiler, or test runner: every page is hand-written HTML with a single shared `style.css` and a single shared `app.js`, plus a few per-tool/per-game JS files.

## Running the site

There is no build step. Because pages reference assets with root-absolute paths (e.g. `/style.css`, `/app.js`, `/assets/favicon.ico`), the site must be served from the repo root over HTTP — opening HTML files directly via `file://` will break asset loading for any deeply nested lesson page. Serve locally with any static file server, e.g.:

```
npx serve .
# or
python -m http.server
```

Then visit `index.html` (or the relevant page under `pages/`) through that server.

There is no lint or test command configured in this repo.

## Architecture

### Shared chrome, duplicated per page

Every HTML page is fully self-contained (no templating/includes) and repeats the same `<nav>`, mobile menu, and contact modal markup. When changing the nav, footer, or contact modal, the edit must be repeated across every page that includes it — check `index.html`, `pages/*.html`, and every file under `pages/explainations/` for the same block rather than assuming one source of truth.

Path conventions differ by nesting depth:
- Top-level pages (`index.html`, `pages/*.html`) and lesson pages under `pages/explainations/learning_themes/**` use root-absolute asset paths (`/style.css`, `/app.js`, `/pages/...`).
- A few pages (e.g. `pages/learn.html`) instead use relative paths (`../style.css`). Match whatever the sibling pages in that directory already do.

### `app.js` is one global script for the whole site

`app.js` is loaded on every page (`<script src="/app.js" defer>` or a relative equivalent) and is organized as a sequence of independent, defensively-guarded IIFEs — nav/mobile-menu toggling, the contact modal, lesson-sidebar scroll spy, hover-glossary popups (`.lesson-term`), and one IIFE per interactive exercise type. Every block starts by querying for its own target elements and bails out (`if (!el) return`) if they aren't present, so the single script is safe to include on pages that don't use that feature. When adding a new interactive widget, follow this pattern: a new self-contained IIFE at the end of `app.js`, gated on a `data-*` attribute or class that only your new markup has.

### Interactive lesson exercises: `data-exercise` types

Lessons under `pages/explainations/learning_themes/**` embed graded exercises via `<div class="lesson-exercise" data-exercise="...">`. Each type is implemented by its own IIFE in `app.js` and driven entirely by data attributes on the markup — no per-lesson JS is needed. Existing types: `multi` (pick-all-that-apply, optionally regenerated via `data-generate="varnames"`), `match` (dropdown-to-type matching, `data-generate="datatypes"`), `truth` (fill in a truth table), `slice` (free-text Python slice/index expressions, evaluated with real Python slice semantics), `logic-build` (rebuild a boolean expression from ∧/∨/¬, parsed into an AST and checked for logical equivalence, not string equality), `law-quiz` (quiz on the eight Boolean laws, data sourced from a hidden `.lesson-law-quiz__data` list), `combo-count` (numeric answer that reveals another exercise via `data-reveal="<id>"`), and `binary-arith` (binary addition/subtraction, optionally regenerated via `data-generate="binary"`). When any of these accept free-text logical/Python expressions, they tokenize and evaluate the input rather than doing exact-string matching, so any equivalent answer is accepted.

All exercise/UI copy and feedback strings are in German — match this when adding content.

### Content structure

- `pages/explainations/learning_themes/` holds the lesson pages, grouped into three tracks: `Number Systems/`, `python basis/`, and `switch algebra/` (note the literal space in these directory names — URLs to them are percent-encoded, e.g. `python%20basis`). `pages/learn.html` is the index/table of contents linking into these, grouped by topic with numbered subtopics.
- `pages/explainations/tools/` holds standalone interactive tools (base converter, decimal converter, boolean simplifier, truth table builder), each with its own HTML + JS file pair.
- `games/` holds standalone mini-games (`circuit`, `conversion`, `simplify`, `two_pow`), each an HTML + JS pair, linked from `pages/play.html`.
- A typical lesson page structure: `.lesson-sidebar` (sticky nav built from anchor links matching each section's `id`, tracked via `IntersectionObserver` in `app.js`) + `.lesson-content` made of `.lesson-section` blocks, each with a numbered header and body. Code samples use `.lesson-code` with manually span-wrapped syntax highlighting (`code-name`, `code-operator`, `code-value` classes) — there is no syntax highlighter library.
- `.lesson-term` spans provide hover/focus glossary popups; content comes from `data-term-title` / `data-term-values` / `data-term-note` / `data-term-code` attributes, not markup, and is built by the corresponding `app.js` IIFE.
