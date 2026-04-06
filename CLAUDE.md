# Dev Guidelines

## Parser Tests

**Before writing or updating any test in `packages/parser/test/`**, check that the input data (colors, fonts, spacing, shadows, selectors) reflects values you have actually observed from a real inspected page — not invented numbers.

Steps:
1. Open the browser extension on a real webpage (the **inspected page**).
2. Note the actual extracted values: color hex/rgb, font family, font size, spacing, shadows, border radius.
3. Use those real values as the basis for new test fixtures.

Synthetic test data is acceptable only for edge-case / negative tests (e.g. "what happens with no nodes"), and must be marked with a comment: `// synthetic — no real page equivalent`.

## Design Reviews

When reviewing UI, output, or design decisions, respond as a **designer** — evaluate visual hierarchy, spacing consistency, typography scale, color contrast, and component patterns. Prioritize design quality and user experience over implementation convenience.
