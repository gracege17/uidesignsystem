import test from "node:test";
import assert from "node:assert/strict";
import { extractDesignSystem, extractLayoutMetrics, extractTokens } from "../dist/index.js";

test("extractTokens names repeated semantic styles and dedupes repeated values", () => {
  const tokens = extractTokens([
    {
      source: "button.brand.primary",
      backgroundColor: "rgb(37, 99, 235)",
      textColor: "rgb(255, 255, 255)",
      fontFamily: "Sora, sans-serif",
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 24,
      letterSpacing: 0
    },
    {
      source: "button.brand.secondary",
      backgroundColor: "rgb(37, 99, 235)",
      textColor: "rgb(255, 255, 255)",
      fontFamily: "Sora, sans-serif",
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 24,
      letterSpacing: 0
    },
    {
      source: "a.brand.link",
      textColor: "rgb(37, 99, 235)",
      fontFamily: "Sora, sans-serif",
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 24,
      letterSpacing: 0
    }
  ]);

  assert.equal(tokens.colors.length, 3);
  assert.equal(tokens.typography.length, 1);
  assert.deepEqual(
    tokens.colors.map((token) => token.name).sort(),
    ["fill/brand", "text/brand", "text/inverse"]
  );
  assert.equal(tokens.typography[0].name, "typography/brand");
});

test("extractTokens filters one-off noise on busier pages", () => {
  const tokens = extractTokens([
    {
      source: "main.hero.title",
      textColor: "rgb(15, 23, 42)",
      fontFamily: "Sora, sans-serif",
      fontSize: 40,
      fontWeight: 700,
      lineHeight: 48,
      letterSpacing: -0.5
    },
    {
      source: "main.hero.subtitle",
      textColor: "rgb(15, 23, 42)",
      fontFamily: "Sora, sans-serif",
      fontSize: 40,
      fontWeight: 700,
      lineHeight: 48,
      letterSpacing: -0.5
    },
    {
      source: "section.card.title",
      textColor: "rgb(51, 65, 85)",
      fontFamily: "Sora, sans-serif",
      fontSize: 24,
      fontWeight: 600,
      lineHeight: 32,
      letterSpacing: 0
    },
    {
      source: "section.card.caption",
      textColor: "rgb(51, 65, 85)",
      fontFamily: "Sora, sans-serif",
      fontSize: 24,
      fontWeight: 600,
      lineHeight: 32,
      letterSpacing: 0
    },
    {
      source: "footer.legal.smallprint",
      textColor: "rgb(148, 163, 184)",
      fontFamily: "Arial, sans-serif",
      fontSize: 11,
      fontWeight: 400,
      lineHeight: 16,
      letterSpacing: 0
    }
  ]);

  assert.deepEqual(
    tokens.typography.map((token) => token.name).sort(),
    ["typography/card", "typography/display"]
  );
  assert.deepEqual(
    tokens.colors.map((token) => token.name).sort(),
    ["text/card", "text/foreground"]
  );
});

test("extractTokens keeps effect tokens and semantic names for repeated shadows", () => {
  const tokens = extractTokens([
    {
      source: "div.card.elevated",
      boxShadow: "0px 16px 40px -20px rgba(15, 23, 42, 0.35)"
    },
    {
      source: "section.card.featured",
      boxShadow: "0px 16px 40px -20px rgba(15, 23, 42, 0.35)"
    }
  ]);

  assert.equal(tokens.effects.length, 1);
  assert.equal(tokens.effects[0].name, "effect/drop-shadow/card");
  assert.equal(tokens.effects[0].style, "drop-shadow");
  assert.equal(tokens.effects[0].blurRadius, 40);
});

test("extractDesignSystem infers repeated components and maps token references", () => {
  const result = extractDesignSystem([
    {
      source: "button.brand.primary",
      tagName: "button",
      classNames: ["button", "brand", "primary"],
      textContent: "Get started",
      childCount: 1,
      width: 144,
      height: 48,
      display: "flex",
      gap: 8,
      paddingTop: 12,
      paddingRight: 20,
      paddingBottom: 12,
      paddingLeft: 20,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgb(37, 99, 235)",
      textColor: "rgb(255, 255, 255)",
      borderRadius: 16,
      fontFamily: "Sora, sans-serif",
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 24,
      letterSpacing: 0
    },
    {
      source: "button.brand.secondary",
      tagName: "button",
      classNames: ["button", "brand", "secondary"],
      textContent: "Book demo",
      childCount: 1,
      width: 156,
      height: 48,
      display: "flex",
      gap: 8,
      paddingTop: 12,
      paddingRight: 20,
      paddingBottom: 12,
      paddingLeft: 20,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgb(37, 99, 235)",
      textColor: "rgb(255, 255, 255)",
      borderRadius: 16,
      fontFamily: "Sora, sans-serif",
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 24,
      letterSpacing: 0
    },
    {
      source: "section.card.product",
      tagName: "section",
      classNames: ["card", "product"],
      childCount: 3,
      width: 320,
      height: 220,
      display: "flex",
      gap: 16,
      paddingTop: 24,
      paddingRight: 24,
      paddingBottom: 24,
      paddingLeft: 24,
      justifyContent: "flex-start",
      alignItems: "stretch",
      backgroundColor: "rgb(255, 255, 255)",
      borderColor: "rgb(226, 232, 240)",
      boxShadow: "0px 16px 40px -20px rgba(15, 23, 42, 0.35)"
    },
    {
      source: "section.card.pricing",
      tagName: "section",
      classNames: ["card", "pricing"],
      childCount: 3,
      width: 320,
      height: 220,
      display: "flex",
      gap: 16,
      paddingTop: 24,
      paddingRight: 24,
      paddingBottom: 24,
      paddingLeft: 24,
      justifyContent: "flex-start",
      alignItems: "stretch",
      backgroundColor: "rgb(255, 255, 255)",
      borderColor: "rgb(226, 232, 240)",
      boxShadow: "0px 16px 40px -20px rgba(15, 23, 42, 0.35)"
    }
  ]);

  assert.equal(result.components.length, 2);
  assert.deepEqual(
    result.components.map((component) => component.type).sort(),
    ["Button", "Card"]
  );

  const button = result.components.find((component) => component.type === "Button");
  assert.ok(button);
  const brandFillId = result.tokens.colors.find((token) => token.name === "fill/brand")?.id;
  const inverseTextId = result.tokens.colors.find((token) => token.name === "text/inverse")?.id;
  const buttonTypographyId = result.tokens.typography.find(
    (token) => token.name === "typography/brand"
  )?.id;
  assert.equal(button.variants.style, "fill");
  assert.equal(button.variants.size, "lg");
  assert.deepEqual(button.tokens.fills, brandFillId ? [brandFillId] : []);
  assert.deepEqual(button.tokens.text, inverseTextId ? [inverseTextId] : []);
  assert.deepEqual(button.tokens.typography, buttonTypographyId ? [buttonTypographyId] : []);
  assert.equal(button.autoLayout?.direction, "horizontal");

  const card = result.components.find((component) => component.type === "Card");
  assert.ok(card);
  const whiteFillId = result.tokens.colors.find(
    (token) => token.role === "fill" && token.value === "rgb(255, 255, 255)"
  )?.id;
  const strokeId = result.tokens.colors.find(
    (token) => token.role === "stroke" && token.value === "rgb(226, 232, 240)"
  )?.id;
  const effectId = result.tokens.effects.find((token) => token.style === "drop-shadow")?.id;
  assert.deepEqual(card.tokens.fills, whiteFillId ? [whiteFillId] : []);
  assert.deepEqual(card.tokens.strokes, strokeId ? [strokeId] : []);
  assert.deepEqual(card.tokens.effects, effectId ? [effectId] : []);
  assert.equal(card.autoLayout?.counterAlignment, "stretch");
});

// ─── extractLayoutMetrics ────────────────────────────────────────────────────

test("extractLayoutMetrics: spacing scale only contains values that actually appear in the DOM", () => {
  const layout = extractLayoutMetrics([
    // button with padding 12 / 24 (top/bottom 12, left/right 24)
    { source: "button.primary", paddingTop: 12, paddingRight: 24, paddingBottom: 12, paddingLeft: 24 },
    { source: "button.secondary", paddingTop: 12, paddingRight: 24, paddingBottom: 12, paddingLeft: 24 },
    // card with gap 16 and padding 24
    { source: "div.card", gap: 16, paddingTop: 24, paddingRight: 24, paddingBottom: 24, paddingLeft: 24 },
    { source: "div.card-2", gap: 16, paddingTop: 24, paddingRight: 24, paddingBottom: 24, paddingLeft: 24 },
  ]);

  // Only values that appear >= 2 times should be in the scale
  assert.ok(layout.spacingScale.includes(12), "12 should appear (button padding-top/bottom ×4)");
  assert.ok(layout.spacingScale.includes(24), "24 should appear (button padding-left/right + card padding ×many)");
  assert.ok(layout.spacingScale.includes(16), "16 should appear (card gap ×2)");
  assert.ok(layout.spacingScale.every(v => v > 0), "all values must be positive");
  assert.deepEqual(layout.spacingScale, [...layout.spacingScale].sort((a, b) => a - b), "scale must be sorted ascending");
});

test("extractLayoutMetrics: spacing scale excludes one-off values", () => {
  const layout = extractLayoutMetrics([
    { source: "button.primary", paddingTop: 12, paddingRight: 24, paddingBottom: 12, paddingLeft: 24 },
    { source: "button.secondary", paddingTop: 12, paddingRight: 24, paddingBottom: 12, paddingLeft: 24 },
    // 99px only appears once — should NOT be in the scale
    { source: "div.hero", paddingTop: 99 },
  ]);

  assert.ok(!layout.spacingScale.includes(99), "one-off value 99 must not appear in scale");
});

test("extractLayoutMetrics: content width comes from real maxWidth, not invented", () => {
  const layout = extractLayoutMetrics([
    // Gusto-style: main wrapper with max-width 1280px
    { source: "main.PageLayout_wrapper", width: 1440, maxWidth: 1280, paddingLeft: 24, paddingRight: 24 },
    { source: "div.container", width: 1440, maxWidth: 1280 },
  ]);

  assert.equal(layout.contentWidth, 1280, "content width must be the real maxWidth value");
});

test("extractLayoutMetrics: no content width when maxWidth is absent", () => {
  const layout = extractLayoutMetrics([
    // Wide element but no maxWidth set
    { source: "div.hero", width: 1440 },
  ]);

  assert.equal(layout.contentWidth, undefined, "must not invent a content width");
});

test("extractLayoutMetrics: grid columns come from real gridTemplateColumns, not gap size", () => {
  const layout = extractLayoutMetrics([
    // Real 3-column grid
    {
      source: "div.FeatureGrid",
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 24
    },
    // Flex row with large gap — must NOT be counted as a 6-column grid
    {
      source: "nav.TopNav",
      display: "flex",
      gap: 48,
      childCount: 5
    }
  ]);

  assert.ok(layout.grid, "grid should be detected");
  assert.equal(layout.grid?.columns, 3, "columns must be 3 from gridTemplateColumns, not derived from gap");
  assert.equal(layout.grid?.gap, 24);
});

test("extractLayoutMetrics: no grid when no display:grid element exists", () => {
  const layout = extractLayoutMetrics([
    // Only flex — no CSS grid
    { source: "div.row", display: "flex", gap: 32, childCount: 4 },
    { source: "div.nav", display: "flex", gap: 16, childCount: 6 },
  ]);

  assert.equal(layout.grid, undefined, "must not fabricate a grid when none exists");
});

test("extractLayoutMetrics: page margin comes from wrapper padding, not invented", () => {
  const layout = extractLayoutMetrics([
    { source: "main.Layout", paddingLeft: 32, paddingRight: 32 },
  ]);

  assert.equal(layout.pageMargin, 32, "page margin must equal the actual padding");
});

test("extractLayoutMetrics: empty nodes produce empty results, not fabricated data", () => {
  const layout = extractLayoutMetrics([]);

  assert.equal(layout.contentWidth, undefined);
  assert.equal(layout.pageMargin, undefined);
  assert.equal(layout.grid, undefined);
  assert.deepEqual(layout.spacingScale, []);
});

test("extractDesignSystem: result includes layout field", () => {
  const result = extractDesignSystem([
    {
      source: "button.primary",
      tagName: "button",
      textContent: "Sign up",
      backgroundColor: "rgb(37, 99, 235)",
      textColor: "rgb(255, 255, 255)",
      paddingTop: 12,
      paddingRight: 24,
      paddingBottom: 12,
      paddingLeft: 24,
      fontFamily: "Inter, sans-serif",
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 24,
      letterSpacing: 0,
      height: 48
    },
    {
      source: "button.secondary",
      tagName: "button",
      textContent: "Learn more",
      backgroundColor: "rgb(37, 99, 235)",
      textColor: "rgb(255, 255, 255)",
      paddingTop: 12,
      paddingRight: 24,
      paddingBottom: 12,
      paddingLeft: 24,
      fontFamily: "Inter, sans-serif",
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 24,
      letterSpacing: 0,
      height: 48
    },
    {
      source: "main.PageWrapper",
      maxWidth: 1280,
      paddingLeft: 24,
      paddingRight: 24,
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 24
    }
  ]);

  assert.ok(result.layout, "layout field must exist on ExtractionResult");
  assert.ok(result.layout.spacingScale.length > 0, "spacing scale must be populated");
  assert.equal(result.layout.contentWidth, 1280, "content width must match real maxWidth");
  assert.equal(result.layout.grid?.columns, 3, "grid columns must come from gridTemplateColumns");
});
