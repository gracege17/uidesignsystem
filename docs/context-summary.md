# Context Summary

Short handoff note for continuing work on the project across model switches.

## Product Goal

This repo is a prototype Chrome extension that extracts a webpage's design system and presents it as a reviewable style guide.

The current product shape is:

- popup to run extraction
- dedicated review page in a new tab
- parser that returns normalized tokens and inferred components
- curated copy/export actions for each review section

## Current Flow

1. User opens a normal webpage
2. User clicks the extension popup
3. Popup captures visible DOM/computed style data from the active tab
4. `@extractor/parser` converts the captured nodes into:
   - `tokens`
   - `components`
5. Result is saved to extension storage
6. User opens the dedicated review page
7. Review page renders a split layout:
   - left nav
   - right main content

## Core Data Model

The parser returns `ExtractionResult`:

```ts
{
  tokens: {
    colors: ColorToken[],
    typography: TypographyToken[],
    effects: EffectToken[]
  },
  components: ExtractedComponent[]
}
```

Source of truth:

- [packages/types/src/index.ts](/Users/tianmeizige/uidesignsystem/packages/types/src/index.ts)

## Key Files

### Extension

- [apps/extension/src/App.tsx](/Users/tianmeizige/uidesignsystem/apps/extension/src/App.tsx)
  Popup UI, extraction trigger, active-tab capture, save result, open review page.

- [apps/extension/src/ReviewPage.tsx](/Users/tianmeizige/uidesignsystem/apps/extension/src/ReviewPage.tsx)
  Full-page review shell, light/dark mode toggle, loads stored extraction result.

- [apps/extension/src/DesignSystemReview.tsx](/Users/tianmeizige/uidesignsystem/apps/extension/src/DesignSystemReview.tsx)
  Main review UI. This is the file most likely to change during UX iteration.

- [apps/extension/src/review-data.ts](/Users/tianmeizige/uidesignsystem/apps/extension/src/review-data.ts)
  Storage helpers and review-page open helper.

- [apps/extension/public/manifest.json](/Users/tianmeizige/uidesignsystem/apps/extension/public/manifest.json)
  Chrome extension manifest.

- [apps/extension/vite.config.ts](/Users/tianmeizige/uidesignsystem/apps/extension/vite.config.ts)
  Multi-page Vite build for popup and review page.

### Parser

- [packages/parser/src/index.ts](/Users/tianmeizige/uidesignsystem/packages/parser/src/index.ts)
  Extraction logic for tokens and components.

- [packages/parser/test/index.test.mjs](/Users/tianmeizige/uidesignsystem/packages/parser/test/index.test.mjs)
  Parser regression tests.

### Shared Types

- [packages/types/src/index.ts](/Users/tianmeizige/uidesignsystem/packages/types/src/index.ts)
  Shared extraction contracts.

## Review Page Structure

The review page is intended to feel like a design-system handbook, not a debug dashboard.

Current sections:

- `Overview`
- `Color`
- `Typography`
- `Grids`
- `Components`

Each section is trying to answer a designer-first question:

- what is the primary color?
- what is the main typeface?
- what is the likely H1?
- what is the body style?
- what are the main component families?

## Current UX Decisions

- Keep popup lightweight
- Use a dedicated review page for the real inspection experience
- Use a left-nav / right-content layout
- Prefer curated summaries over raw JSON
- Keep raw/debug details secondary
- Support light and dark review modes
- Provide copy actions for:
  - `Copy Everything`
  - `Copy Color`
  - `Copy Typography`
  - `Copy Layout`
  - `Copy Components`

## Current Known Issues

The app works, but extraction quality is still heuristic and noisy.

Known weaknesses:

- token names can still include low-value class-derived artifacts
- component detection still pulls in footer links and utility UI in some cases
- layout inference is approximate
- real pages can still overproduce noisy component candidates
- review-page content quality depends on ranking quality from parser output

## Recent UI Fixes

These were already addressed:

- typography hero contrast in light mode
- layout hero contrast in light mode
- component preview text contrast in dark mode
- copy actions for overview and individual tabs
- cleaner, simpler visual style versus the earlier busy dashboard look

## What The User Cares About Most Right Now

The user is strongly focused on the review experience, not just raw extraction.

They want the page to feel organized and useful for design understanding.
The most important standard is:

> a designer should quickly understand the system and be able to reuse it in downstream tooling

That means work should bias toward:

- stronger hierarchy
- cleaner naming
- less noise
- better curation
- better copy/export quality

## Recommended Next Work

Best next areas, in order:

1. Improve parser-side ranking and filtering
   - reduce noisy component candidates
   - reduce low-value tokens
   - better detect primary tokens and main typography

2. Improve semantic labeling
   - move away from class-derived names
   - produce labels like `Primary`, `Body`, `Heading`, `Surface`

3. Improve component family grouping
   - merge repetitive footer-link-like results
   - better identify top-level families

4. Improve export quality
   - keep copy output short, reliable, and model-friendly

## Commands That Matter

Build:

```bash
pnpm build
```

Typecheck:

```bash
pnpm typecheck
```

Parser tests:

```bash
pnpm --filter @extractor/parser test
```

## Notes For The Next Model

- Start by reading [apps/extension/src/DesignSystemReview.tsx](/Users/tianmeizige/uidesignsystem/apps/extension/src/DesignSystemReview.tsx) if the task is review-page UX.
- Start by reading [packages/parser/src/index.ts](/Users/tianmeizige/uidesignsystem/packages/parser/src/index.ts) if the task is extraction quality.
- Do not treat the current extracted names as authoritative. Many are still heuristic.
- Prefer improving the underlying ranking/curation rather than adding more UI around noisy data.
