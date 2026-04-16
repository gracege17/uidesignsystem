import type { SerializedStyleNode } from "../index.js";
import type { PatternBoundary, PatternKind } from "./types.js";

export function inferPatternBoundary(
  node: SerializedStyleNode,
  kind: PatternKind
): PatternBoundary {
  const hasVisualTreatment = Boolean(
    node.backgroundColor ||
      node.borderColor ||
      node.boxShadow ||
      node.borderRadius ||
      node.paddingTop ||
      node.paddingRight ||
      node.paddingBottom ||
      node.paddingLeft
  );

  return {
    rootSource: node.source,
    visualSource: hasVisualTreatment ? node.source : undefined,
    interactionSource: isInteractiveKind(kind) ? node.source : undefined,
    contentSource: node.textContent?.trim() ? node.source : undefined
  };
}

function isInteractiveKind(kind: PatternKind): boolean {
  return kind === "action" || kind === "navigation" || kind === "form-control" || kind === "disclosure";
}
