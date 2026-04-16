import type { ComponentType } from "@extractor/types";
import type { SerializedStyleNode } from "../index.js";
import type { PatternCandidate, PatternKind } from "./types.js";

export function mapComponentTypeToPatternKind(type: ComponentType): PatternKind {
  switch (type) {
    case "Button":
      return "action";
    case "Input":
      return "form-control";
    case "Navigation":
    case "NavigationItem":
      return "navigation";
    case "Accordion":
      return "disclosure";
    case "Badge":
      return "badge";
    case "FeatureItem":
    case "ContentBlock":
    case "ListItem":
      return "collection-item";
    case "Card":
    case "Modal":
      return "surface";
    default:
      return "unknown";
  }
}

export function scorePatternKinds(
  node: SerializedStyleNode,
  legacyType: ComponentType
): Partial<Record<PatternKind, number>> {
  const source = [
    node.tagName,
    node.role,
    node.inputType,
    node.source,
    ...(node.classNames ?? [])
  ].join(" ").toLowerCase();
  const scores: Partial<Record<PatternKind, number>> = {};
  const legacyKind = mapComponentTypeToPatternKind(legacyType);

  if (legacyKind !== "unknown") {
    scores[legacyKind] = 0.75;
  }

  if (node.tagName === "button" || node.role === "button" || /\b(btn|button|cta)\b/.test(source)) {
    scores.action = Math.max(scores.action ?? 0, 0.7);
  }

  if (node.tagName === "nav" || node.landmark === "nav" || /\b(nav|navigation|tabs?)\b/.test(source)) {
    scores.navigation = Math.max(scores.navigation ?? 0, 0.7);
  }

  if (["input", "textarea", "select"].includes(node.tagName ?? "")) {
    scores["form-control"] = Math.max(scores["form-control"] ?? 0, 0.85);
  }

  if (node.ariaExpanded !== undefined || /\b(accordion|disclosure|faq|expandable)\b/.test(source)) {
    scores.disclosure = Math.max(scores.disclosure ?? 0, 0.7);
  }

  if (node.boxShadow || node.borderColor || node.backgroundColor) {
    scores.surface = Math.max(scores.surface ?? 0, 0.45);
  }

  if ((node.childCount ?? 0) >= 2 && node.textContent?.trim()) {
    scores["collection-item"] = Math.max(scores["collection-item"] ?? 0, 0.45);
  }

  if (/\b(badge|chip|pill|tag)\b/.test(source)) {
    scores.badge = Math.max(scores.badge ?? 0, 0.75);
  }

  return scores;
}

export function confidenceForPattern(pattern: PatternCandidate): number {
  let confidence = 0.35;

  if (pattern.kind !== "unknown") confidence += 0.2;
  if (pattern.instances.length > 1) confidence += 0.25;
  if (pattern.slots.length >= 2) confidence += 0.1;
  if (Object.keys(pattern.scores).length > 1) confidence += 0.05;
  if (pattern.representative.landmark === "footer") confidence -= 0.1;
  if (pattern.warnings.length > 0) confidence -= Math.min(0.2, pattern.warnings.length * 0.05);

  return Math.max(0, Math.min(1, Math.round(confidence * 100) / 100));
}
