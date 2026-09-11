# Marketing site: roadmap and progress

Status: **shipped** · Last updated: 2026-07-20

## Goal

Replace the Angular-rendered brochure site in `marketing/` with a hand-written static HTML site —
no framework and no build-time templating. Runtime code is limited to one dependency-free WebGPU
progressive enhancement. The reference for content depth, layout rhythm, and micro-animation is
[linear.app/ai](https://linear.app/ai): dark ground, tight display typography, hairline structure,
and motion that is felt rather than watched.

## Why replace the Angular version

The old site bootstrapped Angular, the CDK, and the whole `@quinntyne/cornerstone` bundle to render six
static sections. It cost a compile step (`ngc` + `vite build`), an `angular.json` project, a
TypeScript project reference, and an architecture-check source root — all to ship text that never
changes between deploys. A brochure site is documents. It should ship as documents.

Deleting it also removes a subtle conflict of interest: the marketing site was the library's own
largest consumer, so component changes could be motivated by marketing-page needs rather than by
the needs of Liturgy and Word Up.

## Design direction

**Subject.** `@quinntyne/cornerstone` — FaithTech's Angular CDK component library. The audience is Angular
engineers building church and ministry software, most of them volunteers with limited hours. The
page has one job: convince that engineer adoption is safe and fast, and get them to `npm install`.

**Direction: architectural drawing on dark ground.** Cornerstone is named for the first stone laid,
the one every later measurement is taken from. That is literally what a token layer does. So the
page borrows the vernacular of construction documentation — datum rails, dimension ticks, hairline
setting-out grids, blocks that set into place — rather than generic SaaS dark mode.

**Color.** Taken from the library's own dark theme tokens so the site is a demonstration, not an
advertisement.

| Role              | Value     | Source                       |
| ----------------- | --------- | ---------------------------- |
| Page ground       | `#0d0d07` | one step below `--cs-paper`  |
| Raised surface    | `#16160c` | `--cs-paper` (dark)          |
| Card surface      | `#232318` | `--cs-surface` (dark)        |
| Primary text      | `#fffef7` | `--cs-ink` (dark)            |
| Secondary text    | `#9d9a8b` | between the two ink tokens   |
| Accent            | `#d6ff36` | `--cs-lime`                  |
| Hairline          | `rgb(255 254 247 / 9%)` | `--cs-border` at low alpha |

The warm near-black is what separates this from the cold blue-blacks the reference uses, and the
lime is deliberately rationed: datum ticks, one hero word, the primary button, and focus rings.
Nowhere else. Restraint is the risk being taken here.

**Type.** No webfonts — the library ships system stacks, so the site does too, and the page has no
external requests at all. Personality comes from optical tightening instead: display sizes at
weight 640 with `-0.035em` tracking, body at 400 with generous leading, and a monospace utility
face at `0.18em` tracking for eyebrows, dimension labels, and code. The mono face is what sells the
construction-document read.

**Signature element.** The hero carries a low-contrast WebGPU foundation field: a faceted setting-out
grid with lime light travelling through it and a restrained response to pointer movement. It sits
behind the copy, never carries content, and fades into the existing CSS bloom when WebGPU is not
available.

**Motion.** CSS owns interface motion; WebGPU owns only the optional hero field.

- A staggered page-load sequence in the hero (the one orchestrated moment).
- Scroll reveals via `animation-timeline: view()`, wrapped in `@supports` so browsers without it
  simply show the content rather than hiding it forever.
- Datum ticks that brighten as their section enters view.
- Hover micro-interactions: 1px card lift, border brightening, button sheen sweep, arrow nudge.
- Ambient drift behind the hero on a 40s loop.
- A 30 fps WebGPU foundation field, capped at 1.5× device pixel ratio and paused whenever the hero
  or document is not visible.

Everything above collapses under `prefers-reduced-motion: reduce`. The WebGPU module also declines
to initialize when data saving or forced-colors mode is enabled, and the unchanged CSS hero is the
fallback whenever `navigator.gpu`, an adapter, or a WebGPU canvas context is unavailable.

## Content plan

Copy is drawn from real repository facts, not invented: 144 components and 55 directives across
491 public exports in 11 domains, Angular 21, Node 22, the latest two versions of Chromium, Firefox
and WebKit, a 400 KiB gzip FESM budget, and the audited Liturgy/Word Up compatibility bridge.

| Page              | Job                                                              |
| ----------------- | ---------------------------------------------------------------- |
| `index.html`      | The pitch: what it is, how it holds together, how to install it   |
| `components.html` | The catalog: all 11 domains with real component names            |
| `migration.html`  | The bridge: how an existing Liturgy or Word Up screen moves over |
| `404.html`        | A dead end that still offers a way back                          |

## Task roadmap

| #   | Task                                                                    | Status |
| --- | ----------------------------------------------------------------------- | ------ |
| 1   | Audit `marketing/` and every reference to it across the workspace        | Done   |
| 2   | Gather truthful product facts for the copy                              | Done   |
| 3   | Write this roadmap                                                      | Done   |
| 4   | Delete the Angular marketing application                                | Done   |
| 5   | Build `src/marketing/styles/site.css` — tokens, layout, motion system       | Done   |
| 6   | Build `index.html`                                                      | Done   |
| 7   | Build `components.html`, `migration.html`, `404.html`                   | Done   |
| 8   | Add `favicon.svg`, `robots.txt`, `staticwebapp.config.json`             | Done   |
| 9   | Replace `build:marketing` and `start:marketing` with static equivalents | Done   |
| 10  | Remove the workspace wiring: `angular.json`, `tsconfig.json`, checks    | Done   |
| 11  | Update the deploy workflow, `README.md`, and `CLAUDE.md`                | Done   |
| 12  | Verify: build, format, lint, architecture check, and a rendered page    | Done   |

## What shipped

```text
src/marketing/
  index.html               the pitch
  components.html          all 144 components by domain, plus the support matrix
  migration.html           the compatibility bridge and its removal criteria
  404.html
  assets/components-docs.png
  scripts/foundation-field.js  optional WebGPU hero field
  styles/site.css          the whole design system for the site, ~2,200 lines
  favicon.svg  robots.txt  staticwebapp.config.json
```

The site makes zero external requests. `npm run build:marketing` copies the directory to
`dist/marketing/browser` and permits exactly one module script, at
`scripts/foundation-field.js`. Any other script tag, runtime module, inline event handler, missing
`<title>`, or missing `lang` fails the build.

Because the site no longer depends on the library, the deploy workflow dropped `npm ci` entirely
and now triggers only on `src/marketing/**` changes.

## Verification

| Check                                    | Result                                            |
| ---------------------------------------- | ------------------------------------------------- |
| `npm run lint`                           | Passes                                            |
| `npm run format:check`                   | Passes                                            |
| `npm run architecture:check`             | Passes                                            |
| `npm run build:marketing`                | Passes; rejects scripts outside the one-file allowlist |
| axe-core, 4 pages × 2 widths, reduced motion | 0 violations                                  |
| Horizontal overflow at 360–1600px        | None                                              |

Two configuration files needed narrowing: both Prettier and ESLint apply Angular's template parser
to every `*.html`, and it cannot read `{` in ordinary prose or code samples. Prettier now uses the
standard `html` parser under `src/marketing/`, and ESLint ignores the static pages while linting the
WebGPU JavaScript separately. Angular template rules have nothing to say about the brochure HTML,
so axe-core covers its accessibility ground instead.

## Progress log

**2026-07-20 — Audit and plan.** Found 11 files in `marketing/`, all Angular. References to remove
live in `angular.json` (a full project block), `tsconfig.json` (a project reference),
`tools/check-file-organization.mjs` (a source root), `package.json` (three scripts),
`.github/workflows/deploy-marketing.yml`, `CLAUDE.md`, and `README.md`. Settled the design
direction and confirmed every statistic against the repository.

**2026-07-20 — Build and verification.** Four bugs surfaced only by rendering the pages, and all
four are worth remembering:

1. _The datum ticks never stuck._ `.band__tick` uses `writing-mode: vertical-rl`, and logical
   properties resolve against the element's **own** writing mode — so `inset-block-start` was
   offsetting the sticky position sideways instead of down. Fixed with physical `top`, which is
   the rare case where a physical property is the correct choice.
2. _The page scrolled horizontally below 1280px._ The cause was the hero's ambient bloom, a
   pseudo-element, which is invisible to any script that walks `document.querySelectorAll`. It is
   now contained with `overflow-x: clip` on the hero. `clip` rather than `hidden`, because `hidden`
   would make the element a scroll container and break every sticky descendant — the same reason
   `body` uses `clip` too.
3. _Code blocks and tables could not be scrolled by keyboard._ Below about 400px both overflow, and
   a scrollable region that is not focusable strands keyboard users. Each now carries
   `tabindex="0"`, and the table wrappers are labelled regions.
4. _The chain pulse only travelled on wide screens._ The connector rotates from horizontal to
   vertical when the chain stacks, but the animation still moved the dot along the inline axis, so
   on a phone it blinked in place. There are now two keyframe sets, one per axis.

The palette also moved: `--chalk-faint` went from `#6b6a5c` to `#8e8c80` after measuring it at
3.7:1, below AA for small text. It now clears 4.5:1 on every surface it lands on, hovered cards
included. A site whose entire argument is that accessibility is already handled cannot fail a
contrast check on its own eyebrows.

Axe reports contrast violations when motion is allowed, but every flagged node is a scroll-reveal
captured mid-animation — `#setup-title`, for instance, is `--chalk` at 18:1 and can only fail while
partially transparent. Confirmed benign two ways: the reduced-motion pass is clean, and no element
in the initial viewport sits below 0.9 opacity once the load sequence finishes.

**2026-07-20 — Product visuals and WebGPU.** Tightened the homepage around a real documentation
screenshot and two composed product screens, then added the optional hero foundation field. The
shader is written directly in WGSL, adds no dependency or external request, follows pointer input
without intercepting it, and stops rendering off-screen. The former blanket script prohibition is
now a strict allowlist for this one module, keeping the runtime exception narrow and reviewable.
