import type { SerializedStyleNode } from "@extractor/parser";
import { getExtensionApi } from "../storage/review-data";

const browserApi = getExtensionApi();

export async function captureSerializedStyles(): Promise<SerializedStyleNode[]> {
  if (!browserApi?.tabs?.query || !browserApi?.scripting) {
    return captureSerializedStylesFromDocument();
  }

  const [activeTab] = await browserApi.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.id) {
    throw new Error("No active tab was available for extraction.");
  }

  const [result] = await browserApi.scripting.executeScript({
    target: { tabId: activeTab.id },
    func: captureSerializedStylesFromDocument
  });

  return (result?.result as SerializedStyleNode[] | undefined) ?? [];
}

function captureSerializedStylesFromDocument(): SerializedStyleNode[] {
  const GENERIC_TAGS = new Set(["html", "body", "main", "section", "div", "span"]);

  const parsePx = (value: string): number | undefined => {
    const numeric = Number.parseFloat(value);
    return Number.isFinite(numeric) ? Math.round(numeric * 100) / 100 : undefined;
  };

  const getElementSource = (element: HTMLElement): string => {
    const tagName = element.tagName.toLowerCase();
    if (element.id) {
      return `${tagName}#${element.id}`;
    }

    const classes = Array.from(element.classList);
    // Filter hashed class names before trying to infer a semantic source.
    const isHashed = (className: string) => /^[a-z]{2,6}_[A-Za-z0-9\-]{3,}$/.test(className);
    const readable = classes.filter((className) => !isHashed(className));
    const pool = readable.length > 0 ? readable : classes;
    const semantic = pool.find((className) => className.length > 6 && /[_A-Z-]/.test(className));
    const picked = semantic
      ? [semantic, ...pool.filter((className) => className !== semantic).slice(0, 1)]
      : pool.slice(0, 2);
    const className = picked.join(".");
    return className ? `${tagName}.${className}` : tagName;
  };

  const normalizeTextTransform = (value: string): SerializedStyleNode["textTransform"] => {
    if (
      value === "uppercase" ||
      value === "lowercase" ||
      value === "capitalize" ||
      value === "none"
    ) {
      return value;
    }

    return "none";
  };

  // Parse a box-shadow string and return the color of the first inset shadow found.
  // Many modern button libraries (Zendesk Garden, Radix, Headless UI) use
  // `box-shadow: inset 0 0 0 Xpx <color>` instead of `border` so that the
  // visual stroke doesn't affect layout.  The CSS `border` properties are
  // "none" / 0 in these cases, so we fall back to the inset shadow color.
  const extractInsetShadowColor = (boxShadow: string): string | undefined => {
    if (!boxShadow.includes("inset")) return undefined;

    // Split shadows on top-level commas (not those inside functional notations).
    const shadows: string[] = [];
    let depth = 0;
    let current = "";
    for (const char of boxShadow) {
      if (char === "(") depth++;
      else if (char === ")") depth--;
      if (char === "," && depth === 0) {
        shadows.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    if (current.trim()) shadows.push(current.trim());

    for (const shadow of shadows) {
      if (!shadow.includes("inset")) continue;
      const colorMatch = shadow.match(/rgba?\([^)]+\)|hsla?\([^)]+\)|#[0-9a-fA-F]{3,8}\b/);
      if (colorMatch) return colorMatch[0];
    }

    return undefined;
  };

  const hasMeaningfulStyles = (node: SerializedStyleNode): boolean =>
    Boolean(
      node.textColor ||
        node.backgroundColor ||
        node.borderColor ||
        node.boxShadow ||
        node.filter ||
        node.backdropFilter ||
        node.fontFamily
    );

  const getPriority = (element: HTMLElement, style: CSSStyleDeclaration, rect: DOMRect): number => {
    let score = 0;
    const tagName = element.tagName.toLowerCase();
    const text = element.textContent?.trim() ?? "";

    if (tagName === "button") {
      score += 12;
    }

    if (tagName === "a" && Boolean(element.getAttribute("href"))) {
      score += 10;
    }

    if (["input", "textarea", "select", "nav", "details"].includes(tagName)) {
      score += 10;
    }

    if (element.hasAttribute("aria-expanded")) {
      score += 10;
    }

    if (element.getAttribute("role")) {
      score += 8;
    }

    if (style.boxShadow !== "none") {
      score += 7;
    }

    if (style.borderStyle !== "none" && parseFloat(style.borderTopWidth) > 0) {
      score += 5;
    }

    if (style.backgroundColor !== "rgba(0, 0, 0, 0)" && style.backgroundColor !== "transparent") {
      score += 4;
    }

    if (text.length > 0) {
      score += Math.min(6, Math.ceil(text.length / 24));
    }

    if (rect.width > 120 && rect.height > 32) {
      score += 4;
    }

    if (Array.from(element.classList).length > 0) {
      score += 3;
    }

    if (!GENERIC_TAGS.has(tagName)) {
      score += 2;
    }

    if (tagName === "html" || tagName === "body") {
      score -= 20;
    }

    return score;
  };

  const resolvePadding = (
    element: HTMLElement,
    style: CSSStyleDeclaration,
    rect: DOMRect
  ): Pick<
    SerializedStyleNode,
    "paddingTop" | "paddingRight" | "paddingBottom" | "paddingLeft"
  > => {
    // 1. Self padding — fast path for elements with direct CSS padding.
    const selfPadding = {
      paddingTop: parsePx(style.paddingTop) ?? 0,
      paddingRight: parsePx(style.paddingRight) ?? 0,
      paddingBottom: parsePx(style.paddingBottom) ?? 0,
      paddingLeft: parsePx(style.paddingLeft) ?? 0
    };

    if (
      selfPadding.paddingTop +
        selfPadding.paddingRight +
        selfPadding.paddingBottom +
        selfPadding.paddingLeft >
      0
    ) {
      return selfPadding;
    }

    const tagName = element.tagName.toLowerCase();
    const isButtonLike =
      tagName === "button" ||
      element.getAttribute("role") === "button" ||
      (tagName === "a" && Boolean(element.textContent?.trim()));

    if (!isButtonLike || rect.width === 0 || rect.height === 0) {
      return {
        paddingTop: undefined,
        paddingRight: undefined,
        paddingBottom: undefined,
        paddingLeft: undefined
      };
    }

    // 2. Check direct children only — many frameworks (Tailwind, MUI, Webflow)
    //    apply padding to a single inner wrapper span rather than the button itself.
    for (const child of Array.from(element.children).slice(0, 3)) {
      const childStyle = window.getComputedStyle(child as HTMLElement);
      const pt = parsePx(childStyle.paddingTop) ?? 0;
      const pr = parsePx(childStyle.paddingRight) ?? 0;
      const pb = parsePx(childStyle.paddingBottom) ?? 0;
      const pl = parsePx(childStyle.paddingLeft) ?? 0;
      if (pt + pr + pb + pl > 0) {
        return { paddingTop: pt, paddingRight: pr, paddingBottom: pb, paddingLeft: pl };
      }
    }

    return {
      paddingTop: undefined,
      paddingRight: undefined,
      paddingBottom: undefined,
      paddingLeft: undefined
    };
  };

  const LANDMARK_TAGS = new Set(["nav", "header", "main", "footer", "aside"]);

  const getNearestLandmark = (element: HTMLElement): SerializedStyleNode["landmark"] => {
    let node: HTMLElement | null = element.parentElement;
    while (node && node.tagName.toLowerCase() !== "body") {
      const tag = node.tagName.toLowerCase();
      if (LANDMARK_TAGS.has(tag)) {
        return tag as SerializedStyleNode["landmark"];
      }
      node = node.parentElement;
    }
    return undefined;
  };

  const maxNodes = 300;
  const elements = Array.from(document.querySelectorAll<HTMLElement>("*"));

  return elements
    .map((element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const tagName = element.tagName.toLowerCase();
      const hasVisibleArea = rect.width > 0 || rect.height > 0;
      const hasText = Boolean(element.textContent?.trim());
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        (!hasVisibleArea && !hasText)
      ) {
        return null;
      }

      let backgroundColor = style.backgroundColor;
      if (backgroundColor === "rgba(0, 0, 0, 0)" || backgroundColor === "transparent") {
        // Gradient fills: background-color is transparent but background-image has the color.
        if (style.backgroundImage !== "none" && style.backgroundImage.includes("gradient")) {
          const match = style.backgroundImage.match(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}/);
          if (match) backgroundColor = match[0];
        // Skip child background lookup for native buttons and role="button" elements.
        // Outline/ghost buttons are intentionally transparent; inheriting a child's
        // background would misclassify them as fill buttons.
        } else if (
          element.children.length > 0 &&
          tagName !== "button" &&
          element.getAttribute("role") !== "button"
        ) {
          for (const child of Array.from(element.children).slice(0, 3)) {
            const childBg = window.getComputedStyle(child as HTMLElement).backgroundColor;
            if (childBg !== "rgba(0, 0, 0, 0)" && childBg !== "transparent") {
              backgroundColor = childBg;
              break;
            }
          }
        }
      }

      const borderColor =
        style.borderStyle !== "none" &&
        (parseFloat(style.borderTopWidth) > 0 || parseFloat(style.borderRightWidth) > 0)
          ? style.borderColor
          : extractInsetShadowColor(style.boxShadow);
      const boxShadow = style.boxShadow !== "none" ? style.boxShadow : undefined;
      const filter = style.filter !== "none" ? style.filter : undefined;
      const backdropFilter = style.backdropFilter !== "none" ? style.backdropFilter : undefined;
      const fontSize = parsePx(style.fontSize);
      const lineHeight = style.lineHeight === "normal" ? "normal" : parsePx(style.lineHeight);
      const letterSpacing =
        style.letterSpacing === "normal" ? "normal" : parsePx(style.letterSpacing);

      const snapshot: SerializedStyleNode = {
        source: getElementSource(element),
        tagName,
        classNames: Array.from(element.classList),
        textContent: element.textContent?.trim().slice(0, 120),
        childCount: element.children.length,
        width: parsePx(String(rect.width)),
        height: parsePx(String(rect.height)),
        display: style.display,
        gap: (() => {
          const selfGap = parsePx(style.gap);
          if (selfGap) return selfGap;

          let best = 0;
          for (const child of Array.from(element.children).slice(0, 8)) {
            const childStyles = window.getComputedStyle(child as HTMLElement);
            if (
              childStyles.display === "flex" ||
              childStyles.display === "inline-flex" ||
              childStyles.display === "grid"
            ) {
              const gap = parsePx(childStyles.gap) ?? 0;
              if (gap > best) best = gap;
            }
          }

          return best > 0 ? best : undefined;
        })(),
        position: style.position,
        gridTemplateColumns: style.display === "grid" ? style.gridTemplateColumns : undefined,
        maxWidth: style.maxWidth !== "none" ? parsePx(style.maxWidth) : undefined,
        ...resolvePadding(element, style, rect),
        justifyContent: style.justifyContent,
        alignItems: style.alignItems,
        flexWrap: style.flexWrap,
        borderRadius: (() => {
          // Accordion triggers (aria-expanded) often have pill-shaped styling
          // (high border-radius) that belongs to the trigger button, not the
          // accordion panel container. Walk up to the nearest non-button ancestor
          // and use its corner radius as the accordion's representative value.
          if (element.hasAttribute("aria-expanded")) {
            const parent = element.parentElement;
            if (
              parent &&
              parent.tagName.toLowerCase() !== "body" &&
              parent.tagName.toLowerCase() !== "html"
            ) {
              const parentRadius = parsePx(window.getComputedStyle(parent).borderRadius);
              if (parentRadius !== undefined) return parentRadius;
            }
          }
          return parsePx(style.borderRadius);
        })(),
        role: element.getAttribute("role") ?? undefined,
        ariaExpanded: element.hasAttribute("aria-expanded")
          ? element.getAttribute("aria-expanded") === "true"
          : undefined,
        href: element instanceof HTMLAnchorElement ? element.href : undefined,
        inputType:
          element instanceof HTMLInputElement
            ? element.type
            : element instanceof HTMLTextAreaElement
              ? "textarea"
              : element instanceof HTMLSelectElement
                ? "select"
                : undefined,
        disabled:
          element instanceof HTMLButtonElement ||
          element instanceof HTMLInputElement ||
          element instanceof HTMLSelectElement ||
          element instanceof HTMLTextAreaElement
            ? element.disabled
            : undefined,
        landmark: getNearestLandmark(element),
        pageY: Math.round(rect.top + window.scrollY),
        textColor: hasText ? style.color : undefined,
        backgroundColor,
        borderColor,
        boxShadow,
        filter,
        backdropFilter,
        fontFamily: hasText ? style.fontFamily : undefined,
        fontSize: hasText ? fontSize ?? undefined : undefined,
        fontWeight: hasText ? style.fontWeight : undefined,
        lineHeight: hasText ? lineHeight : undefined,
        letterSpacing: hasText ? letterSpacing : undefined,
        textTransform: hasText ? normalizeTextTransform(style.textTransform) : undefined
      };

      if (!hasMeaningfulStyles(snapshot)) {
        return null;
      }

      return {
        snapshot,
        priority: getPriority(element, style, rect)
      };
    })
    .filter(
      (entry): entry is { snapshot: SerializedStyleNode; priority: number } => entry !== null
    )
    .sort((left, right) => right.priority - left.priority)
    .slice(0, maxNodes)
    .map((entry) => entry.snapshot);
}
