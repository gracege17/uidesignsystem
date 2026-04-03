import test from "node:test";
import assert from "node:assert/strict";
import { extractDesignSystem, extractTokens } from "../dist/index.js";

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
