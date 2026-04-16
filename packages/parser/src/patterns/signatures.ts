import type { ComponentVariants } from "@extractor/types";
import type { SerializedStyleNode } from "../index.js";
import type { PatternSignature } from "./types.js";

export interface PatternSignatureHelpers {
  inferVariants: (node: SerializedStyleNode) => ComponentVariants;
  normalizeColor: (value: string | undefined) => string | null;
  normalizeFontFamily: (value: string) => string;
  normalizeLength: (value: number | string | undefined) => number | null;
  makeSpacingSignature: (node: SerializedStyleNode) => string;
  makeStructureSignature: (node: SerializedStyleNode) => string;
  inferSemanticStem: (sources: string[], kind: "component") => string | null;
}

export function buildPatternSignature(
  node: SerializedStyleNode,
  helpers: PatternSignatureHelpers
): PatternSignature {
  const variants = helpers.inferVariants(node);

  return {
    structure: [
      elementFamily(node),
      displayFamily(node.display),
      childCountBucket(node.childCount ?? 0),
      node.landmark ?? "none",
      node.textContent?.trim() ? "has-text" : "no-text"
    ].join("|"),
    visual: [
      variants.style,
      variants.size,
      sizeBucket(node.width, node.height),
      radiusBucket(helpers.normalizeLength(node.borderRadius)),
      spacingBucket(node, helpers),
      gapBucket(helpers.normalizeLength(node.gap)),
      elevationBucket(node)
    ].join("|"),
    semantic: helpers.inferSemanticStem([node.source], "component") ?? undefined
  };
}

export function buildLegacyPatternGroupKey(
  legacyType: string,
  node: SerializedStyleNode,
  helpers: PatternSignatureHelpers
): string {
  const variants = helpers.inferVariants(node);

  return [
    legacyType,
    variants.style,
    variants.size,
    helpers.normalizeColor(node.backgroundColor) ?? "",
    helpers.normalizeColor(node.borderColor) ?? "",
    helpers.normalizeColor(node.textColor) ?? "",
    helpers.normalizeFontFamily(node.fontFamily ?? "") || "",
    helpers.normalizeLength(node.fontSize) ?? "",
    helpers.makeSpacingSignature(node),
    helpers.normalizeLength(node.borderRadius) ?? "",
    helpers.makeStructureSignature(node),
    helpers.inferSemanticStem([node.source], "component") ?? ""
  ].join("|");
}

export function flattenPatternSignature(signature: PatternSignature): string {
  return [signature.structure, signature.visual, signature.semantic ?? ""].join("|");
}

export function flattenApproximatePatternSignature(signature: PatternSignature): string {
  return [signature.structure, signature.visual].join("|");
}

function elementFamily(node: SerializedStyleNode): string {
  const tagName = (node.tagName ?? "").toLowerCase();
  const source = [
    node.source,
    node.role,
    node.inputType,
    ...(node.classNames ?? [])
  ].join(" ").toLowerCase();

  if (tagName === "button" || node.role === "button" || /\b(btn|button|cta)\b/.test(source)) {
    return "action";
  }

  if (["input", "textarea", "select"].includes(tagName)) {
    return "form-control";
  }

  if (tagName === "nav" || node.landmark === "nav" || /\b(nav|navigation|menu|tabs?)\b/.test(source)) {
    return "navigation";
  }

  if (["img", "picture", "video", "svg"].includes(tagName) || /\b(img|image|media|avatar|logo|icon)\b/.test(source)) {
    return "media";
  }

  if ((node.childCount ?? 0) > 0) {
    return "container";
  }

  return "text";
}

function displayFamily(display: string | undefined): string {
  const normalized = (display ?? "").toLowerCase();
  if (normalized.includes("flex")) return "flex";
  if (normalized.includes("grid")) return "grid";
  if (normalized.includes("inline")) return "inline";
  if (normalized === "block") return "block";
  return normalized || "unknown-display";
}

function childCountBucket(count: number): string {
  if (count <= 0) return "children-0";
  if (count === 1) return "children-1";
  if (count <= 3) return "children-2-3";
  return "children-4-plus";
}

function sizeBucket(width: number | undefined, height: number | undefined): string {
  const w = width ?? 0;
  const h = height ?? 0;

  if (w >= 900 || h >= 320) return "large";
  if (w >= 240 || h >= 80) return "regular";
  if (w > 0 || h > 0) return "compact";
  return "unknown-size";
}

function radiusBucket(radius: number | null): string {
  if (radius === null || radius <= 0) return "square";
  if (radius >= 999 || radius >= 32) return "pill";
  if (radius >= 12) return "rounded";
  return "soft";
}

function spacingBucket(node: SerializedStyleNode, helpers: PatternSignatureHelpers): string {
  const values = [
    node.paddingTop,
    node.paddingRight,
    node.paddingBottom,
    node.paddingLeft,
    node.gap
  ]
    .map((value) => helpers.normalizeLength(value))
    .filter((value): value is number => value !== null);

  if (values.length === 0) return "no-spacing";

  const max = Math.max(...values);
  if (max >= 40) return "spacious";
  if (max >= 20) return "regular";
  if (max > 0) return "tight";
  return "no-spacing";
}

function gapBucket(gap: number | null): string {
  if (gap === null || gap <= 0) return "gap-none";
  if (gap >= 40) return "gap-spacious";
  if (gap >= 20) return "gap-regular";
  return "gap-tight";
}

function elevationBucket(node: SerializedStyleNode): string {
  if (node.boxShadow) return "elevated";
  if (node.borderColor) return "outlined";
  if (node.backgroundColor) return "filled";
  return "flat";
}
