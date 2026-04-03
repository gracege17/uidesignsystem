import type {
  AutoLayout,
  AutoLayoutAlignment,
  ColorToken,
  ColorTokenRole,
  ComponentType,
  ComponentVariants,
  DesignTokens,
  EffectStyle,
  EffectToken,
  ExtractedComponent,
  FontWeight,
  TypographyToken
} from "@extractor/types";

export interface SerializedStyleNode {
  source: string;
  tagName?: string;
  classNames?: string[];
  textContent?: string;
  childCount?: number;
  width?: number;
  height?: number;
  display?: string;
  gap?: number | string;
  paddingTop?: number | string;
  paddingRight?: number | string;
  paddingBottom?: number | string;
  paddingLeft?: number | string;
  justifyContent?: string;
  alignItems?: string;
  flexWrap?: string;
  borderRadius?: number | string;
  role?: string;
  href?: string;
  inputType?: string;
  disabled?: boolean;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  boxShadow?: string;
  filter?: string;
  backdropFilter?: string;
  fontFamily?: string;
  fontSize?: number | string;
  fontWeight?: number | string;
  lineHeight?: number | string;
  letterSpacing?: number | string;
  textTransform?: TypographyToken["textTransform"];
}

interface ColorCandidate {
  role: ColorTokenRole;
  value: string;
  count: number;
  sources: string[];
}

interface TypographyCandidate {
  fontFamily: string;
  fontSize: number;
  fontWeight: FontWeight;
  lineHeight: number;
  letterSpacing: number;
  textTransform: TypographyToken["textTransform"];
  count: number;
  sources: string[];
}

interface EffectCandidate {
  style: EffectStyle;
  color?: string;
  offset?: { x: number; y: number };
  blurRadius: number;
  spreadRadius?: number;
  count: number;
  sources: string[];
}

interface ComponentCandidate {
  type: ComponentType;
  node: SerializedStyleNode;
  count: number;
  signature: string;
}

const GENERIC_SOURCE_TERMS = new Set([
  "active",
  "article",
  "aside",
  "body",
  "button",
  "caption",
  "center",
  "component",
  "container",
  "content",
  "cta",
  "default",
  "description",
  "details",
  "dialog",
  "disabled",
  "div",
  "elevated",
  "field",
  "featured",
  "footer",
  "form",
  "header",
  "hero",
  "hover",
  "icon",
  "image",
  "img",
  "input",
  "item",
  "label",
  "legal",
  "large",
  "layout",
  "link",
  "list",
  "main",
  "md",
  "medium",
  "menu",
  "modal",
  "nav",
  "navigation",
  "page",
  "panel",
  "primary",
  "root",
  "row",
  "screen",
  "secondary",
  "section",
  "shadow",
  "small",
  "smallprint",
  "sm",
  "span",
  "state",
  "subtitle",
  "surface",
  "tag",
  "text",
  "title",
  "toolbar",
  "wrapper"
]);

const PREFERRED_SOURCE_TERMS = [
  "brand",
  "accent",
  "danger",
  "warning",
  "success",
  "info",
  "muted",
  "inverse",
  "background",
  "foreground",
  "border",
  "outline",
  "heading",
  "body",
  "caption",
  "overline",
  "display",
  "eyebrow",
  "label",
  "input",
  "button",
  "card",
  "modal",
  "nav",
  "link",
  "badge"
];

export function extractDesignSystem(
  nodes: SerializedStyleNode[] = []
): { tokens: DesignTokens; components: ExtractedComponent[] } {
  const tokens = extractTokens(nodes);
  const components = extractComponents(nodes, tokens);
  return { tokens, components };
}

export function extractTokens(nodes: SerializedStyleNode[] = []): DesignTokens {
  const filteredNodes = nodes.filter((node) => !isRootLevelNode(node));
  const colorCandidates = collectColorCandidates(filteredNodes);
  const typographyCandidates = collectTypographyCandidates(filteredNodes);
  const effectCandidates = collectEffectCandidates(filteredNodes);

  const colors = buildColorTokens(colorCandidates);
  const typography = buildTypographyTokens(typographyCandidates);
  const effects = buildEffectTokens(effectCandidates);

  return { colors, typography, effects };
}

export function extractComponents(
  nodes: SerializedStyleNode[] = [],
  tokens: DesignTokens = extractTokens(nodes)
): ExtractedComponent[] {
  const candidates = collectComponentCandidates(nodes.filter((node) => !isRootLevelNode(node)));
  const usedNames = new Set<string>();

  return candidates.map((candidate, index) => {
    const variants = inferComponentVariants(candidate.node);
    const semanticStem = inferSemanticStem([candidate.node.source], "component");
    const name = makeUniqueName(
      `${candidate.type.toLowerCase()}/${semanticStem ?? candidate.type.toLowerCase()}`,
      usedNames,
      index + 1
    );

    return {
      id: `component-${String(index + 1).padStart(3, "0")}`,
      name,
      type: candidate.type,
      source: candidate.node.source,
      description:
        candidate.count > 1
          ? `Detected ${candidate.count} matching instances from repeated DOM patterns.`
          : "Detected from a strong structural component signal.",
      variants,
      tokens: matchAppliedTokens(candidate.node, tokens),
      autoLayout: inferAutoLayout(candidate.node),
      cornerRadius: normalizeLength(candidate.node.borderRadius) ?? undefined
    };
  });
}

function collectComponentCandidates(nodes: SerializedStyleNode[]): ComponentCandidate[] {
  const grouped = new Map<string, ComponentCandidate>();

  for (const node of nodes) {
    const type = inferComponentType(node);
    if (type === "Unknown") {
      continue;
    }

    const variants = inferComponentVariants(node);
    const signature = [
      type,
      variants.style,
      variants.size,
      normalizeColor(node.backgroundColor) ?? "",
      normalizeColor(node.borderColor) ?? "",
      normalizeColor(node.textColor) ?? "",
      normalizeFontFamily(node.fontFamily ?? "") || "",
      normalizeLength(node.fontSize) ?? "",
      inferSemanticStem([node.source], "component") ?? ""
    ].join("|");

    const existing = grouped.get(signature);
    if (existing) {
      existing.count += 1;
      continue;
    }

    grouped.set(signature, { type, node, count: 1, signature });
  }

  return Array.from(grouped.values())
    .filter((candidate) => shouldKeepComponentCandidate(candidate))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.type.localeCompare(right.type);
    });
}

function shouldKeepComponentCandidate(candidate: ComponentCandidate): boolean {
  if (candidate.count > 1) {
    return true;
  }

  return (
    candidate.type === "Modal" ||
    candidate.type === "Navigation" ||
    candidate.type === "Input" ||
    candidate.type === "Button"
  );
}

function isRootLevelNode(node: SerializedStyleNode): boolean {
  const tagName = (node.tagName ?? "").toLowerCase();
  const source = node.source.toLowerCase();
  return (
    tagName === "html" ||
    tagName === "body" ||
    source === "html" ||
    source === "body" ||
    source === "main" ||
    source === "div" ||
    source === "span"
  );
}

function inferComponentType(node: SerializedStyleNode): ComponentType {
  const haystack = [
    node.tagName,
    node.role,
    node.inputType,
    node.href ? "link" : "",
    node.source,
    ...(node.classNames ?? [])
  ]
    .join(" ")
    .toLowerCase();

  if (
    node.tagName === "button" ||
    /\b(btn|button|cta)\b/.test(haystack) ||
    (node.tagName === "a" && Boolean(node.backgroundColor))
  ) {
    return "Button";
  }

  if (
    ["input", "textarea", "select"].includes(node.tagName ?? "") ||
    /\b(input|field|search|textarea|select)\b/.test(haystack)
  ) {
    return "Input";
  }

  if (node.tagName === "nav" || /\b(nav|navigation|menu|tabs?)\b/.test(haystack)) {
    return "Navigation";
  }

  if (node.role === "dialog" || /\b(modal|dialog|drawer|sheet)\b/.test(haystack)) {
    return "Modal";
  }

  if (
    /\b(card|panel|tile)\b/.test(haystack) ||
    (Boolean(node.boxShadow || node.backgroundColor || node.borderColor) &&
      (node.childCount ?? 0) >= 1 &&
      (node.height ?? 0) >= 48)
  ) {
    return "Card";
  }

  if (
    /\b(badge|chip|pill|tag)\b/.test(haystack) ||
    ((node.height ?? 0) <= 36 &&
      (normalizeLength(node.borderRadius) ?? 0) >= 12 &&
      Boolean(node.textContent))
  ) {
    return "Badge";
  }

  return "Unknown";
}

function inferComponentVariants(node: SerializedStyleNode): ComponentVariants {
  const hasFill = Boolean(normalizeColor(node.backgroundColor));
  const hasStroke = Boolean(normalizeColor(node.borderColor));

  let style: ComponentVariants["style"] = "fill";
  if (hasStroke && !hasFill) {
    style = "outline";
  } else if (!hasFill && !hasStroke) {
    style = "ghost";
  }

  const lowerSource = node.source.toLowerCase();
  let state: ComponentVariants["state"] = "default";
  if (node.disabled || lowerSource.includes("disabled")) {
    state = "disabled";
  } else if (lowerSource.includes("hover")) {
    state = "hover";
  } else if (lowerSource.includes("active")) {
    state = "active";
  } else if (lowerSource.includes("focus")) {
    state = "focused";
  }

  const height = node.height ?? 0;
  let size: ComponentVariants["size"] = "md";
  if (height > 0 && height <= 32) {
    size = "sm";
  } else if (height >= 48) {
    size = "lg";
  }

  return { style, state, size };
}

function matchAppliedTokens(node: SerializedStyleNode, tokens: DesignTokens): ExtractedComponent["tokens"] {
  const fillToken = findColorToken(tokens.colors, "fill", node.backgroundColor);
  const strokeToken = findColorToken(tokens.colors, "stroke", node.borderColor);
  const textToken = findColorToken(tokens.colors, "text", node.textColor);
  const typographyToken = findTypographyToken(tokens.typography, node);
  const effectTokenIds = findEffectTokenIds(tokens.effects, node);

  return {
    fills: fillToken ? [fillToken.id] : [],
    strokes: strokeToken ? [strokeToken.id] : [],
    text: textToken ? [textToken.id] : [],
    typography: typographyToken ? [typographyToken.id] : [],
    effects: effectTokenIds
  };
}

function inferAutoLayout(node: SerializedStyleNode): AutoLayout | undefined {
  const display = node.display?.toLowerCase();
  if (!display || (display !== "flex" && display !== "inline-flex" && display !== "grid")) {
    return undefined;
  }

  const gap = normalizeLength(node.gap) ?? 0;
  const padding = {
    top: normalizeLength(node.paddingTop) ?? 0,
    right: normalizeLength(node.paddingRight) ?? 0,
    bottom: normalizeLength(node.paddingBottom) ?? 0,
    left: normalizeLength(node.paddingLeft) ?? 0
  };

  return {
    direction: display === "grid" ? "vertical" : inferDirection(node),
    gap,
    padding,
    primaryAlignment: mapAlignment(node.justifyContent),
    counterAlignment: mapAlignment(node.alignItems),
    wrap: node.flexWrap === "wrap"
  };
}

function inferDirection(node: SerializedStyleNode): AutoLayout["direction"] {
  const source = node.source.toLowerCase();
  if (/\b(column|stack|vertical)\b/.test(source)) {
    return "vertical";
  }
  return "horizontal";
}

function mapAlignment(value: string | undefined): AutoLayoutAlignment {
  switch ((value ?? "").toLowerCase()) {
    case "flex-start":
    case "start":
      return "start";
    case "flex-end":
    case "end":
      return "end";
    case "space-between":
      return "space-between";
    case "space-around":
      return "space-around";
    case "space-evenly":
      return "space-evenly";
    case "stretch":
      return "stretch";
    case "center":
    default:
      return "center";
  }
}

function findColorToken(
  tokens: ColorToken[],
  role: ColorTokenRole,
  value: string | undefined
): ColorToken | undefined {
  const normalized = normalizeColor(value);
  if (!normalized) {
    return undefined;
  }

  return tokens.find((token) => token.role === role && token.value === normalized);
}

function findTypographyToken(
  tokens: TypographyToken[],
  node: SerializedStyleNode
): TypographyToken | undefined {
  const candidate = parseTypographyCandidate(node);
  if (!candidate) {
    return undefined;
  }

  return tokens.find(
    (token) =>
      token.fontFamily === candidate.fontFamily &&
      token.fontSize === candidate.fontSize &&
      token.fontWeight === candidate.fontWeight &&
      token.lineHeight === candidate.lineHeight &&
      token.letterSpacing === candidate.letterSpacing &&
      token.textTransform === candidate.textTransform
  );
}

function findEffectTokenIds(tokens: EffectToken[], node: SerializedStyleNode): string[] {
  const effects = parseEffects(node);
  return effects
    .map((effect) =>
      tokens.find(
        (token) =>
          token.style === effect.style &&
          token.color === effect.color &&
          token.blurRadius === effect.blurRadius &&
          token.spreadRadius === effect.spreadRadius &&
          token.offset?.x === effect.offset?.x &&
          token.offset?.y === effect.offset?.y
      )?.id
    )
    .filter((tokenId): tokenId is string => Boolean(tokenId));
}

function collectColorCandidates(nodes: SerializedStyleNode[]): ColorCandidate[] {
  const candidates = new Map<string, ColorCandidate>();

  for (const node of nodes) {
    addColorCandidate(candidates, node.backgroundColor, "fill", node.source);
    addColorCandidate(candidates, node.borderColor, "stroke", node.source);
    addColorCandidate(candidates, node.textColor, "text", node.source);
  }

  return Array.from(candidates.values());
}

function collectTypographyCandidates(nodes: SerializedStyleNode[]): TypographyCandidate[] {
  const candidates = new Map<string, TypographyCandidate>();

  for (const node of nodes) {
    const typography = parseTypographyCandidate(node);
    if (!typography) {
      continue;
    }

    const key = [
      typography.fontFamily,
      typography.fontSize,
      typography.fontWeight,
      typography.lineHeight,
      typography.letterSpacing,
      typography.textTransform ?? "none"
    ].join("|");

    const existing = candidates.get(key);
    if (existing) {
      existing.count += 1;
      existing.sources.push(node.source);
      continue;
    }

    candidates.set(key, { ...typography, count: 1, sources: [node.source] });
  }

  return Array.from(candidates.values());
}

function collectEffectCandidates(nodes: SerializedStyleNode[]): EffectCandidate[] {
  const candidates = new Map<string, EffectCandidate>();

  for (const node of nodes) {
    for (const effect of parseEffects(node)) {
      const key = [
        effect.style,
        effect.color ?? "",
        effect.offset?.x ?? "",
        effect.offset?.y ?? "",
        effect.blurRadius,
        effect.spreadRadius ?? ""
      ].join("|");

      const existing = candidates.get(key);
      if (existing) {
        existing.count += 1;
        existing.sources.push(node.source);
        continue;
      }

      candidates.set(key, { ...effect, count: 1, sources: [node.source] });
    }
  }

  return Array.from(candidates.values());
}

function buildColorTokens(candidates: ColorCandidate[]): ColorToken[] {
  const byRole = groupBy(candidates, (candidate) => candidate.role);
  const usedNames = new Set<string>();

  return (["fill", "stroke", "text"] as ColorTokenRole[]).flatMap((role) => {
    const roleCandidates = sortByPriority(byRole.get(role) ?? []);
    const filtered = roleCandidates.filter((candidate) =>
      shouldKeepCandidate(candidate.count, roleCandidates.length, role)
    );

    return filtered.map((candidate, index) => {
      const baseName = inferColorName(candidate);
      const name = makeUniqueName(`${role}/${baseName}`, usedNames, index + 1);
      return {
        id: `color-${role}-${String(index + 1).padStart(3, "0")}`,
        name,
        category: "color",
        role,
        value: candidate.value,
        source: candidate.sources[0]
      };
    });
  });
}

function buildTypographyTokens(candidates: TypographyCandidate[]): TypographyToken[] {
  const filtered = sortByPriority(candidates).filter((candidate) =>
    shouldKeepCandidate(candidate.count, candidates.length, "typography")
  );
  const usedNames = new Set<string>();

  return filtered.map((candidate, index) => {
    const baseName = inferTypographyName(candidate);
    const name = makeUniqueName(`typography/${baseName}`, usedNames, index + 1);

    return {
      id: `typography-${String(index + 1).padStart(3, "0")}`,
      name,
      category: "typography",
      source: candidate.sources[0],
      fontFamily: candidate.fontFamily,
      fontSize: candidate.fontSize,
      fontWeight: candidate.fontWeight,
      lineHeight: candidate.lineHeight,
      letterSpacing: candidate.letterSpacing,
      textTransform: candidate.textTransform
    };
  });
}

function buildEffectTokens(candidates: EffectCandidate[]): EffectToken[] {
  const filtered = sortByPriority(candidates).filter((candidate) =>
    shouldKeepCandidate(candidate.count, candidates.length, "effect")
  );
  const usedNames = new Set<string>();

  return filtered.map((candidate, index) => {
    const baseName = inferEffectName(candidate);
    const name = makeUniqueName(`effect/${candidate.style}/${baseName}`, usedNames, index + 1);

    return {
      id: `effect-${String(index + 1).padStart(3, "0")}`,
      name,
      category: "effect",
      style: candidate.style,
      color: candidate.color,
      offset: candidate.offset,
      blurRadius: candidate.blurRadius,
      spreadRadius: candidate.spreadRadius,
      source: candidate.sources[0]
    };
  });
}

function addColorCandidate(
  candidates: Map<string, ColorCandidate>,
  value: string | undefined,
  role: ColorTokenRole,
  source: string
) {
  const normalizedValue = normalizeColor(value);
  if (!normalizedValue) {
    return;
  }

  const key = `${role}|${normalizedValue}`;
  const existing = candidates.get(key);
  if (existing) {
    existing.count += 1;
    existing.sources.push(source);
    return;
  }

  candidates.set(key, { role, value: normalizedValue, count: 1, sources: [source] });
}

function parseTypographyCandidate(
  node: SerializedStyleNode
): Omit<TypographyCandidate, "count" | "sources"> | null {
  if (!node.fontFamily) {
    return null;
  }

  const fontSize = normalizeLength(node.fontSize);
  if (fontSize === null) {
    return null;
  }

  const fontWeight = normalizeFontWeight(node.fontWeight);
  const lineHeight = normalizeLineHeight(node.lineHeight, fontSize);
  const letterSpacing = normalizeLetterSpacing(node.letterSpacing);

  if (fontWeight === null || lineHeight === null || letterSpacing === null) {
    return null;
  }

  return {
    fontFamily: normalizeFontFamily(node.fontFamily),
    fontSize,
    fontWeight,
    lineHeight,
    letterSpacing,
    textTransform: node.textTransform ?? "none"
  };
}

function parseEffects(node: SerializedStyleNode): Array<Omit<EffectCandidate, "count" | "sources">> {
  const effects: Array<Omit<EffectCandidate, "count" | "sources">> = [];

  if (node.boxShadow && node.boxShadow !== "none") {
    for (const shadow of splitCommaValues(node.boxShadow)) {
      const parsedShadow = parseShadow(shadow);
      if (parsedShadow) {
        effects.push(parsedShadow);
      }
    }
  }

  const layerBlur = extractBlurEffect(node.filter, "layer-blur");
  if (layerBlur) {
    effects.push(layerBlur);
  }

  const backdropBlur = extractBlurEffect(node.backdropFilter, "background-blur");
  if (backdropBlur) {
    effects.push(backdropBlur);
  }

  return effects;
}

function extractBlurEffect(
  input: string | undefined,
  style: EffectStyle
): Omit<EffectCandidate, "count" | "sources"> | null {
  if (!input || input === "none") {
    return null;
  }

  const match = input.match(/blur\(([-\d.]+)px\)/);
  if (!match) {
    return null;
  }

  const blurRadius = Number(match[1]);
  if (!Number.isFinite(blurRadius) || blurRadius <= 0) {
    return null;
  }

  return { style, blurRadius: roundValue(blurRadius) };
}

function parseShadow(input: string): Omit<EffectCandidate, "count" | "sources"> | null {
  const style: EffectStyle = input.includes("inset") ? "inner-shadow" : "drop-shadow";
  const colorMatch = input.match(
    /(rgba?\([^)]+\)|hsla?\([^)]+\)|#[0-9a-fA-F]{3,8}|transparent|currentColor)/i
  );
  const color = normalizeColor(colorMatch?.[0]);
  const remainder = input
    .replace(/\binset\b/gi, " ")
    .replace(
      /(rgba?\([^)]+\)|hsla?\([^)]+\)|#[0-9a-fA-F]{3,8}|transparent|currentColor)/gi,
      " "
    )
    .trim();
  const lengths = remainder
    .split(/\s+/)
    .map((part) => parseLengthToken(part))
    .filter((value): value is number => value !== null);

  if (lengths.length < 2) {
    return null;
  }

  const blurRadius = lengths[2] ?? 0;
  const spreadRadius = lengths[3] ?? 0;
  if (blurRadius === 0 && spreadRadius === 0 && lengths[0] === 0 && lengths[1] === 0) {
    return null;
  }

  return {
    style,
    color: color ?? undefined,
    offset: { x: lengths[0], y: lengths[1] },
    blurRadius,
    spreadRadius
  };
}

function inferColorName(candidate: ColorCandidate): string {
  const valueStem = inferColorValueName(candidate.value, candidate.role);
  if (candidate.role === "text" && ["white", "inverse"].includes(valueStem)) {
    return valueStem;
  }

  const semantic = inferSemanticStem(candidate.sources, candidate.role);
  return semantic ?? valueStem;
}

function inferTypographyName(candidate: TypographyCandidate): string {
  const semantic = inferSemanticStem(candidate.sources, "typography");
  if (semantic) {
    return semantic;
  }

  if (candidate.fontSize >= 40) {
    return "display";
  }

  if (candidate.fontSize >= 20) {
    return "heading";
  }

  if (candidate.fontSize <= 12) {
    return "caption";
  }

  return "body";
}

function inferEffectName(candidate: EffectCandidate): string {
  const semantic = inferSemanticStem(candidate.sources, "effect");
  if (semantic) {
    return semantic;
  }

  return candidate.blurRadius >= 24 ? "soft" : "base";
}

function inferSemanticStem(
  sources: string[],
  kind: ColorTokenRole | "typography" | "effect" | "component"
): string | null {
  const tokens = sources.flatMap((source) => tokenizeSource(source));
  if (tokens.length === 0) {
    return null;
  }

  const ranked = Array.from(
    tokens.reduce((map, token) => map.set(token, (map.get(token) ?? 0) + 1), new Map<string, number>())
  ).sort((left, right) => {
    const [leftToken, leftCount] = left;
    const [rightToken, rightCount] = right;
    const leftPreferred = preferredWeight(leftToken, kind);
    const rightPreferred = preferredWeight(rightToken, kind);

    if (rightPreferred !== leftPreferred) {
      return rightPreferred - leftPreferred;
    }

    if (rightCount !== leftCount) {
      return rightCount - leftCount;
    }

    return leftToken.localeCompare(rightToken);
  });

  const selected = ranked.slice(0, kind === "component" ? 1 : 2).map(([token]) => token);
  return selected.length > 0 ? selected.join("-") : null;
}

function tokenizeSource(source: string): string[] {
  return source
    .split(/[^a-zA-Z0-9]+/)
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length > 1 && !/^\d+$/.test(part))
    .filter((part) => !GENERIC_SOURCE_TERMS.has(part));
}

function preferredWeight(
  token: string,
  kind: ColorTokenRole | "typography" | "effect" | "component"
): number {
  const base = PREFERRED_SOURCE_TERMS.includes(token) ? 2 : 0;

  if (kind === "text" || kind === "typography") {
    if (["heading", "body", "caption", "label", "display", "eyebrow"].includes(token)) {
      return base + 3;
    }
  }

  if (kind === "fill" || kind === "stroke") {
    if (["brand", "accent", "muted", "inverse", "background", "foreground", "border"].includes(token)) {
      return base + 3;
    }
  }

  if (kind === "effect" || kind === "component") {
    if (["card", "modal", "overlay", "popover", "badge", "input", "button", "nav"].includes(token)) {
      return base + 3;
    }
  }

  return base;
}

function colorValueStem(value: string): string {
  const lowered = value.toLowerCase();
  if (lowered === "#ffffff" || lowered === "rgb(255, 255, 255)") {
    return "white";
  }

  if (lowered === "#000000" || lowered === "rgb(0, 0, 0)") {
    return "black";
  }

  return lowered.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function inferColorValueName(value: string, role: ColorTokenRole): string {
  const parsed = parseColorChannels(value);
  if (!parsed) {
    return colorValueStem(value);
  }

  const luminance = (0.2126 * parsed.r + 0.7152 * parsed.g + 0.0722 * parsed.b) / 255;
  const spread = Math.max(parsed.r, parsed.g, parsed.b) - Math.min(parsed.r, parsed.g, parsed.b);

  if (role === "text") {
    if (luminance >= 0.92) {
      return "inverse";
    }

    if (luminance <= 0.2) {
      return "foreground";
    }

    if (luminance <= 0.45 || spread < 40) {
      return "muted";
    }
  }

  return colorValueStem(value);
}

function shouldKeepCandidate(
  count: number,
  uniqueCount: number,
  kind: ColorTokenRole | "typography" | "effect"
): boolean {
  if (count > 1) {
    return true;
  }

  if (kind === "stroke" || kind === "effect") {
    return uniqueCount <= 2;
  }

  return uniqueCount < 3;
}

function sortByPriority<T extends { count: number; sources: string[] }>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }

    const leftScore = left.sources.join("|").length;
    const rightScore = right.sources.join("|").length;
    return rightScore - leftScore;
  });
}

function makeUniqueName(baseName: string, usedNames: Set<string>, index: number): string {
  if (!usedNames.has(baseName)) {
    usedNames.add(baseName);
    return baseName;
  }

  const fallback = `${baseName}-${String(index).padStart(2, "0")}`;
  usedNames.add(fallback);
  return fallback;
}

function groupBy<T, K>(items: T[], getKey: (item: T) => K): Map<K, T[]> {
  const grouped = new Map<K, T[]>();

  for (const item of items) {
    const key = getKey(item);
    const bucket = grouped.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      grouped.set(key, [item]);
    }
  }

  return grouped;
}

function splitCommaValues(input: string): string[] {
  return input
    .split(/,(?![^()]*\))/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeColor(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (
    !normalized ||
    normalized === "transparent" ||
    normalized === "initial" ||
    normalized === "inherit" ||
    normalized === "unset" ||
    normalized === "currentcolor" ||
    normalized === "rgba(0, 0, 0, 0)"
  ) {
    return null;
  }

  return normalized;
}

function normalizeFontFamily(value: string): string {
  const firstFamily = value.split(",")[0]?.trim() ?? value.trim();
  return firstFamily.replace(/^['"]|['"]$/g, "");
}

function normalizeLength(value: number | string | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? roundValue(value) : null;
  }

  if (!value || value === "normal") {
    return null;
  }

  return parseLengthToken(value);
}

function normalizeLineHeight(value: number | string | undefined, fontSize: number): number | null {
  if (value === "normal" || value === undefined) {
    return roundValue(fontSize * 1.2);
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? roundValue(value) : null;
  }

  const trimmed = value.trim();
  if (trimmed.endsWith("px")) {
    return parseLengthToken(trimmed);
  }

  const unitless = Number(trimmed);
  if (Number.isFinite(unitless)) {
    return roundValue(fontSize * unitless);
  }

  return null;
}

function normalizeLetterSpacing(value: number | string | undefined): number | null {
  if (value === undefined || value === "normal") {
    return 0;
  }

  return normalizeLength(value);
}

function normalizeFontWeight(value: number | string | undefined): FontWeight | null {
  if (typeof value === "number") {
    return clampFontWeight(value);
  }

  if (!value || value === "normal") {
    return 400;
  }

  if (value === "bold") {
    return 700;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? clampFontWeight(numeric) : null;
}

function clampFontWeight(value: number): FontWeight {
  const rounded = Math.round(value / 100) * 100;
  const clamped = Math.min(900, Math.max(100, rounded));
  return clamped as FontWeight;
}

function parseLengthToken(value: string): number | null {
  const match = value.match(/(-?\d*\.?\d+)px/);
  if (!match) {
    return null;
  }

  const numeric = Number(match[1]);
  return Number.isFinite(numeric) ? roundValue(numeric) : null;
}

function roundValue(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseColorChannels(value: string): { r: number; g: number; b: number } | null {
  const rgbMatch = value.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+\s*)?\)$/
  );
  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3])
    };
  }

  const hex = value.replace("#", "");
  if (hex.length === 3) {
    return {
      r: Number.parseInt(hex[0] + hex[0], 16),
      g: Number.parseInt(hex[1] + hex[1], 16),
      b: Number.parseInt(hex[2] + hex[2], 16)
    };
  }

  if (hex.length === 6 || hex.length === 8) {
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16)
    };
  }

  return null;
}
