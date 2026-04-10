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

test("extractDesignSystem classifies repeated feature blocks as FeatureItem instead of Card", () => {
  const result = extractDesignSystem([
    {
      source: "div.features_item",
      tagName: "div",
      classNames: ["features_item"],
      textContent: "Curated No sponsored sessions. Every talk is reviewed by GTM operators to ensure real value for attendees.",
      childCount: 2,
      width: 280,
      height: 120
    },
    {
      source: "div.features_item",
      tagName: "div",
      classNames: ["features_item"],
      textContent: "Practical Sessions built for operators, not vanity thought leadership.",
      childCount: 2,
      width: 280,
      height: 120
    }
  ]);

  assert.equal(result.components.some((component) => component.type === "FeatureItem"), true);
  assert.equal(result.components.some((component) => component.type === "Card"), false);
});

test("extractDesignSystem keeps a strong single contained panel as Card", () => {
  const result = extractDesignSystem([
    {
      source: "section.hero.panel",
      tagName: "section",
      classNames: ["hero", "panel"],
      textContent: "Operator Summit Get practical GTM sessions with vetted speakers.",
      childCount: 3,
      width: 1120,
      height: 360,
      backgroundColor: "rgb(255, 255, 255)",
      borderColor: "rgb(226, 232, 240)",
      boxShadow: "0px 24px 60px rgba(15, 23, 42, 0.16)",
      borderRadius: 24,
      paddingTop: 32,
      paddingRight: 32,
      paddingBottom: 32,
      paddingLeft: 32
    }
  ]);

  assert.equal(result.components.some((component) => component.type === "Card"), true);
});

test("extractTokens prefers matching CSS variable names for visible colors", () => {
  const tokens = extractTokens(
    [
      {
        source: "button.cta",
        backgroundColor: "rgb(26, 115, 232)",
        textColor: "rgb(255, 255, 255)"
      },
      {
        source: "a.link",
        textColor: "rgb(26, 115, 232)"
      }
    ],
    {
      "--color-primary": "#1a73e8",
      "--color-text": "#202124",
      "--spacing-4": "16px"
    }
  );

  assert.equal(tokens.colors.find((token) => token.role === "fill")?.name, "fill/primary");
  assert.equal(
    tokens.colors.find((token) => token.role === "text" && token.value === "rgb(26, 115, 232)")?.name,
    "text/primary"
  );
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

test("extractDesignSystem keeps differently padded buttons as separate component candidates", () => {
  const result = extractDesignSystem([
    {
      source: "button.brand.compact",
      tagName: "button",
      classNames: ["button", "brand", "compact"],
      textContent: "Buy now",
      childCount: 1,
      width: 124,
      height: 48,
      display: "flex",
      paddingTop: 10,
      paddingRight: 16,
      paddingBottom: 10,
      paddingLeft: 16,
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
      source: "button.brand.roomy",
      tagName: "button",
      classNames: ["button", "brand", "roomy"],
      textContent: "Buy now",
      childCount: 1,
      width: 156,
      height: 48,
      display: "flex",
      paddingTop: 14,
      paddingRight: 24,
      paddingBottom: 14,
      paddingLeft: 24,
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
    }
  ]);

  const buttons = result.components.filter((component) => component.type === "Button");
  assert.equal(buttons.length, 2);
  assert.deepEqual(
    buttons.map((button) => button.padding && [button.padding.top, button.padding.right]).sort(),
    [
      [10, 16],
      [14, 24]
    ]
  );
});

test("extractDesignSystem keeps differently rounded buttons as separate component candidates", () => {
  const result = extractDesignSystem([
    {
      source: "button.brand.rounded",
      tagName: "button",
      classNames: ["button", "brand", "rounded"],
      textContent: "Continue",
      childCount: 1,
      width: 144,
      height: 48,
      display: "flex",
      paddingTop: 12,
      paddingRight: 20,
      paddingBottom: 12,
      paddingLeft: 20,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgb(37, 99, 235)",
      textColor: "rgb(255, 255, 255)",
      borderRadius: 999,
      fontFamily: "Sora, sans-serif",
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 24,
      letterSpacing: 0
    },
    {
      source: "button.brand.square",
      tagName: "button",
      classNames: ["button", "brand", "square"],
      textContent: "Continue",
      childCount: 1,
      width: 144,
      height: 48,
      display: "flex",
      paddingTop: 12,
      paddingRight: 20,
      paddingBottom: 12,
      paddingLeft: 20,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgb(37, 99, 235)",
      textColor: "rgb(255, 255, 255)",
      borderRadius: 8,
      fontFamily: "Sora, sans-serif",
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 24,
      letterSpacing: 0
    }
  ]);

  const buttons = result.components.filter((component) => component.type === "Button");
  assert.equal(buttons.length, 2);
  assert.deepEqual(
    buttons.map((button) => button.cornerRadius).sort((left, right) => left - right),
    [8, 999]
  );
});

test("extractDesignSystem keeps cards with different internal structure as separate component candidates", () => {
  const result = extractDesignSystem([
    {
      source: "section.card.tight",
      tagName: "section",
      classNames: ["card", "tight"],
      childCount: 3,
      width: 320,
      height: 220,
      display: "flex",
      gap: 12,
      paddingTop: 24,
      paddingRight: 24,
      paddingBottom: 24,
      paddingLeft: 24,
      justifyContent: "flex-start",
      alignItems: "stretch",
      backgroundColor: "rgb(255, 255, 255)",
      borderColor: "rgb(226, 232, 240)",
      boxShadow: "0px 8px 24px -16px rgba(15, 23, 42, 0.18)"
    },
    {
      source: "section.card.tight-alt",
      tagName: "section",
      classNames: ["card", "tight-alt"],
      childCount: 3,
      width: 320,
      height: 220,
      display: "flex",
      gap: 12,
      paddingTop: 24,
      paddingRight: 24,
      paddingBottom: 24,
      paddingLeft: 24,
      justifyContent: "flex-start",
      alignItems: "stretch",
      backgroundColor: "rgb(255, 255, 255)",
      borderColor: "rgb(226, 232, 240)",
      boxShadow: "0px 8px 24px -16px rgba(15, 23, 42, 0.18)"
    },
    {
      source: "section.card.loose",
      tagName: "section",
      classNames: ["card", "loose"],
      childCount: 3,
      width: 320,
      height: 220,
      display: "flex",
      gap: 24,
      paddingTop: 24,
      paddingRight: 24,
      paddingBottom: 24,
      paddingLeft: 24,
      justifyContent: "flex-start",
      alignItems: "stretch",
      backgroundColor: "rgb(255, 255, 255)",
      borderColor: "rgb(226, 232, 240)",
      boxShadow: "0px 24px 60px -28px rgba(15, 23, 42, 0.35)"
    },
    {
      source: "section.card.loose-alt",
      tagName: "section",
      classNames: ["card", "loose-alt"],
      childCount: 3,
      width: 320,
      height: 220,
      display: "flex",
      gap: 24,
      paddingTop: 24,
      paddingRight: 24,
      paddingBottom: 24,
      paddingLeft: 24,
      justifyContent: "flex-start",
      alignItems: "stretch",
      backgroundColor: "rgb(255, 255, 255)",
      borderColor: "rgb(226, 232, 240)",
      boxShadow: "0px 24px 60px -28px rgba(15, 23, 42, 0.35)"
    }
  ]);

  const cards = result.components.filter((component) => component.type === "Card");
  assert.equal(cards.length, 2);
  assert.deepEqual(
    cards.map((card) => card.autoLayout?.gap).sort((left, right) => left - right),
    [12, 24]
  );
});

test("extractDesignSystem keeps navigation variants with different gaps as separate component candidates", () => {
  const result = extractDesignSystem([
    {
      source: "nav.site.primary",
      tagName: "nav",
      childCount: 4,
      width: 1200,
      height: 64,
      display: "flex",
      gap: 16,
      paddingTop: 12,
      paddingRight: 24,
      paddingBottom: 12,
      paddingLeft: 24,
      justifyContent: "flex-start",
      alignItems: "center",
      backgroundColor: "rgb(255, 255, 255)",
      borderColor: "rgb(226, 232, 240)",
      fontFamily: "Inter, sans-serif",
      fontSize: 14,
      fontWeight: 500,
      lineHeight: 20,
      letterSpacing: 0
    },
    {
      source: "nav.site.secondary",
      tagName: "nav",
      childCount: 4,
      width: 1200,
      height: 64,
      display: "flex",
      gap: 32,
      paddingTop: 12,
      paddingRight: 24,
      paddingBottom: 12,
      paddingLeft: 24,
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "rgb(255, 255, 255)",
      borderColor: "rgb(226, 232, 240)",
      fontFamily: "Inter, sans-serif",
      fontSize: 14,
      fontWeight: 500,
      lineHeight: 20,
      letterSpacing: 0
    }
  ]);

  const navigation = result.components.filter((component) => component.type === "Navigation");
  assert.equal(navigation.length, 2);
  assert.deepEqual(
    navigation.map((item) => item.autoLayout?.gap).sort((left, right) => left - right),
    [16, 32]
  );
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

// ─── Card component detection ────────────────────────────────────────────────

test("extractDesignSystem: no Card component when page has no card-like elements", () => {
  const result = extractDesignSystem([
    {
      source: "button.primary",
      tagName: "button",
      textContent: "Sign up",
      backgroundColor: "rgb(37, 99, 235)",
      textColor: "rgb(255, 255, 255)",
      width: 160,
      height: 48,
      fontFamily: "Inter, sans-serif",
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 24,
      letterSpacing: 0
    },
    {
      source: "button.secondary",
      tagName: "button",
      textContent: "Learn more",
      backgroundColor: "rgb(37, 99, 235)",
      textColor: "rgb(255, 255, 255)",
      width: 160,
      height: 48,
      fontFamily: "Inter, sans-serif",
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 24,
      letterSpacing: 0
    }
  ]);

  const cardComponents = result.components.filter((c) => c.type === "Card");
  assert.equal(cardComponents.length, 0, "no Card should be extracted when page has only buttons");
});

test("extractDesignSystem: a single card-like element is not extracted (needs 2+ instances)", () => {
  const result = extractDesignSystem([
    {
      source: "button.primary",
      tagName: "button",
      textContent: "Sign up",
      backgroundColor: "rgb(37, 99, 235)",
      textColor: "rgb(255, 255, 255)",
      height: 48,
      fontFamily: "Inter, sans-serif",
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 24,
      letterSpacing: 0
    },
    {
      source: "button.secondary",
      tagName: "button",
      textContent: "Learn more",
      backgroundColor: "rgb(37, 99, 235)",
      textColor: "rgb(255, 255, 255)",
      height: 48,
      fontFamily: "Inter, sans-serif",
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 24,
      letterSpacing: 0
    },
    // Only one card — should be filtered out by shouldKeepComponentCandidate
    {
      source: "section.card.hero",
      tagName: "section",
      classNames: ["card", "hero"],
      childCount: 3,
      width: 320,
      height: 220,
      display: "flex",
      backgroundColor: "rgb(255, 255, 255)",
      borderColor: "rgb(226, 232, 240)"
    }
  ]);

  const cardComponents = result.components.filter((c) => c.type === "Card");
  assert.equal(cardComponents.length, 0, "a single card instance must be filtered out");
});

test("extractDesignSystem: repeated generic bordered containers are not promoted to Card", () => {
  const result = extractDesignSystem([
    {
      source: "section.content-block",
      tagName: "section",
      childCount: 2,
      width: 320,
      height: 160,
      display: "block",
      borderColor: "rgb(226, 232, 240)"
    },
    {
      source: "section.content-block-alt",
      tagName: "section",
      childCount: 2,
      width: 320,
      height: 160,
      display: "block",
      borderColor: "rgb(226, 232, 240)"
    }
  ]);

  const cards = result.components.filter((component) => component.type === "Card");
  assert.equal(cards.length, 0, "generic bordered sections must not be extracted as Card");
});

test("extractDesignSystem: two card elements produce exactly one Card component", () => {
  const result = extractDesignSystem([
    {
      source: "section.card.product",
      tagName: "section",
      classNames: ["card", "product"],
      childCount: 3,
      width: 320,
      height: 220,
      display: "flex",
      paddingTop: 24,
      paddingRight: 24,
      paddingBottom: 24,
      paddingLeft: 24,
      backgroundColor: "rgb(255, 255, 255)",
      borderColor: "rgb(226, 232, 240)",
      borderRadius: 16
    },
    {
      source: "section.card.pricing",
      tagName: "section",
      classNames: ["card", "pricing"],
      childCount: 3,
      width: 320,
      height: 220,
      display: "flex",
      paddingTop: 24,
      paddingRight: 24,
      paddingBottom: 24,
      paddingLeft: 24,
      backgroundColor: "rgb(255, 255, 255)",
      borderColor: "rgb(226, 232, 240)",
      borderRadius: 16
    }
  ]);

  const cardComponents = result.components.filter((c) => c.type === "Card");
  assert.equal(cardComponents.length, 1, "two matching card instances should produce one Card component");
});

test("extractDesignSystem: Card captures cornerRadius and padding", () => {
  const result = extractDesignSystem([
    {
      source: "section.card.one",
      tagName: "section",
      classNames: ["card"],
      childCount: 2,
      width: 320,
      height: 200,
      display: "flex",
      paddingTop: 20,
      paddingRight: 24,
      paddingBottom: 20,
      paddingLeft: 24,
      borderRadius: 12,
      backgroundColor: "rgb(255, 255, 255)",
      borderColor: "rgb(226, 232, 240)"
    },
    {
      source: "section.card.two",
      tagName: "section",
      classNames: ["card"],
      childCount: 2,
      width: 320,
      height: 200,
      display: "flex",
      paddingTop: 20,
      paddingRight: 24,
      paddingBottom: 20,
      paddingLeft: 24,
      borderRadius: 12,
      backgroundColor: "rgb(255, 255, 255)",
      borderColor: "rgb(226, 232, 240)"
    }
  ]);

  const card = result.components.find((c) => c.type === "Card");
  assert.ok(card, "Card must be detected");
  assert.equal(card.cornerRadius, 12, "cornerRadius must be captured from DOM");

  const pad = card.padding ?? card.autoLayout?.padding;
  assert.ok(pad, "padding must be captured");
  assert.equal(pad.top, 20);
  assert.equal(pad.right, 24);
  assert.equal(pad.bottom, 20);
  assert.equal(pad.left, 24);
});

test("extractDesignSystem: Card with box shadow maps effect token", () => {
  const result = extractDesignSystem([
    {
      source: "div.card.a",
      tagName: "div",
      classNames: ["card"],
      childCount: 2,
      width: 300,
      height: 200,
      backgroundColor: "rgb(255, 255, 255)",
      boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.12)"
    },
    {
      source: "div.card.b",
      tagName: "div",
      classNames: ["card"],
      childCount: 2,
      width: 300,
      height: 200,
      backgroundColor: "rgb(255, 255, 255)",
      boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.12)"
    }
  ]);

  const card = result.components.find((c) => c.type === "Card");
  assert.ok(card, "Card must be detected");
  assert.ok(card.tokens.effects.length > 0, "Card must reference the shadow effect token");

  const effectToken = result.tokens.effects.find((e) => card.tokens.effects.includes(e.id));
  assert.ok(effectToken, "effect token must exist in tokens list");
  assert.equal(effectToken.style, "drop-shadow");
});

// ─── Button <a> detection ────────────────────────────────────────────────────

test("inferComponentType: small <a> with background and short text is a Button", () => {
  const result = extractDesignSystem([
    {
      source: "a.btn-primary",
      tagName: "a",
      href: "https://example.com/signup",
      textContent: "Get started",
      childCount: 1,
      width: 140,
      height: 44,
      backgroundColor: "rgb(37, 99, 235)",
      textColor: "rgb(255, 255, 255)",
      fontFamily: "Inter, sans-serif",
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 24,
      letterSpacing: 0
    },
    {
      source: "a.btn-secondary",
      tagName: "a",
      href: "https://example.com/demo",
      textContent: "Book a demo",
      childCount: 1,
      width: 140,
      height: 44,
      backgroundColor: "rgb(37, 99, 235)",
      textColor: "rgb(255, 255, 255)",
      fontFamily: "Inter, sans-serif",
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 24,
      letterSpacing: 0
    }
  ]);

  const buttons = result.components.filter((c) => c.type === "Button");
  assert.ok(buttons.length > 0, "small <a> with short label should be a Button");
});

test("extractDesignSystem: hidden injected controls are ignored", () => {
  const result = extractDesignSystem([
    {
      source: "button#cgw_action_btn",
      tagName: "button",
      classNames: ["cgw_action_btn"],
      childCount: 0,
      width: 12,
      height: 2,
      pageY: -9999
    },
    {
      source: "a.cc-solid-lime.button",
      tagName: "a",
      classNames: ["cc-solid-lime", "button"],
      href: "https://example.com/tickets",
      textContent: "get tickets",
      childCount: 1,
      width: 196.09,
      height: 51.66,
      backgroundColor: "rgb(238, 247, 115)",
      textColor: "rgb(27, 26, 24)",
      borderRadius: 16.34,
      fontFamily: "Roobert SemiMono, sans-serif",
      fontSize: 22.08,
      fontWeight: 600,
      lineHeight: 24,
      letterSpacing: 0
    }
  ]);

  assert.equal(result.components.some((component) => component.source === "button#cgw_action_btn"), false);
  assert.equal(result.components.some((component) => component.source === "a.cc-solid-lime.button"), true);
});

test("extractDesignSystem: color modifier CTA anchors stay filled large buttons even when fill is not captured", () => {
  const result = extractDesignSystem([
    {
      source: "a.cc-dragonfruit.button",
      tagName: "a",
      classNames: ["cc-dragonfruit", "button"],
      href: "https://example.com/tickets",
      textContent: "get tickets",
      childCount: 1,
      width: 194.94,
      height: 28.08,
      textColor: "rgb(70, 2, 47)",
      fontFamily: "Roobert SemiMono, sans-serif",
      fontSize: 22.08,
      fontWeight: 600,
      lineHeight: 24,
      letterSpacing: 0
    }
  ]);

  const button = result.components.find((component) => component.source === "a.cc-dragonfruit.button");
  assert.ok(button, "color modifier CTA anchor should be extracted");
  assert.equal(button.type, "Button");
  assert.equal(button.variants.style, "fill");
  assert.equal(button.variants.size, "lg");
});

test("extractDesignSystem: same-as-fill text color is not applied as component text token", () => {
  const result = extractDesignSystem([
    {
      source: "div.card.ube",
      tagName: "div",
      classNames: ["card", "ube"],
      childCount: 2,
      width: 320,
      height: 200,
      backgroundColor: "rgb(200, 187, 251)",
      borderRadius: 24,
      paddingTop: 24,
      paddingRight: 24,
      paddingBottom: 24,
      paddingLeft: 24,
      textColor: "rgb(200, 187, 251)",
      fontFamily: "Roobert, sans-serif",
      fontSize: 22,
      fontWeight: 400,
      lineHeight: 26,
      letterSpacing: 0
    },
    {
      source: "div.card.ube-2",
      tagName: "div",
      classNames: ["card", "ube"],
      childCount: 2,
      width: 320,
      height: 200,
      backgroundColor: "rgb(200, 187, 251)",
      borderRadius: 24,
      paddingTop: 24,
      paddingRight: 24,
      paddingBottom: 24,
      paddingLeft: 24,
      textColor: "rgb(200, 187, 251)",
      fontFamily: "Roobert, sans-serif",
      fontSize: 22,
      fontWeight: 400,
      lineHeight: 26,
      letterSpacing: 0
    }
  ]);

  const card = result.components.find((component) => component.type === "Card");
  assert.ok(card, "Card should be extracted");
  assert.equal(card.tokens.fills.length, 1);
  assert.equal(card.tokens.text.length, 0);
});

test("inferComponentType: tall <a> (hero banner) is NOT a Button", () => {
  const result = extractDesignSystem([
    {
      source: "a.HeroBanner",
      tagName: "a",
      href: "https://example.com/product",
      textContent: "Explore our product suite",
      childCount: 5,
      width: 1200,
      height: 400,
      backgroundColor: "rgb(37, 99, 235)",
      textColor: "rgb(255, 255, 255)",
      fontFamily: "Inter, sans-serif",
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 24,
      letterSpacing: 0
    }
  ]);

  const buttons = result.components.filter((c) => c.type === "Button");
  assert.equal(buttons.length, 0, "tall/wide <a> hero banner must not be classified as a Button");
});

// ─── Navigation component detection ─────────────────────────────────────────

test("inferComponentType: <nav> element is classified as Navigation", () => {
  const result = extractDesignSystem([
    {
      source: "nav.TopNav",
      tagName: "nav",
      childCount: 5,
      width: 1200,
      height: 64,
      display: "flex",
      gap: 32,
      paddingTop: 0,
      paddingRight: 24,
      paddingBottom: 0,
      paddingLeft: 24,
      backgroundColor: "rgb(255, 255, 255)",
      borderColor: "rgb(226, 232, 240)",
      fontFamily: "Inter, sans-serif",
      fontSize: 14,
      fontWeight: 500,
      lineHeight: 20,
      letterSpacing: 0
    }
  ]);

  const navComponents = result.components.filter((c) => c.type === "Navigation");
  assert.equal(navComponents.length, 1, "<nav> element must be classified as Navigation");
});

test("inferComponentType: element with 'navigation' class is classified as Navigation", () => {
  const result = extractDesignSystem([
    {
      source: "div.site-navigation",
      tagName: "div",
      classNames: ["site-navigation"],
      childCount: 6,
      width: 1200,
      height: 72,
      display: "flex",
      backgroundColor: "rgb(15, 23, 42)",
      fontFamily: "Inter, sans-serif",
      fontSize: 14,
      fontWeight: 500,
      lineHeight: 20,
      letterSpacing: 0
    }
  ]);

  const navComponents = result.components.filter((c) => c.type === "Navigation");
  assert.equal(navComponents.length, 1, "element with 'navigation' class must be Navigation");
});

test("inferComponentType: element with 'menu' class is classified as Navigation", () => {
  const result = extractDesignSystem([
    {
      source: "ul.main-menu",
      tagName: "ul",
      classNames: ["main-menu"],
      childCount: 4,
      width: 800,
      height: 48,
      display: "flex"
    }
  ]);

  const navComponents = result.components.filter((c) => c.type === "Navigation");
  assert.equal(navComponents.length, 1, "element with 'menu' class must be Navigation");
});

test("extractDesignSystem: Navigation captures cornerRadius and padding", () => {
  const result = extractDesignSystem([
    {
      source: "nav.TopNav",
      tagName: "nav",
      childCount: 5,
      width: 1200,
      height: 64,
      display: "flex",
      paddingTop: 12,
      paddingRight: 24,
      paddingBottom: 12,
      paddingLeft: 24,
      borderRadius: 0,
      backgroundColor: "rgb(255, 255, 255)",
      borderColor: "rgb(226, 232, 240)",
      fontFamily: "Inter, sans-serif",
      fontSize: 14,
      fontWeight: 500,
      lineHeight: 20,
      letterSpacing: 0
    }
  ]);

  const nav = result.components.find((c) => c.type === "Navigation");
  assert.ok(nav, "Navigation must be detected");
  assert.equal(nav.cornerRadius, 0, "cornerRadius must be captured");

  const pad = nav.padding ?? nav.autoLayout?.padding;
  assert.ok(pad, "padding must be captured");
  assert.equal(pad.top, 12);
  assert.equal(pad.right, 24);
  assert.equal(pad.bottom, 12);
  assert.equal(pad.left, 24);
});

test("extractDesignSystem: Navigation uses a stable top-nav name instead of hashed source text", () => {
  const result = extractDesignSystem([
    {
      source: "navigation/7418f11d",
      tagName: "nav",
      childCount: 4,
      width: 1180,
      height: 72,
      display: "flex",
      paddingTop: 16,
      paddingRight: 24,
      paddingBottom: 16,
      paddingLeft: 24,
      fontFamily: "Inter, sans-serif",
      fontSize: 14,
      fontWeight: 500,
      lineHeight: 20,
      letterSpacing: 0
    }
  ]);

  const nav = result.components.find((component) => component.type === "Navigation");
  assert.ok(nav, "Navigation must be detected");
  assert.equal(nav.name, "navigation/top-nav");
});

test("extractDesignSystem: Navigation maps fill and stroke color tokens", () => {
  const result = extractDesignSystem([
    {
      source: "nav.SiteNav",
      tagName: "nav",
      childCount: 5,
      width: 1440,
      height: 64,
      backgroundColor: "rgb(15, 23, 42)",
      borderColor: "rgb(30, 41, 59)",
      textColor: "rgb(248, 250, 252)",
      fontFamily: "Inter, sans-serif",
      fontSize: 14,
      fontWeight: 500,
      lineHeight: 20,
      letterSpacing: 0
    }
  ]);

  const nav = result.components.find((c) => c.type === "Navigation");
  assert.ok(nav, "Navigation must be detected");
  assert.ok(nav.tokens.fills.length > 0, "Navigation must reference a fill token");
  assert.ok(nav.tokens.strokes.length > 0, "Navigation must reference a stroke token");

  const fillToken = result.tokens.colors.find((t) => nav.tokens.fills.includes(t.id));
  assert.ok(fillToken, "fill token must exist in tokens list");
  assert.equal(fillToken.role, "fill");

  const strokeToken = result.tokens.colors.find((t) => nav.tokens.strokes.includes(t.id));
  assert.ok(strokeToken, "stroke token must exist in tokens list");
  assert.equal(strokeToken.role, "stroke");
});

test("extractDesignSystem: Navigation maps typography token", () => {
  const result = extractDesignSystem([
    {
      source: "nav.TopNav",
      tagName: "nav",
      childCount: 5,
      width: 1200,
      height: 64,
      backgroundColor: "rgb(255, 255, 255)",
      fontFamily: "Sora, sans-serif",
      fontSize: 14,
      fontWeight: 500,
      lineHeight: 20,
      letterSpacing: 0
    }
  ]);

  const nav = result.components.find((c) => c.type === "Navigation");
  assert.ok(nav, "Navigation must be detected");
  assert.ok(nav.tokens.typography.length > 0, "Navigation must reference a typography token");

  const typographyToken = result.tokens.typography.find((t) => nav.tokens.typography.includes(t.id));
  assert.ok(typographyToken, "typography token must exist in tokens list");
  assert.equal(typographyToken.fontFamily, "Sora");
});

// ─── Accordion component detection ──────────────────────────────────────────

test("inferComponentType: <details> element is classified as Accordion", () => {
  const result = extractDesignSystem([
    {
      source: "details.faq-item",
      tagName: "details",
      childCount: 2,
      width: 720,
      height: 56,
      borderColor: "rgb(226, 232, 240)",
      fontFamily: "Inter, sans-serif",
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 24,
      letterSpacing: 0
    }
  ]);

  const accordions = result.components.filter((c) => c.type === "Accordion");
  assert.equal(accordions.length, 1, "<details> element must be classified as Accordion");
});

test("inferComponentType: element with 'accordion' class is classified as Accordion", () => {
  const result = extractDesignSystem([
    {
      source: "div.accordion-item",
      tagName: "div",
      classNames: ["accordion-item"],
      childCount: 2,
      width: 720,
      height: 56,
      borderColor: "rgb(226, 232, 240)"
    }
  ]);

  const accordions = result.components.filter((c) => c.type === "Accordion");
  assert.equal(accordions.length, 1, "element with 'accordion' class must be Accordion");
});

test("inferComponentType: element with 'faq' class is classified as Accordion", () => {
  const result = extractDesignSystem([
    {
      source: "section.faq-section",
      tagName: "section",
      classNames: ["faq-section"],
      childCount: 3,
      width: 720,
      height: 200
    }
  ]);

  const accordions = result.components.filter((c) => c.type === "Accordion");
  assert.equal(accordions.length, 1, "element with 'faq' class must be Accordion");
});

test("inferComponentType: element with 'disclosure' class is classified as Accordion", () => {
  const result = extractDesignSystem([
    {
      source: "div.disclosure-panel",
      tagName: "div",
      classNames: ["disclosure-panel"],
      childCount: 2,
      width: 720,
      height: 56
    }
  ]);

  const accordions = result.components.filter((c) => c.type === "Accordion");
  assert.equal(accordions.length, 1, "element with 'disclosure' class must be Accordion");
});

test("extractDesignSystem: Accordion kept at count === 1 (single instance on page)", () => {
  const result = extractDesignSystem([
    {
      source: "div.accordion",
      tagName: "div",
      classNames: ["accordion"],
      childCount: 3,
      width: 720,
      height: 200,
      borderColor: "rgb(226, 232, 240)",
      fontFamily: "Inter, sans-serif",
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 24,
      letterSpacing: 0
    }
  ]);

  const accordions = result.components.filter((c) => c.type === "Accordion");
  assert.equal(accordions.length, 1, "Accordion must be kept even with a single instance");
});

test("extractDesignSystem: Accordion maps stroke and typography tokens", () => {
  const result = extractDesignSystem([
    {
      source: "details.expandable",
      tagName: "details",
      classNames: ["expandable"],
      childCount: 2,
      width: 720,
      height: 56,
      borderColor: "rgb(226, 232, 240)",
      textColor: "rgb(15, 23, 42)",
      fontFamily: "Sora, sans-serif",
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 24,
      letterSpacing: 0
    }
  ]);

  const accordion = result.components.find((c) => c.type === "Accordion");
  assert.ok(accordion, "Accordion must be detected");
  assert.ok(accordion.tokens.strokes.length > 0, "Accordion must reference a stroke token for divider");
  assert.ok(accordion.tokens.typography.length > 0, "Accordion must reference a typography token");

  const typographyToken = result.tokens.typography.find((t) => accordion.tokens.typography.includes(t.id));
  assert.ok(typographyToken, "typography token must exist");
  assert.equal(typographyToken.fontFamily, "Sora");
});

test("inferComponentType: element with ariaExpanded is classified as Accordion", () => {
  const result = extractDesignSystem([
    {
      source: "div.feature-trigger",
      tagName: "div",
      ariaExpanded: false,
      textContent: "Payroll takes just a few clicks",
      childCount: 2,
      width: 720,
      height: 56,
      borderColor: "rgb(226, 232, 240)",
      paddingTop: 16,
      paddingRight: 20,
      paddingBottom: 16,
      paddingLeft: 20,
      fontFamily: "Inter, sans-serif",
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 24,
      letterSpacing: 0
    }
  ]);

  const accordions = result.components.filter((c) => c.type === "Accordion");
  assert.equal(accordions.length, 1, "element with ariaExpanded must be classified as Accordion");
});

test("extractDesignSystem: bare aria-expanded toggles are not promoted to Accordion", () => {
  const result = extractDesignSystem([
    {
      source: "button.toggle",
      tagName: "button",
      ariaExpanded: false,
      textContent: "Toggle",
      childCount: 1,
      width: 80,
      height: 24
    }
  ]);

  const accordions = result.components.filter((component) => component.type === "Accordion");
  assert.equal(accordions.length, 0, "bare aria-expanded toggles must not be extracted as Accordion");
});

test("inferComponentType: element with ariaExpanded=true (open state) is also Accordion", () => {
  const result = extractDesignSystem([
    {
      source: "button.accordion-trigger",
      tagName: "button",
      ariaExpanded: true,
      textContent: "Sync hours with payroll",
      childCount: 2,
      width: 720,
      height: 56,
      borderColor: "rgb(226, 232, 240)",
      paddingTop: 16,
      paddingRight: 20,
      paddingBottom: 16,
      paddingLeft: 20,
      fontFamily: "Inter, sans-serif",
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 24,
      letterSpacing: 0
    }
  ]);

  // ariaExpanded wins over the button tagName detection
  const accordions = result.components.filter((c) => c.type === "Accordion");
  assert.equal(accordions.length, 1, "button with ariaExpanded must be Accordion, not Button");
});

test("extractDesignSystem: menu-style aria-expanded triggers are not promoted to Accordion", () => {
  const result = extractDesignSystem([
    {
      source: "button.radix-navigation-menu-trigger",
      tagName: "button",
      ariaExpanded: false,
      textContent: "Product",
      childCount: 2,
      width: 132,
      height: 40,
      borderColor: "rgb(226, 232, 240)",
      paddingTop: 8,
      paddingRight: 12,
      paddingBottom: 8,
      paddingLeft: 12,
      fontFamily: "Inter, sans-serif",
      fontSize: 14,
      fontWeight: 500,
      lineHeight: 20,
      letterSpacing: 0
    }
  ]);

  const accordions = result.components.filter((component) => component.type === "Accordion");
  assert.equal(accordions.length, 0, "menu-style aria-expanded triggers must not be extracted as Accordion");
});

test("inferComponentType: <a> with background but too many children is NOT a Button", () => {
  const result = extractDesignSystem([
    {
      source: "a.NavCard",
      tagName: "a",
      href: "https://example.com/features",
      textContent: "Features overview heading with description",
      childCount: 6,
      width: 320,
      height: 200,
      backgroundColor: "rgb(255, 255, 255)",
      textColor: "rgb(15, 23, 42)",
      fontFamily: "Inter, sans-serif",
      fontSize: 16,
      fontWeight: 400,
      lineHeight: 24,
      letterSpacing: 0
    }
  ]);

  const buttons = result.components.filter((c) => c.type === "Button");
  assert.equal(buttons.length, 0, "<a> with many children must not be a Button");
});

test("extractTokens: same style with different textAlign produces one token with dominant alignment", () => {
  // Real pattern: Notion homepage uses Inter 48px bold centered in hero, left-aligned in sections
  const tokens = extractTokens([
    {
      source: "h1.hero-title",
      fontFamily: "Inter, sans-serif",
      fontSize: 48,
      fontWeight: 700,
      lineHeight: 56,
      letterSpacing: -0.5,
      textAlign: "center"
    },
    {
      source: "h2.section-title",
      fontFamily: "Inter, sans-serif",
      fontSize: 48,
      fontWeight: 700,
      lineHeight: 56,
      letterSpacing: -0.5,
      textAlign: "left"
    },
    {
      source: "h2.section-title-2",
      fontFamily: "Inter, sans-serif",
      fontSize: 48,
      fontWeight: 700,
      lineHeight: 56,
      letterSpacing: -0.5,
      textAlign: "left"
    }
  ]);

  assert.equal(tokens.typography.length, 1, "Same style with different alignment must produce one token");
  assert.equal(tokens.typography[0].textAlign, "left", "Dominant alignment (2x left vs 1x center) must win");
});

// ─── Regression tests from sculpt.clay.com debug output ──────────────────────
// Real observed values. Prevents regressions for misclassification bugs found
// on that page. Each test is named after the element that exposed the bug.

test("inferComponentType: large CTA anchor (h=96px) is classified as Button, not Card", () => {
  // sculpt.clay.com "Secure your spot" — a.w-inline-block, h=96px, fill background.
  // Was misclassified as Card because isButtonLikeAnchor requires height <= 80.
  const result = extractDesignSystem([{
    source: "a.w-inline-block",
    tagName: "a",
    textContent: "Secure your spot",
    backgroundColor: "rgb(27, 26, 24)",
    textColor: "rgb(254, 253, 251)",
    height: 96.06,
    width: 571.63,
    paddingTop: 26.5,
    paddingRight: 39.75,
    paddingBottom: 26.5,
    paddingLeft: 39.75,
    borderRadius: 35.33,
    childCount: 2,
    fontFamily: "Roobert, sans-serif",
    fontSize: 22.08,
    fontWeight: 400,
    lineHeight: 26.5
  }]);

  const buttons = result.components.filter((c) => c.type === "Button");
  const cards = result.components.filter((c) => c.type === "Card");
  assert.equal(buttons.length, 1, "large CTA anchor should be a Button");
  assert.equal(cards.length, 0, "large CTA anchor must not be misclassified as Card");
});

test("inferComponentType: wrapper anchor with 2px padding and no fill is not a Button", () => {
  // sculpt.clay.com a.w-inline-block.button — h=26px, padding=2px all sides,
  // no backgroundColor, no textColor. This is a Webflow clip wrapper, not a real button.
  const result = extractDesignSystem([
    {
      source: "a.w-inline-block.button",
      tagName: "a",
      classNames: ["w-inline-block", "button"],
      textContent: "get tickets",
      height: 26.48,
      width: 194.94,
      paddingTop: 2,
      paddingRight: 2,
      paddingBottom: 2,
      paddingLeft: 2,
      childCount: 1,
      fontFamily: "Roobert SemiMono, sans-serif",
      fontSize: 22.08,
      fontWeight: 600,
      lineHeight: 26.5
    }
  ]);

  const buttons = result.components.filter((c) => c.type === "Button");
  assert.equal(buttons.length, 0, "wrapper anchor with 2px padding and no visual treatment must not become a Button");
});

test("hasNavigationConfidence: zero-height nav element is filtered out", () => {
  // sculpt.clay.com a#w-node-... classified as Navigation with h=0px.
  // A zero-height element is invisible and must not be kept as a component.
  const result = extractDesignSystem([{
    source: "a#w-node-abc123",
    tagName: "a",
    classNames: ["w-nav-brand"],
    textContent: "",
    height: 0,
    width: 145.75,
    landmark: "nav",
    fontFamily: "Roobert, sans-serif",
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 19.2
  }]);

  const navComponents = result.components.filter((c) => c.type === "Navigation");
  assert.equal(navComponents.length, 0, "zero-height navigation element must be filtered out");
});

test("hasContentBlockConfidence: full-viewport-width container is filtered out", () => {
  // sculpt.clay.com div.section_content — w=1457px, treated as a page layout section,
  // not a reusable component. Must not appear in components list.
  const result = extractDesignSystem([
    {
      source: "div.section_content",
      tagName: "div",
      textContent: "Some content block text here",
      height: 750,
      width: 1457.5,
      childCount: 3,
      gap: 61.83,
      fontFamily: "Roobert, sans-serif",
      fontSize: 22.08,
      fontWeight: 400,
      lineHeight: 26.5,
      textColor: "rgb(27, 26, 24)"
    },
    {
      source: "div.section_content",
      tagName: "div",
      textContent: "Another section block here",
      height: 680,
      width: 1457.5,
      childCount: 3,
      gap: 61.83,
      fontFamily: "Roobert, sans-serif",
      fontSize: 22.08,
      fontWeight: 400,
      lineHeight: 26.5,
      textColor: "rgb(27, 26, 24)"
    },
    {
      source: "div.section_content",
      tagName: "div",
      textContent: "Third section block here",
      height: 700,
      width: 1457.5,
      childCount: 3,
      gap: 61.83,
      fontFamily: "Roobert, sans-serif",
      fontSize: 22.08,
      fontWeight: 400,
      lineHeight: 26.5,
      textColor: "rgb(27, 26, 24)"
    }
  ]);

  const contentBlocks = result.components.filter((c) => c.type === "ContentBlock");
  assert.equal(contentBlocks.length, 0, "full-viewport-width containers must not become ContentBlock components");
});
