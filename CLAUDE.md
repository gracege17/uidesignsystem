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

## Git Pushes

When the user asks to push changes to GitHub:

1. Check `git status` first and identify whether the worktree is mixed.
2. Never include unrelated local edits in the same commit without explicit user approval.
3. Stage explicit file paths for the current task instead of using `git add -A`, unless the user clearly says the whole worktree is in scope.
4. Run the most relevant validation for the staged changes before committing.
5. Push to a feature branch by default, not directly to `main`, unless the user explicitly requests a direct push.
6. Before pushing, clearly state what will be included if there is any ambiguity.
