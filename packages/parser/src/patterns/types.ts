import type { ComponentType } from "@extractor/types";
import type { SerializedStyleNode } from "../index.js";

export type PatternKind =
  | "action"
  | "surface"
  | "collection-item"
  | "navigation"
  | "form-control"
  | "disclosure"
  | "badge"
  | "unknown";

export type PatternSlot =
  | "media"
  | "heading"
  | "body"
  | "action"
  | "icon"
  | "metadata"
  | "container";

export interface PatternEvidence {
  node: SerializedStyleNode;
  reason: string[];
}

export interface PatternBoundary {
  rootSource: string;
  visualSource?: string;
  interactionSource?: string;
  contentSource?: string;
}

export interface PatternSignature {
  structure: string;
  visual: string;
  semantic?: string;
}

export interface PatternCandidate {
  id: string;
  kind: PatternKind;
  legacyType: ComponentType;
  representative: SerializedStyleNode;
  instances: SerializedStyleNode[];
  legacySignature: string;
  signature: PatternSignature;
  slots: PatternSlot[];
  boundary: PatternBoundary;
  scores: Partial<Record<PatternKind, number>>;
  confidence: number;
  warnings: string[];
  evidence: PatternEvidence[];
}

export interface LegacyComponentCandidate {
  type: ComponentType;
  node: SerializedStyleNode;
  count: number;
  signature: string;
}
