# Design Extractor

Prototype Chrome extension for extracting a page's design system and reviewing it as a lightweight style guide.

The project currently focuses on:

- extracting design tokens from live DOM and computed styles
- normalizing extracted measurements back to likely source-token values before exporting a spec
- inferring repeated component families from page structure
- reviewing the result in a dedicated extension review page
- exporting curated summaries for downstream AI or implementation tools

## What It Does

Given a webpage, the extension captures visible DOM/style data and generates:

- `colors`
- `typography`
- `effects`
- `components`
- basic layout patterns

The review experience is split into:

- `Overview`
- `Color`
- `Typography`
- `Grids`
- `Components`
- `Debug`

Each section also supports copy actions for curated summaries.

## Install on Your Desktop

### Option A — Download (no setup required)

1. Go to the [Releases page](https://github.com/gracege17/uidesignsystem/releases)
2. Download `design-extractor.zip` from the latest release
3. Unzip it
4. Open Chrome → `chrome://extensions`
5. Enable **Developer mode** (top-right corner)
6. Click **Load unpacked** → select the unzipped folder

The **Design Extractor** icon will appear in your Chrome toolbar.

---

### Option B — Build from source

Follow these steps if you want to modify the extension or build it yourself.

### 1. Prerequisites

Install the following tools if you don't already have them:

- [Node.js 18+](https://nodejs.org/) — JavaScript runtime
- [pnpm](https://pnpm.io/installation) — package manager (`npm install -g pnpm`)
- Google Chrome or any Chromium-based browser

### 2. Clone the Repository

```bash
git clone https://github.com/gracege17/uidesignsystem.git
cd uidesignsystem
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Build the Extension

```bash
pnpm build
```

This generates the unpacked extension in `apps/extension/dist`.

### 5. Load into Chrome

1. Open Chrome and go to `chrome://extensions`
2. Toggle on **Developer mode** (top-right corner)
3. Click **Load unpacked**
4. Select the `apps/extension/dist` folder inside this repo

The **Design Extractor** icon will appear in your Chrome toolbar.

### 6. Use It

1. Navigate to any webpage you want to inspect
2. Click the **Design Extractor** icon in the toolbar
3. Click **Extract**
4. Browse results in the popup, or click **Open Review Page** for the full review UI

> **Note:** The extension does not work on `chrome://` pages, the Chrome Web Store, or other restricted browser pages. Use it on normal public or internal websites.

---

## Workspace Structure

```text
apps/extension
  Chrome extension app
  src/entrypoints
    Vite entry files for popup and review surfaces
  src/pages
    Top-level popup and review page shells
  src/features/extraction
    DOM capture and style serialization
  src/features/review
    Review UI and section rendering
  src/features/storage
    Chrome/local storage helpers for review state
  src/styles
    Shared extension styles

packages/parser
  Token and component extraction logic

packages/types
  Shared extraction contracts and interfaces

packages/config
  Shared Tailwind and TypeScript config
```

## Requirements

- Node.js 18+ recommended
- `pnpm` 8.x
- Chrome or a Chromium-based browser with extension developer mode

## Setup

1. Clone the repo.
2. Install dependencies:

```bash
pnpm install
```

3. Build the workspace:

```bash
pnpm build
```

## Run The Extension

After `pnpm build`, the unpacked extension output is in:

[`apps/extension/dist`](/Users/tianmeizige/uidesignsystem/apps/extension/dist)

Load it in Chrome:

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select [`apps/extension/dist`](/Users/tianmeizige/uidesignsystem/apps/extension/dist)

## How To Use

1. Open a normal webpage you want to inspect
2. Click the `Design Extractor` extension icon
3. Click `Extract`
4. Review the result in the popup or click `Open Review Page`

The review page uses a left navigation and a main content area:

- `Overview` surfaces the most important signals first
- `Color` groups extracted palette candidates
- `Typography` shows likely type scale specimens
- `Grids` visualizes repeated layout patterns
- `Components` shows curated component families
- `Debug` shows raw observed values, canonical values, token matches, classification reasons, and extraction warnings

## Copy Actions

The review page supports:

- `Copy Everything` from `Overview`
- `Copy Color`
- `Copy Typography`
- `Copy Layout`
- `Copy Components`
- `Copy Debug`

These exports are plain-text summaries designed to paste cleanly into AI tools, implementation prompts, or planning docs.

## Development Commands

Install dependencies:

```bash
pnpm install
```

Build everything:

```bash
pnpm build
```

Run type checks:

```bash
pnpm typecheck
```

Run parser tests:

```bash
pnpm --filter @extractor/parser test
```

Run extension dev server:

```bash
pnpm --filter @extractor/extension dev
```

## Current Extraction Model

The parser returns an `ExtractionResult` with:

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

This model is defined in [packages/types/src/index.ts](/Users/tianmeizige/uidesignsystem/packages/types/src/index.ts).

## Extraction Guardrails

- Button padding and corner radius are part of component identity. Do not group button candidates only by color, typography, and size.
- Button padding may live on a nested wrapper instead of the clickable element itself, so extraction logic must not assume the first child carries the real spacing.
- Treat computed browser values as observed evidence, not canonical spec values. Exported specs should snap spacing, radius, and typography measurements back to likely source tokens or the nearest approved scale.

## Current Limitations

This is still a prototype. Current tradeoffs:

- extraction quality depends heavily on the source page
- token naming can still be noisy on production marketing sites
- component inference is heuristic, not canonical
- repeated footer links and utility elements can still appear as components
- layout inference is approximate
- Chrome internal pages and restricted pages will not extract useful results

## Recommended Review Flow

If you are validating extraction quality, use this order:

1. `Overview`
2. `Typography`
3. `Color`
4. `Components`
5. `Grids`

The first questions the review page should answer are:

- What is the primary color?
- What is the main typeface?
- What is the likely H1?
- What is the body text style?
- What are the main component families?

## Troubleshooting

If extraction returns almost nothing:

- do not test on `chrome://` pages, the Chrome Web Store, or restricted browser pages
- try a normal marketing site or docs site
- rebuild the extension with `pnpm build`
- reload the unpacked extension in `chrome://extensions`

If the review page looks stale:

1. Run `pnpm build`
2. Reload the extension in Chrome
3. Re-run `Extract`
4. Open the review page again

## Next Areas To Improve

- better token naming and semantic grouping
- stricter noise filtering
- stronger component ranking
- more reliable typography classification
- stronger layout/grid inference
- better export formats for implementation workflows
