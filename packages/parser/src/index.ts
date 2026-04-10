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
  LayoutMetrics,
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
  gridTemplateColumns?: string;
  maxWidth?: number;
  borderRadius?: number | string;
  role?: string;
  ariaExpanded?: boolean;
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
  textAlign?: TypographyToken["textAlign"];
  landmark?: "nav" | "header" | "main" | "footer" | "aside";
  pageY?: number;
  position?: string;
}

interface ColorCandidate {
  role: ColorTokenRole;
  value: string;
  count: number;
  sources: string[];
  semanticNames: string[];
}

export interface ExtractionInput {
  nodes?: SerializedStyleNode[];
  cssVariables?: Record<string, string>;
}

interface TypographyCandidate {
  fontFamily: string;
  fontSize: number;
  fontWeight: FontWeight;
  lineHeight: number;
  letterSpacing: number;
  textTransform: TypographyToken["textTransform"];
  textAlignCounts: Record<string, number>;
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
  input: SerializedStyleNode[] | ExtractionInput = []
): { tokens: DesignTokens; components: ExtractedComponent[]; layout: LayoutMetrics } {
  const { nodes, cssVariables } = normalizeExtractionInput(input);
  const tokens = extractTokens(nodes, cssVariables);
  const components = extractComponents(nodes, tokens);
  const layout = extractLayoutMetrics(nodes);
  return { tokens, components, layout };
}

export function extractLayoutMetrics(nodes: SerializedStyleNode[]): LayoutMetrics {
  // Spacing scale: collect all gap and padding values across the page,
  // snap to nearest 4px, keep values that appear at least twice.
  const rawSpacing: number[] = [];
  for (const node of nodes) {
    for (const raw of [node.gap, node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft]) {
      const n = normalizeLength(raw);
      if (n !== null && n >= 2 && n <= 128) rawSpacing.push(Math.round(n / 4) * 4);
    }
  }
  const spacingCounts = new Map<number, number>();
  for (const v of rawSpacing) spacingCounts.set(v, (spacingCounts.get(v) ?? 0) + 1);
  const spacingScale = [...spacingCounts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([v]) => v)
    .sort((a, b) => a - b);

  // Content width: widest element that has an explicit max-width (not the viewport itself).
  let contentWidth: number | undefined;
  for (const node of nodes) {
    if (node.maxWidth && node.maxWidth >= 320 && node.maxWidth <= 1920) {
      if (!contentWidth || node.maxWidth > contentWidth) contentWidth = node.maxWidth;
    }
  }

  // Page margin: horizontal padding on the body or main wrapper elements.
  let pageMargin: number | undefined;
  for (const node of nodes) {
    const src = node.source.toLowerCase();
    if (
      src.startsWith("body") ||
      src.startsWith("main") ||
      /\b(wrapper|container|layout)\b/.test(src)
    ) {
      const left = normalizeLength(node.paddingLeft);
      const right = normalizeLength(node.paddingRight);
      if (left && right && left > 0 && Math.abs(left - right) <= 4) {
        pageMargin = left;
        break;
      }
    }
  }

  // Grid: find the CSS grid with the most columns.
  let grid: LayoutMetrics["grid"] | undefined;
  for (const node of nodes) {
    if (node.display === "grid" && node.gridTemplateColumns) {
      const columns = parseGridColumns(node.gridTemplateColumns);
      const gap = normalizeLength(node.gap) ?? 0;
      if (columns >= 2 && (!grid || columns > grid.columns)) {
        grid = { columns, gap };
      }
    }
  }

  return { contentWidth, pageMargin, spacingScale, grid };
}

export function extractTokens(
  nodes: SerializedStyleNode[] = [],
  cssVariables: Record<string, string> = {}
): DesignTokens {
  const filteredNodes = nodes.filter((node) => !isRootLevelNode(node));
  const colorCandidates = collectColorCandidates(filteredNodes, cssVariables);
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
    const name = inferComponentName(candidate, usedNames, index + 1);

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
      cornerRadius: normalizeLength(candidate.node.borderRadius) ?? undefined,
      padding: inferPadding(candidate.node),
      width: normalizeLength(candidate.node.width) ?? undefined,
      height: normalizeLength(candidate.node.height) ?? undefined,
      textContent: (() => { const t = candidate.node.textContent?.trim() ?? ""; return t.length > 0 && t.length <= 30 ? t : undefined; })(),
      landmark: candidate.node.landmark,
      pageY: candidate.node.pageY,
      position: candidate.node.position !== "static" ? candidate.node.position : undefined
    };
  });
}

function inferComponentName(
  candidate: ComponentCandidate,
  usedNames: Set<string>,
  index: number
): string {
  const typeStem = candidate.type.toLowerCase();
  const semanticStem = inferSemanticStem([candidate.node.source], "component");

  if (candidate.type === "Navigation") {
    return makeUniqueName(`navigation/top-nav`, usedNames, index);
  }

  if (candidate.type === "NavigationItem") {
    return makeUniqueName(`navigation/top-nav-item`, usedNames, index);
  }

  return makeUniqueName(
    `${typeStem}/${semanticStem ?? typeStem}`,
    usedNames,
    index
  );
}

function collectComponentCandidates(nodes: SerializedStyleNode[]): ComponentCandidate[] {
  const grouped = new Map<string, ComponentCandidate>();

  for (const node of nodes) {
    if (isIgnoredComponentCandidate(node)) {
      continue;
    }

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
      makeSpacingSignature(node),
      normalizeLength(node.borderRadius) ?? "",
      makeStructureSignature(node),
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

function isIgnoredComponentCandidate(node: SerializedStyleNode): boolean {
  const width = normalizeLength(node.width) ?? 0;
  const height = normalizeLength(node.height) ?? 0;
  const pageY = typeof node.pageY === "number" ? node.pageY : 0;
  const source = buildComponentHaystack(node);

  if (pageY < -100 || node.position === "fixed" && pageY < 0) {
    return true;
  }

  if (
    node.tagName === "button" &&
    height > 0 &&
    height < 16 &&
    width > 0 &&
    width < 32 &&
    !normalizeColor(node.backgroundColor) &&
    !normalizeColor(node.textColor) &&
    !normalizeColor(node.borderColor)
  ) {
    return true;
  }

  return /\b(cgw|captcha|recaptcha|grecaptcha|intercom|launcher|widget)\b/.test(source);
}

function shouldKeepComponentCandidate(candidate: ComponentCandidate): boolean {
  switch (candidate.type) {
    case "Button":
      return hasButtonConfidence(candidate.node);
    case "Input":
      return hasInputConfidence(candidate.node);
    case "Navigation":
      return hasNavigationConfidence(candidate.node);
    case "NavigationItem":
      return hasNavigationItemConfidence(candidate.node);
    case "Modal":
      return hasModalConfidence(candidate.node);
    case "Accordion":
      return hasAccordionConfidence(candidate.node);
    case "Card":
      return hasCardConfidence(candidate.node, candidate.count);
    case "FeatureItem":
      return hasFeatureItemConfidence(candidate.node, candidate.count);
    case "ContentBlock":
      return hasContentBlockConfidence(candidate.node, candidate.count);
    case "ListItem":
      return hasListItemConfidence(candidate.node, candidate.count);
    case "Badge":
      return hasBadgeConfidence(candidate.node, candidate.count);
    default:
      return false;
  }
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
    node.tagName === "details" ||
    /\b(accordion|disclosure|faq|expandable|collapsible)\b/.test(haystack) ||
    isStrongAriaAccordionCandidate(node, haystack)
  ) {
    return "Accordion";
  }

  // <a> tags are only buttons when they look like one: small, few children, non-empty label.
  // A bare "has background" check catches nav links, hero banners, card wrappers — all noise.
  // Links inside a <nav> landmark are navigation items, not buttons.
  const isButtonLikeAnchor =
    node.tagName === "a" &&
    node.landmark !== "nav" &&
    Boolean(node.backgroundColor) &&
    node.position !== "absolute" &&
    (node.height ?? 999) <= 80 &&
    (node.childCount ?? 999) <= 3 &&
    Boolean((node.textContent ?? "").trim());

  // Large CTAs (e.g. "Secure your spot") exceed the 80px height guard but are still buttons.
  // Observed on sculpt.clay.com: h=96px, fill background, short label, ≤5 children.
  const isLargeCta =
    node.tagName === "a" &&
    node.landmark !== "nav" &&
    Boolean(node.backgroundColor) &&
    node.position !== "absolute" &&
    (node.height ?? 0) > 80 &&
    (node.height ?? 0) <= 120 &&
    (node.childCount ?? 999) <= 5 &&
    (node.textContent ?? "").trim().length > 0 &&
    (node.textContent ?? "").trim().length <= 30;

  // Buttons inside a <nav> landmark are nav items unless they have a distinctive
  // fill background (CTA signal like "Get started" / "Sign up").
  const isNavButton =
    node.tagName === "button" &&
    node.landmark === "nav" &&
    (!node.backgroundColor ||
      node.backgroundColor === "rgba(0, 0, 0, 0)" ||
      node.backgroundColor === "transparent");

  if (
    (node.tagName === "button" && !isNavButton) ||
    /\b(btn|button|cta)\b/.test(haystack) ||
    isButtonLikeAnchor ||
    isLargeCta
  ) {
    // Reject if the text looks like informational content, not an action label.
    // Real button labels are short, have no commas, and don't contain digits like IDs.
    const text = (node.textContent ?? "").trim();
    if (text.length > 30 || text.includes(",") || /\d{4,}/.test(text) || text.includes("@")) {
      return "Unknown";
    }
    if (node.href?.startsWith("mailto:") || node.href?.startsWith("tel:")) {
      return "Unknown";
    }
    // Anchor elements matched only via class name (not structural signals) must have a
    // real visual treatment. Webflow/frameworks add `.button` classes to wrapper/clip
    // elements that are transparent with near-zero padding — reject those.
    // Observed on sculpt.clay.com: a.w-inline-block.button h=26px pad=2px, no fill/border.
    if (node.tagName === "a" && !isButtonLikeAnchor && !isLargeCta) {
      const hasPadding =
        (normalizeLength(node.paddingLeft) ?? 0) > 4 ||
        (normalizeLength(node.paddingRight) ?? 0) > 4 ||
        (normalizeLength(node.paddingTop) ?? 0) > 4 ||
        (normalizeLength(node.paddingBottom) ?? 0) > 4;
      if (!node.backgroundColor && !node.borderColor && !node.textColor && !hasPadding) {
        return "Unknown";
      }
    }
    return "Button";
  }

  if (["input", "textarea", "select"].includes(node.tagName ?? "")) {
    return "Input";
  }

  // Links and buttons inside a <nav> landmark are nav items, not the nav container.
  if (
    node.landmark === "nav" &&
    (node.tagName === "a" || node.tagName === "button" || node.role === "menuitem" || node.role === "tab") &&
    Boolean((node.textContent ?? "").trim()) &&
    (node.height ?? 999) <= 80
  ) {
    return "NavigationItem";
  }

  if (node.tagName === "nav" || /\b(nav|navigation|menu|tabs?)\b/.test(haystack)) {
    return "Navigation";
  }

  if (node.role === "dialog" || /\b(modal|dialog|drawer|sheet)\b/.test(haystack)) {
    return "Modal";
  }

  // Layout-utility class names (flex, row, col, grid, etc.) are not semantic card signals.
  const isLayoutPrimitive = /^\w+\.(flex[-\w]*|row|col(umn)?|grid[-\w]*|container|wrapper|layout)(\.[\w-]+)*$/.test(node.source.toLowerCase());
  const hasStructuredContent =
    Boolean((node.textContent ?? "").trim()) &&
    (node.childCount ?? 0) >= 2 &&
    (node.height ?? 0) >= 48 &&
    (node.width ?? 0) >= 120;
  const hasContainment = Boolean(node.boxShadow || node.borderColor || node.backgroundColor);
  const semanticTokens = tokenizeSource(haystack);
  const sectionLikeWrapper = isSectionLikeWrapper(node, semanticTokens);

  if (
    !isLayoutPrimitive &&
    hasStructuredContent &&
    looksLikeListItem(node, semanticTokens)
  ) {
    return "ListItem";
  }

  if (
    !isLayoutPrimitive &&
    hasStructuredContent &&
    looksLikeFeatureItem(node, semanticTokens)
  ) {
    return "FeatureItem";
  }

  if (
    !isLayoutPrimitive &&
    !sectionLikeWrapper &&
    looksLikeCard(node, semanticTokens)
  ) {
    return "Card";
  }

  if (!isLayoutPrimitive && hasStructuredContent && !sectionLikeWrapper) {
    return "ContentBlock";
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

function hasButtonConfidence(node: SerializedStyleNode): boolean {
  const tagName = (node.tagName ?? "").toLowerCase();
  const source = buildComponentHaystack(node);
  return (
    tagName === "button" ||
    /\b(btn|button|cta)\b/.test(source) ||
    (tagName === "a" &&
      Boolean(node.textContent?.trim()) &&
      ((node.height ?? 0) > 0 && (node.height ?? 0) <= 120) &&
      Boolean(node.backgroundColor || node.borderColor))
  );
}

function hasInputConfidence(node: SerializedStyleNode): boolean {
  const tagName = (node.tagName ?? "").toLowerCase();
  return ["input", "textarea", "select"].includes(tagName);
}

function hasNavigationConfidence(node: SerializedStyleNode): boolean {
  const tagName = (node.tagName ?? "").toLowerCase();
  const source = buildComponentHaystack(node);
  return (
    (tagName === "nav" || /\b(nav|navigation|menu|tabs?)\b/.test(source)) &&
    (node.height ?? 0) > 0
  );
}

function hasNavigationItemConfidence(node: SerializedStyleNode): boolean {
  const tagName = (node.tagName ?? "").toLowerCase();
  return (
    node.landmark === "nav" &&
    (tagName === "a" || tagName === "button" || node.role === "menuitem" || node.role === "tab") &&
    Boolean((node.textContent ?? "").trim()) &&
    (node.height ?? 999) <= 80
  );
}

function hasModalConfidence(node: SerializedStyleNode): boolean {
  const source = buildComponentHaystack(node);
  return node.role === "dialog" || /\b(modal|dialog|drawer|sheet)\b/.test(source);
}

function hasAccordionConfidence(node: SerializedStyleNode): boolean {
  const tagName = (node.tagName ?? "").toLowerCase();
  const source = buildComponentHaystack(node);
  if (
    tagName === "details" ||
    /\b(accordion|disclosure|faq|expandable|collapsible)\b/.test(source)
  ) {
    return true;
  }

  return isStrongAriaAccordionCandidate(node, source);
}

function isStrongAriaAccordionCandidate(node: SerializedStyleNode, haystack: string): boolean {
  if (node.ariaExpanded === undefined) {
    return false;
  }

  if (/\b(nav|menu|dropdown|popover|tooltip|dialog|drawer|sheet|select|tabs?)\b/.test(haystack)) {
    return false;
  }

  const text = (node.textContent ?? "").trim();
  const width = node.width ?? 0;
  const height = node.height ?? 0;

  return (
    text.length >= 12 &&
    text.length <= 120 &&
    width >= 240 &&
    height >= 40 &&
    height <= 120 &&
    (node.childCount ?? 0) >= 2 &&
    Boolean(node.borderColor || node.boxShadow || hasPadding(node))
  );
}

function hasCardConfidence(node: SerializedStyleNode, count: number): boolean {
  const source = buildComponentHaystack(node);
  const semanticTokens = tokenizeSource(source);
  if (count > 1 && semanticTokens.some((token) => ["card", "panel", "tile"].includes(token))) {
    return true;
  }

  // Layout-utility primitives (flex-row, col, grid, container…) are not cards.
  const isLayoutPrimitive = /^\w+\.(flex[-\w]*|row|col(umn)?|grid[-\w]*|container|wrapper|layout)(\.[\w-]+)*$/.test(node.source.toLowerCase());
  if (isLayoutPrimitive) {
    return false;
  }

  const hasContainment = Boolean(node.boxShadow || node.borderColor || node.backgroundColor);
  const hasStructure =
    (node.childCount ?? 0) >= 2 &&
    (node.height ?? 0) >= 80 &&
    (node.width ?? 0) >= 160 &&
    ((node.width ?? 0) < 900 || countLikeStrongSingleCard(node));
  const hasBoxTreatment =
    hasPadding(node) ||
    (normalizeLength(node.borderRadius) ?? 0) >= 8 ||
    Boolean(node.boxShadow);

  return (count > 1 || countLikeStrongSingleCard(node)) && hasContainment && hasStructure && hasBoxTreatment;
}

function hasFeatureItemConfidence(node: SerializedStyleNode, count: number): boolean {
  const source = buildComponentHaystack(node);
  const hasStructuredText =
    Boolean((node.textContent ?? "").trim()) &&
    (node.childCount ?? 0) >= 2 &&
    (node.width ?? 0) >= 120 &&
    (node.height ?? 0) >= 48;
  const semanticTokens = tokenizeSource(source);

  return (
    (count > 1 || looksLikeFeatureItem(node, semanticTokens)) &&
    hasStructuredText &&
    !looksLikeListItem(node, semanticTokens) &&
    !looksLikeCard(node, semanticTokens)
  );
}

function hasContentBlockConfidence(node: SerializedStyleNode, count: number): boolean {
  const semanticTokens = tokenizeSource(buildComponentHaystack(node));
  return (
    count > 1 &&
    Boolean((node.textContent ?? "").trim()) &&
    (node.childCount ?? 0) >= 2 &&
    (node.width ?? 0) >= 120 &&
    (node.width ?? 0) < 900 &&  // Full-viewport-width elements are layout containers, not components
    (node.height ?? 0) >= 48 &&
    !looksLikeFeatureItem(node, semanticTokens) &&
    !looksLikeListItem(node, semanticTokens) &&
    !looksLikeCard(node, semanticTokens) &&
    !isSectionLikeWrapper(node, semanticTokens)
  );
}

function hasListItemConfidence(node: SerializedStyleNode, count: number): boolean {
  const semanticTokens = tokenizeSource(buildComponentHaystack(node));
  return (
    count > 1 &&
    Boolean((node.textContent ?? "").trim()) &&
    (node.childCount ?? 0) >= 2 &&
    looksLikeListItem(node, semanticTokens)
  );
}

function hasBadgeConfidence(node: SerializedStyleNode, count: number): boolean {
  const source = buildComponentHaystack(node);
  if (/\b(badge|chip|pill|tag)\b/.test(source)) {
    return true;
  }

  return (
    count > 1 &&
    (node.height ?? 0) <= 36 &&
    (normalizeLength(node.borderRadius) ?? 0) >= 12 &&
    Boolean(node.textContent?.trim())
  );
}

function hasPadding(node: SerializedStyleNode): boolean {
  return [node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft].some(
    (value) => (normalizeLength(value) ?? 0) > 0
  );
}

function countLikeStrongSingleCard(node: SerializedStyleNode): boolean {
  return (
    visualContainmentScore(node) >= 3 &&
    hasPadding(node) &&
    (normalizeLength(node.borderRadius) ?? 0) >= 8 &&
    (node.childCount ?? 0) >= 2 &&
    (node.height ?? 0) >= 80 &&
    (node.width ?? 0) >= 160
  );
}

function visualContainmentScore(node: SerializedStyleNode): number {
  let score = 0;
  if (Boolean(normalizeColor(node.backgroundColor))) score += 1;
  if (Boolean(normalizeColor(node.borderColor))) score += 1;
  if (Boolean(node.boxShadow)) score += 1;
  if ((normalizeLength(node.borderRadius) ?? 0) >= 8) score += 1;
  if (hasPadding(node)) score += 1;
  return score;
}

function looksLikeCard(node: SerializedStyleNode, semanticTokens: string[]): boolean {
  const semanticCard = semanticTokens.some((token) => ["card", "panel", "tile"].includes(token));
  const hasStructure =
    (node.childCount ?? 0) >= 2 &&
    (node.height ?? 0) >= 80 &&
    (node.width ?? 0) >= 160 &&
    ((node.width ?? 0) < 900 || countLikeStrongSingleCard(node));

  if (semanticCard && (visualContainmentScore(node) >= 2 || countLikeStrongSingleCard(node))) {
    return true;
  }

  return visualContainmentScore(node) >= 3 && hasStructure;
}

function looksLikeFeatureItem(node: SerializedStyleNode, semanticTokens: string[]): boolean {
  return (
    semanticTokens.some((token) =>
      ["feature", "features", "benefit", "benefits", "value", "values", "why", "capability", "capabilities"].includes(token)
    ) ||
    (
      semanticTokens.includes("item") &&
      !looksLikeListItem(node, semanticTokens) &&
      visualContainmentScore(node) <= 1
    )
  );
}

function looksLikeListItem(node: SerializedStyleNode, semanticTokens: string[]): boolean {
  const mediaSignals = ["avatar", "speaker", "person", "profile", "member", "team", "logo", "author", "customer", "testimonial", "image", "img", "photo"];
  const collectionSignals = ["list", "collection", "grid", "stack", "item", "speaker", "person", "profile", "member"];
  return (
    semanticTokens.some((token) => mediaSignals.includes(token)) ||
    (
      semanticTokens.some((token) => collectionSignals.includes(token)) &&
      (node.width ?? 0) < 640
    )
  );
}

function isSectionLikeWrapper(node: SerializedStyleNode, semanticTokens: string[]): boolean {
  const width = node.width ?? 0;
  const height = node.height ?? 0;
  const childCount = node.childCount ?? 0;
  const lowSemanticSpecificity =
    !semanticTokens.some((token) =>
      [
        "card",
        "panel",
        "tile",
        "feature",
        "features",
        "benefit",
        "benefits",
        "speaker",
        "profile",
        "person",
        "member",
        "faq",
        "accordion",
        "nav",
        "navigation"
      ].includes(token)
    );

  return (
    width >= 960 &&
    height >= 160 &&
    childCount >= 4 &&
    visualContainmentScore(node) <= 2 &&
    lowSemanticSpecificity
  );
}

function buildComponentHaystack(node: SerializedStyleNode): string {
  return [
    node.tagName,
    node.role,
    node.inputType,
    node.href ? "link" : "",
    node.source,
    ...(node.classNames ?? [])
  ]
    .join(" ")
    .toLowerCase();
}

function inferComponentVariants(node: SerializedStyleNode): ComponentVariants {
  const hasFill = Boolean(normalizeColor(node.backgroundColor));
  const hasStroke = Boolean(normalizeColor(node.borderColor));
  const tagName = (node.tagName ?? "").toLowerCase();
  const source = buildComponentHaystack(node);
  const hasButtonSignal = /\b(btn|button|cta)\b/.test(source);
  const hasColorModifier = /\bcc-[a-z0-9-]*(lime|dragonfruit|ube|tangerine|blueberry|pomegranate|lemon|slushie)[a-z0-9-]*\b/.test(source);

  let style: ComponentVariants["style"] = "fill";
  if (hasStroke && !hasFill) {
    style = "outline";
  } else if (!hasFill && !hasStroke) {
    // If text color is light/white on a true button element, the element almost
    // certainly sits on a colored fill that the serializer didn't capture (e.g.
    // applied via pseudo-element or CSS class on a child). Treat as fill rather
    // than ghost.  Exclude <a> links — white text on a dark nav bar is normal
    // for ghost nav links, not evidence of a missing fill.
    const isRealButton = tagName === "button" || node.role === "button";
    const textLuminance = getLuminanceFromColor(node.textColor);
    const isColorCtaAnchor = tagName === "a" && hasButtonSignal && hasColorModifier;
    style = isColorCtaAnchor || (isRealButton && textLuminance !== null && textLuminance > 0.7) ? "fill" : "ghost";
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
  if (tagName === "a" && hasButtonSignal && (normalizeLength(node.fontSize) ?? 0) >= 20) {
    size = "lg";
  }

  return { style, state, size };
}

function matchAppliedTokens(node: SerializedStyleNode, tokens: DesignTokens): ExtractedComponent["tokens"] {
  const fillToken = findColorToken(tokens.colors, "fill", node.backgroundColor);
  const strokeToken = findColorToken(tokens.colors, "stroke", node.borderColor);
  const textToken = findColorToken(tokens.colors, "text", node.textColor);
  const effectiveTextToken =
    fillToken && textToken && normalizeColor(fillToken.value) === normalizeColor(textToken.value)
      ? null
      : textToken;
  const typographyToken = findTypographyToken(tokens.typography, node);
  const effectTokenIds = findEffectTokenIds(tokens.effects, node);

  return {
    fills: fillToken ? [fillToken.id] : [],
    strokes: strokeToken ? [strokeToken.id] : [],
    text: effectiveTextToken ? [effectiveTextToken.id] : [],
    typography: typographyToken ? [typographyToken.id] : [],
    effects: effectTokenIds
  };
}

function inferPadding(node: SerializedStyleNode): AutoLayout["padding"] | undefined {
  const top = normalizeLength(node.paddingTop) ?? 0;
  const right = normalizeLength(node.paddingRight) ?? 0;
  const bottom = normalizeLength(node.paddingBottom) ?? 0;
  const left = normalizeLength(node.paddingLeft) ?? 0;
  if (top === 0 && right === 0 && bottom === 0 && left === 0) return undefined;
  return { top, right, bottom, left };
}


function makeSpacingSignature(node: SerializedStyleNode): string {
  const padding = inferPadding(node);
  if (!padding) {
    return "0|0|0|0";
  }

  return [padding.top, padding.right, padding.bottom, padding.left].join("|");
}

function makeStructureSignature(node: SerializedStyleNode): string {
  return [
    node.display?.toLowerCase() ?? "",
    normalizeLength(node.gap) ?? 0,
    node.justifyContent?.toLowerCase() ?? "",
    node.alignItems?.toLowerCase() ?? "",
    node.flexWrap?.toLowerCase() ?? "",
    node.gridTemplateColumns ? parseGridColumns(node.gridTemplateColumns) : 0,
    normalizeShadowSignature(node.boxShadow)
  ].join("|");
}

function normalizeShadowSignature(value: string | undefined): string {
  if (!value || value === "none") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function parseGridColumns(gridTemplateColumns: string): number {
  const trimmed = gridTemplateColumns.trim();
  if (!trimmed || trimmed === "none") return 1;
  // Count top-level space-separated track definitions (skip spaces inside parens)
  let depth = 0;
  let count = 1;
  for (const ch of trimmed) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === " " && depth === 0) count++;
  }
  return count;
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

  // Derive real column count from the DOM, not from gap heuristics.
  // Grid: count tracks from grid-template-columns.
  // Flex row: use direct child count as the column count.
  let columns: number | undefined;
  if (display === "grid" && node.gridTemplateColumns) {
    columns = parseGridColumns(node.gridTemplateColumns);
  } else if ((display === "flex" || display === "inline-flex") && inferDirection(node) === "horizontal") {
    const childCount = node.childCount ?? 0;
    if (childCount >= 2) columns = childCount;
  }

  return {
    direction: display === "grid" ? "vertical" : inferDirection(node),
    gap,
    padding,
    primaryAlignment: mapAlignment(node.justifyContent),
    counterAlignment: mapAlignment(node.alignItems),
    wrap: node.flexWrap === "wrap",
    columns
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

function normalizeExtractionInput(input: SerializedStyleNode[] | ExtractionInput): Required<ExtractionInput> {
  if (Array.isArray(input)) {
    return { nodes: input, cssVariables: {} };
  }

  return {
    nodes: input.nodes ?? [],
    cssVariables: input.cssVariables ?? {}
  };
}

function collectColorCandidates(
  nodes: SerializedStyleNode[],
  cssVariables: Record<string, string> = {}
): ColorCandidate[] {
  const candidates = new Map<string, ColorCandidate>();
  const semanticNamesByValue = buildSemanticColorNameIndex(cssVariables);

  for (const node of nodes) {
    addColorCandidate(candidates, node.backgroundColor, "fill", node.source, semanticNamesByValue);
    addColorCandidate(candidates, node.borderColor, "stroke", node.source, semanticNamesByValue);
    addColorCandidate(candidates, node.textColor, "text", node.source, semanticNamesByValue);
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

    const align = node.textAlign ?? "left";
    const existing = candidates.get(key);
    if (existing) {
      existing.count += 1;
      existing.sources.push(node.source);
      existing.textAlignCounts[align] = (existing.textAlignCounts[align] ?? 0) + 1;
      continue;
    }

    candidates.set(key, { ...typography, textAlignCounts: { [align]: 1 }, count: 1, sources: [node.source] });
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
        source: candidate.sources[0],
        usageCount: candidate.count,
        description:
          candidate.semanticNames.length > 0
            ? "from CSS variable"
            : "inferred from DOM"
      };
    });
  });
}

function dominantTextAlign(counts: Record<string, number>): TypographyToken["textAlign"] {
  let best: string = "left";
  let bestCount = 0;
  for (const [align, count] of Object.entries(counts)) {
    if (count > bestCount) {
      best = align;
      bestCount = count;
    }
  }
  return best as TypographyToken["textAlign"];
}

function buildTypographyTokens(candidates: TypographyCandidate[]): TypographyToken[] {
  // Always keep the largest-fontSize candidate even if it only appears once —
  // hero headings are naturally unique on a page and would otherwise be filtered out.
  const largestFontSize = candidates.reduce((max, c) => Math.max(max, c.fontSize), 0);
  const filtered = sortByPriority(candidates).filter((candidate) =>
    candidate.fontSize === largestFontSize ||
    candidate.fontSize > 20 ||
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
      usageCount: candidate.count,
      fontFamily: candidate.fontFamily,
      fontSize: candidate.fontSize,
      fontWeight: candidate.fontWeight,
      lineHeight: candidate.lineHeight,
      letterSpacing: candidate.letterSpacing,
      textTransform: candidate.textTransform,
      textAlign: dominantTextAlign(candidate.textAlignCounts)
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
      usageCount: candidate.count,
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
  source: string,
  semanticNamesByValue: Map<string, string[]>
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
    for (const semanticName of semanticNamesByValue.get(normalizedValue) ?? []) {
      if (!existing.semanticNames.includes(semanticName)) {
        existing.semanticNames.push(semanticName);
      }
    }
    return;
  }

  candidates.set(key, {
    role,
    value: normalizedValue,
    count: 1,
    sources: [source],
    semanticNames: [...(semanticNamesByValue.get(normalizedValue) ?? [])]
  });
}

function parseTypographyCandidate(
  node: SerializedStyleNode
): Omit<TypographyCandidate, "count" | "sources" | "textAlignCounts"> | null {
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
  const semanticFromVariable = candidate.semanticNames[0];
  if (semanticFromVariable) {
    return semanticFromVariable;
  }

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
    .filter((part) => !/^(?:[a-f0-9]{8,}|[a-z0-9]{12,})$/i.test(part))
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

function buildSemanticColorNameIndex(cssVariables: Record<string, string>): Map<string, string[]> {
  const namesByValue = new Map<string, string[]>();

  for (const [name, rawValue] of Object.entries(cssVariables)) {
    if (!looksLikeColorVariable(name, rawValue)) {
      continue;
    }

    const normalizedValue = normalizeColor(rawValue);
    const semanticName = inferSemanticNameFromVariable(name);
    if (!normalizedValue || !semanticName) {
      continue;
    }

    const existing = namesByValue.get(normalizedValue) ?? [];
    if (!existing.includes(semanticName)) {
      existing.push(semanticName);
    }
    existing.sort((left, right) => semanticVariableWeight(right) - semanticVariableWeight(left));
    namesByValue.set(normalizedValue, existing);
  }

  return namesByValue;
}

function looksLikeColorVariable(name: string, value: string): boolean {
  if (!name.startsWith("--")) {
    return false;
  }

  if (/(space|spacing|radius|size|width|height|font|shadow|blur|duration|timing|z-index|opacity)/i.test(name)) {
    return false;
  }

  return normalizeColor(value) !== null;
}

function inferSemanticNameFromVariable(name: string): string | null {
  const parts = name
    .replace(/^--/, "")
    .split(/[^a-zA-Z0-9]+/)
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length > 1)
    .filter((part) => !/^\d+$/.test(part))
    .filter((part) => !["color", "colors", "theme", "palette", "token", "tokens", "ui"].includes(part));

  if (parts.length === 0) {
    return null;
  }

  const ranked = parts
    .filter((part) => !GENERIC_SOURCE_TERMS.has(part))
    .sort((left, right) => {
      const scoreDiff = semanticVariableWeight(right) - semanticVariableWeight(left);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }
      return left.localeCompare(right);
    });

  const selected = (ranked.length > 0 ? ranked : parts).slice(0, 2);
  return selected.length > 0 ? selected.join("-") : null;
}

function semanticVariableWeight(token: string): number {
  if (["primary", "brand", "accent", "secondary", "muted", "surface", "background", "foreground", "text", "border", "inverse"].includes(token)) {
    return 4;
  }

  if (PREFERRED_SOURCE_TERMS.includes(token)) {
    return 3;
  }

  return 1;
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

  const channels = parseColorChannels(normalized);
  if (channels) {
    return `rgb(${channels.r}, ${channels.g}, ${channels.b})`;
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

function getLuminanceFromColor(value: string | undefined): number | null {
  if (!value) return null;
  const channels = parseColorChannels(value);
  if (!channels) return null;
  const linearize = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linearize(channels.r) + 0.7152 * linearize(channels.g) + 0.0722 * linearize(channels.b);
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
