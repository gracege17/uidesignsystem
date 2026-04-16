import type { ComponentType } from "@extractor/types";
import type { SerializedStyleNode } from "../index.js";
import {
  buildLegacyPatternGroupKey,
  buildPatternSignature,
  flattenApproximatePatternSignature,
  type PatternSignatureHelpers
} from "./signatures.js";
import { inferPatternBoundary } from "./boundaries.js";
import {
  confidenceForPattern,
  mapComponentTypeToPatternKind,
  scorePatternKinds
} from "./scoring.js";
import { inferPatternSlots } from "./slots.js";
import type {
  LegacyComponentCandidate,
  PatternCandidate
} from "./types.js";

export interface PatternExtractionHelpers extends PatternSignatureHelpers {
  isIgnoredComponentCandidate: (node: SerializedStyleNode) => boolean;
  inferComponentType: (node: SerializedStyleNode) => ComponentType;
  shouldKeepComponentCandidate: (candidate: LegacyComponentCandidate) => boolean;
}

export function extractPatternCandidates(
  nodes: SerializedStyleNode[],
  helpers: PatternExtractionHelpers
): PatternCandidate[] {
  const grouped = new Map<string, PatternCandidate>();

  for (const node of nodes) {
    if (helpers.isIgnoredComponentCandidate(node)) {
      continue;
    }

    const legacyType = helpers.inferComponentType(node);
    if (legacyType === "Unknown") {
      continue;
    }

    const signature = buildPatternSignature(node, helpers);
    const legacySignature = buildLegacyPatternGroupKey(legacyType, node, helpers);
    const kind = mapComponentTypeToPatternKind(legacyType);
    const groupKey = groupKeyForPattern(kind, legacyType, signature, legacySignature);
    const existing = grouped.get(groupKey);

    if (existing) {
      existing.instances.push(node);
      existing.evidence.push({
        node,
        reason: [
          usesApproximateGrouping(kind, legacyType)
            ? "matched approximate pattern signature"
            : "matched existing component signature"
        ]
      });
      existing.confidence = confidenceForPattern(existing);
      continue;
    }

    const scores = scorePatternKinds(node, legacyType);
    const candidate: PatternCandidate = {
      id: `pattern-${String(grouped.size + 1).padStart(3, "0")}`,
      kind,
      legacyType,
      representative: node,
      instances: [node],
      legacySignature,
      signature,
      slots: inferPatternSlots(node, kind),
      boundary: inferPatternBoundary(node, kind),
      scores,
      confidence: 0.5,
      warnings: [],
      evidence: [
        {
          node,
          reason: [`mapped legacy ${legacyType} to ${kind} pattern`]
        }
      ]
    };

    candidate.confidence = confidenceForPattern(candidate);
    grouped.set(groupKey, candidate);
  }

  return Array.from(grouped.values())
    .filter((pattern) =>
      helpers.shouldKeepComponentCandidate(patternToLegacyCandidate(pattern))
    )
    .sort((left, right) => {
      if (right.instances.length !== left.instances.length) {
        return right.instances.length - left.instances.length;
      }

      return left.legacyType.localeCompare(right.legacyType);
    });
}

export function patternToLegacyCandidate(pattern: PatternCandidate): LegacyComponentCandidate {
  return {
    type: pattern.legacyType,
    node: pattern.representative,
    count: pattern.instances.length,
    signature: pattern.legacySignature
  };
}

function groupKeyForPattern(
  kind: PatternCandidate["kind"],
  legacyType: ComponentType,
  signature: PatternCandidate["signature"],
  legacySignature: string
): string {
  if (!usesApproximateGrouping(kind, legacyType)) {
    return legacySignature;
  }

  return [
    "pattern",
    kind,
    flattenApproximatePatternSignature(signature)
  ].join("|");
}

function usesApproximateGrouping(
  kind: PatternCandidate["kind"],
  legacyType: ComponentType
): boolean {
  return kind === "collection-item" || legacyType === "Card";
}
