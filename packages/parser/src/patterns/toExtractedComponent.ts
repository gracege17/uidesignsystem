import type {
  AutoLayout,
  ComponentVariants,
  DesignTokens,
  ExtractedComponent
} from "@extractor/types";
import type { SerializedStyleNode } from "../index.js";
import { patternToLegacyCandidate } from "./extractPatternCandidates.js";
import type { PatternCandidate } from "./types.js";

export interface PatternToComponentHelpers {
  inferComponentName: (
    candidate: ReturnType<typeof patternToLegacyCandidate>,
    usedNames: Set<string>,
    index: number
  ) => string;
  inferComponentVariants: (node: SerializedStyleNode) => ComponentVariants;
  matchAppliedTokens: (
    node: SerializedStyleNode,
    tokens: DesignTokens
  ) => ExtractedComponent["tokens"];
  inferAutoLayout: (node: SerializedStyleNode) => AutoLayout | undefined;
  normalizeLength: (value: number | string | undefined) => number | null;
  inferPadding: (node: SerializedStyleNode) => AutoLayout["padding"] | undefined;
}

export function patternsToComponents(
  patterns: PatternCandidate[],
  tokens: DesignTokens,
  helpers: PatternToComponentHelpers
): ExtractedComponent[] {
  const usedNames = new Set<string>();

  return patterns.map((pattern, index) =>
    patternToExtractedComponent(pattern, tokens, usedNames, index + 1, helpers)
  );
}

function patternToExtractedComponent(
  pattern: PatternCandidate,
  tokens: DesignTokens,
  usedNames: Set<string>,
  index: number,
  helpers: PatternToComponentHelpers
): ExtractedComponent {
  const node = pattern.representative;
  const legacyCandidate = patternToLegacyCandidate(pattern);
  const text = node.textContent?.trim() ?? "";

  return {
    id: `component-${String(index).padStart(3, "0")}`,
    name: helpers.inferComponentName(legacyCandidate, usedNames, index),
    type: pattern.legacyType,
    source: node.source,
    description:
      pattern.instances.length > 1
        ? `Detected ${pattern.instances.length} matching instances from repeated DOM patterns.`
        : "Detected from a strong structural component signal.",
    variants: helpers.inferComponentVariants(node),
    tokens: helpers.matchAppliedTokens(node, tokens),
    autoLayout: helpers.inferAutoLayout(node),
    cornerRadius: helpers.normalizeLength(node.borderRadius) ?? undefined,
    padding: helpers.inferPadding(node),
    width: helpers.normalizeLength(node.width) ?? undefined,
    height: helpers.normalizeLength(node.height) ?? undefined,
    textContent: text.length > 0 && text.length <= 30 ? text : undefined,
    landmark: node.landmark,
    pageY: node.pageY,
    position: node.position !== "static" ? node.position : undefined
  };
}
