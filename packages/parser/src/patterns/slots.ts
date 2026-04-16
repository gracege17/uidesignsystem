import type { SerializedStyleNode } from "../index.js";
import type { PatternKind, PatternSlot } from "./types.js";

export function inferPatternSlots(node: SerializedStyleNode, kind: PatternKind): PatternSlot[] {
  const slots = new Set<PatternSlot>();
  const source = [
    node.source,
    ...(node.classNames ?? [])
  ].join(" ").toLowerCase();
  const text = node.textContent?.trim() ?? "";
  const fontSize = typeof node.fontSize === "number" ? node.fontSize : 0;

  if ((node.childCount ?? 0) > 0) slots.add("container");
  if (text.length > 0) slots.add("body");
  if (kind === "action") slots.add("action");
  if (/\b(img|image|avatar|photo|logo|media|icon)\b/.test(source)) slots.add("media");
  if (/\b(icon)\b/.test(source)) slots.add("icon");
  if (/\b(meta|eyebrow|caption|label|tag|badge)\b/.test(source)) slots.add("metadata");
  if (fontSize >= 20 || /\b(heading|title|headline|hero)\b/.test(source)) slots.add("heading");

  return Array.from(slots);
}
