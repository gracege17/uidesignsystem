import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { DesignTokens, ExtractedComponent, ExtractionResult, LayoutMetrics } from "@extractor/types";

// Round a numeric pixel value to the nearest integer for display.
// Fluid typography and em-based spacing produce sub-pixel computed values
// (e.g. 22.08px, 12.81px) that are meaningless for design system specs.
const px = Math.round;

const REVIEW_TABS = [
  { id: "overview", label: "Overview" },
  { id: "color", label: "Color" },
  { id: "typography", label: "Typography" },
  { id: "layout", label: "Spacing" },
  { id: "components", label: "Components" },
  { id: "debug", label: "Debug" }
] as const;

type ReviewTab = (typeof REVIEW_TABS)[number]["id"];
type ThemeMode = "light" | "dark";
type HeroButtonSlotLabel = "Main CTA" | "Secondary CTA" | "Other Button";
type HeroButtonSlot = { label: HeroButtonSlotLabel; component?: ExtractedComponent };
type FilledHeroButtonSlot = { label: HeroButtonSlotLabel; component: ExtractedComponent };

function formatTreatment(component: ExtractedComponent) {
  if (component.variants.style !== "ghost") {
    return component.variants.style;
  }

  if (component.type === "NavigationItem") {
    return "text-only";
  }

  if (component.type === "Navigation" || component.type === "ContentBlock" || component.type === "ListItem" || component.type === "FeatureItem") {
    return "transparent";
  }

  return "ghost";
}

export default function DesignSystemReview({
  result,
  layout = "stacked",
  theme = "light"
}: {
  result: ExtractionResult;
  layout?: "stacked" | "split";
  theme?: ThemeMode;
}) {
  const [activeTab, setActiveTab] = useState<ReviewTab>("overview");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const ui = getThemeClasses(theme);
  const summary = useMemo(() => buildSummary(result), [result]);

  const copySection = async (key: ReviewTab | "everything") => {
    const text = buildCopyText(key, summary, result);
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    globalThis.setTimeout(() => {
      setCopiedKey((current) => (current === key ? null : current));
    }, 1500);
  };

  if (layout === "split") {
    return (
      <div className="grid min-h-[780px] grid-cols-[180px_minmax(0,1fr)] gap-8">
        <aside className={`border-r pr-6 ${ui.sidebarBorder}`}>
          <div className="sticky top-8">
            <p className={`text-[11px] uppercase tracking-[0.24em] ${ui.mutedText}`}>Basics</p>
            <nav className="mt-6 space-y-1">
              {REVIEW_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`block w-full border-l-2 py-2 pl-4 text-left text-sm transition ${
                    activeTab === tab.id ? ui.navActive : ui.navIdle
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0">
          <SplitSection
            tab={activeTab}
            result={result}
            summary={summary}
            theme={theme}
            copiedKey={copiedKey}
            onCopy={copySection}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <SectionShell title="Overview" subtitle="Key extracted foundations and primary signals." theme={theme} copyLabel="Copy Prompt-Ready Spec" copied={copiedKey === "everything"} onCopy={() => void copySection("everything")} extraAction={{ label: "Export design.md", onClick: () => exportDesignMd(result, summary) }}>
        <OverviewSection result={result} summary={summary} theme={theme} />
      </SectionShell>
      <SectionShell title="Color Styles" subtitle="Color styles extracted from the page, grouped by role." theme={theme} copyLabel="Copy Color" copied={copiedKey === "color"} onCopy={() => void copySection("color")}>
        <ColorSection tokens={result.tokens} summary={summary} theme={theme} />
      </SectionShell>
      <SectionShell title="Typography" subtitle="Font families and text styles extracted from the page, ordered by size." theme={theme} copyLabel="Copy Typography" copied={copiedKey === "typography"} onCopy={() => void copySection("typography")}>
        <TypographySection tokens={result.tokens} summary={summary} theme={theme} />
      </SectionShell>
      <SectionShell title="Spacing & Layout" subtitle="Content width, page margins, and spacing scale extracted from the page." theme={theme} copyLabel="Copy Layout" copied={copiedKey === "layout"} onCopy={() => void copySection("layout")}>
        <LayoutSection layout={result.layout} theme={theme} />
      </SectionShell>
      <SectionShell title="Components" subtitle="Top reusable component families extracted from the page." theme={theme} copyLabel="Copy Components" copied={copiedKey === "components"} onCopy={() => void copySection("components")}>
        <ComponentsSection result={result} summary={summary} theme={theme} />
      </SectionShell>
      <SectionShell title="Debug" subtitle="Extraction decisions, observed values, canonical values, and suspicious measurements." theme={theme} copyLabel="Copy Debug" copied={copiedKey === "debug"} onCopy={() => void copySection("debug")}>
        <DebugSection result={result} theme={theme} />
      </SectionShell>
    </div>
  );
}

function SplitSection({
  tab,
  result,
  summary,
  theme,
  copiedKey,
  onCopy
}: {
  tab: ReviewTab;
  result: ExtractionResult;
  summary: SummaryModel;
  theme: ThemeMode;
  copiedKey: string | null;
  onCopy: (key: ReviewTab | "everything") => Promise<void>;
}) {
  if (tab === "overview") {
    return (
      <SectionShell title="Overview" subtitle="Start here to identify the main design-system signals." theme={theme} copyLabel="Copy Prompt-Ready Spec" copied={copiedKey === "everything"} onCopy={() => void onCopy("everything")} extraAction={{ label: "Export design.md", onClick: () => exportDesignMd(result, summary) }}>
        <OverviewSection result={result} summary={summary} theme={theme} />
      </SectionShell>
    );
  }

  if (tab === "color") {
    return (
      <SectionShell title="Color Styles" subtitle="Color styles extracted from the page, grouped by role." theme={theme} copyLabel="Copy Color" copied={copiedKey === "color"} onCopy={() => void onCopy("color")}>
        <ColorSection tokens={result.tokens} summary={summary} theme={theme} />
      </SectionShell>
    );
  }

  if (tab === "typography") {
    return (
      <SectionShell title="Typography" subtitle="Font families and text styles extracted from the page, ordered by size." theme={theme} copyLabel="Copy Typography" copied={copiedKey === "typography"} onCopy={() => void onCopy("typography")}>
        <TypographySection tokens={result.tokens} summary={summary} theme={theme} />
      </SectionShell>
    );
  }

  if (tab === "layout") {
    return (
      <SectionShell title="Spacing & Layout" subtitle="Content width, page margins, and spacing scale extracted from the page." theme={theme} copyLabel="Copy Layout" copied={copiedKey === "layout"} onCopy={() => void onCopy("layout")}>
        <LayoutSection layout={result.layout} theme={theme} />
      </SectionShell>
    );
  }

  if (tab === "components") {
    return (
      <SectionShell title="Components" subtitle="Curated gallery of the most repeated component families." theme={theme} copyLabel="Copy Components" copied={copiedKey === "components"} onCopy={() => void onCopy("components")}>
        <ComponentsSection result={result} summary={summary} theme={theme} />
      </SectionShell>
    );
  }

  return (
    <SectionShell title="Debug" subtitle="Extraction decisions, observed values, canonical values, and suspicious measurements." theme={theme} copyLabel="Copy Debug" copied={copiedKey === "debug"} onCopy={() => void onCopy("debug")}>
      <DebugSection result={result} theme={theme} />
    </SectionShell>
  );
}

function OverviewSection({
  result,
  summary,
  theme
}: {
  result: ExtractionResult;
  summary: SummaryModel;
  theme: ThemeMode;
}) {
  const ui = getThemeClasses(theme);

  // Primary brand color — first non-neutral fill token
  const brandColor = summary.primaryColor;

  // Primary font — most common font family
  const primaryFont = summary.fontFamilies[0];
  const bodyStyle = summary.body;

  const primaryButton = pickPrimaryButton(result.components);

  // One-line summary sentence
  const summaryParts: string[] = [];
  if (primaryFont) summaryParts.push(primaryFont.split(",")[0].trim());
  if (brandColor) summaryParts.push(brandColor.value);
  if (result.layout.contentWidth) summaryParts.push(`${result.layout.contentWidth}px canvas`);
  if (result.layout.spacingScale[0]) summaryParts.push(`${result.layout.spacingScale[0]}px base grid`);

  return (
    <div className="space-y-6">

      {/* 4 visual tiles */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">

        {/* Brand color */}
        <div className={`${ui.softPanel} overflow-hidden`}>
          <div
            className="h-20 w-full"
            style={{ backgroundColor: brandColor?.value ?? "#e2e8f0" }}
          />
          <div className="p-3">
            <p className={`text-[10px] uppercase tracking-[0.18em] ${ui.mutedText}`}>Brand color</p>
            <p className={`mt-1 text-xs font-semibold ${ui.headingText}`}>{brandColor?.value ?? "—"}</p>
          </div>
        </div>

        {/* Typeface */}
        <div className={`${ui.softPanel} p-4 flex flex-col justify-between`}>
          <p className={`text-[10px] uppercase tracking-[0.18em] ${ui.mutedText}`}>Typeface</p>
          <div>
            <p
              className={`mt-2 text-4xl font-bold leading-none ${ui.headingText}`}
              style={{ fontFamily: primaryFont ? `"${primaryFont}", sans-serif` : undefined }}
            >
              Aa
            </p>
            <p className={`mt-2 text-xs font-semibold ${ui.headingText}`}>
              {primaryFont?.split(",")[0].trim() ?? "—"}
            </p>
            {bodyStyle && (
              <p className={`text-[11px] ${ui.mutedText}`}>{px(bodyStyle.fontSize)}px / {bodyStyle.fontWeight}</p>
            )}
          </div>
        </div>

        {/* Primary button */}
        <div className={`${ui.softPanel} p-4 flex flex-col justify-between`}>
          <p className={`text-[10px] uppercase tracking-[0.18em] ${ui.mutedText}`}>Primary button</p>
          {primaryButton ? (
            <ComponentPreview component={primaryButton} tokens={result.tokens} theme={theme} showSpecs={false} />
          ) : (
            <p className={`text-xs ${ui.mutedText}`}>Not detected</p>
          )}
        </div>

        {/* Canvas */}
        <div className={`${ui.softPanel} p-4 flex flex-col justify-between`}>
          <p className={`text-[10px] uppercase tracking-[0.18em] ${ui.mutedText}`}>Canvas</p>
          <div className="space-y-2">
            {result.layout.contentWidth ? (
              <div>
                <p className={`text-2xl font-semibold tabular-nums ${ui.headingText}`}>
                  {result.layout.contentWidth}
                  <span className={`text-sm font-normal ml-0.5 ${ui.mutedText}`}>px</span>
                </p>
                <p className={`text-[11px] ${ui.mutedText}`}>max content width</p>
              </div>
            ) : (
              <p className={`text-xs ${ui.mutedText}`}>Not detected</p>
            )}
            {result.layout.spacingScale[0] && (
              <p className={`text-[11px] ${ui.mutedText}`}>
                {result.layout.spacingScale[0]}px base unit
              </p>
            )}
          </div>
        </div>
      </div>

      {/* One-line summary */}
      {summaryParts.length > 0 && (
        <div className={`${ui.softPanel} px-5 py-4`}>
          <p className={`text-sm ${ui.bodyText}`}>
            <span className={`font-medium ${ui.headingText}`}>At a glance — </span>
            {summaryParts.join(" · ")}
          </p>
        </div>
      )}
    </div>
  );
}

function ColorSection({
  tokens,
  summary,
  theme
}: {
  tokens: DesignTokens;
  summary: SummaryModel;
  theme: ThemeMode;
}) {
  const ui = getThemeClasses(theme);
  const groups = [
    { label: "Primary", items: summary.colorGroups.primary },
    { label: "Neutral", items: summary.colorGroups.neutral },
    { label: "Accent", items: summary.colorGroups.accent }
  ].filter((group) => group.items.length > 0);

  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <section key={group.label} className="grid grid-cols-[88px_minmax(0,1fr)] gap-8">
          <div className={`pt-3 text-sm font-medium ${ui.subtleText}`}>{group.label}</div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {group.items.map((token) => {
              const hex = colorToHex(token.value);
              return (
                <div key={token.id} className={`${ui.softPanel} overflow-hidden`}>
                  <div className={`h-20 ${ui.rule}`} style={{ backgroundColor: token.value }} />
                  <div className="p-4">
                    <p className={`text-sm font-semibold ${ui.headingText}`}>{token.name}</p>
                    <p className={`mt-1 text-xs font-mono ${ui.bodyText}`}>{hex ?? token.value}</p>
                    {hex && hex !== token.value.toUpperCase() && (
                      <p className={`mt-0.5 text-[11px] font-mono ${ui.mutedText}`}>{token.value}</p>
                    )}
                    <p className={`mt-2 truncate text-[11px] ${ui.mutedText}`}>
                      {token.description ? `${token.description} · ${token.source}` : token.source}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {groups.length === 0 ? (
        <EmptyState message="No clear color groups were found." theme={theme} />
      ) : null}
    </div>
  );
}

function TypographySection({
  tokens,
  summary,
  theme
}: {
  tokens: DesignTokens;
  summary: SummaryModel;
  theme: ThemeMode;
}) {
  const ui = getThemeClasses(theme);

  useEffect(() => {
    const defs = summary.fontFamilies
      .map((family) => getOpenSourceFontDefinition(family))
      .filter((definition): definition is OpenSourceFontDefinition => Boolean(definition));

    if (defs.length === 0) {
      return;
    }

    const inserted: HTMLLinkElement[] = [];
    for (const definition of defs) {
      const id = `open-font-${definition.id}`;
      if (document.getElementById(id)) {
        continue;
      }

      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = definition.url;
      document.head.appendChild(link);
      inserted.push(link);
    }

    return () => {
      for (const link of inserted) {
        link.remove();
      }
    };
  }, [summary.fontFamilies]);

  const seenIds = new Set<string>();
  // Labels describe what we actually know — size position and range — not assumed semantic role
  const scale: Array<{ role: string; token: NonNullable<typeof summary.h1> }> = [
    summary.h1 ? { role: "Largest", token: summary.h1 } : null,
    summary.h2 ? { role: "2nd Largest", token: summary.h2 } : null,
    summary.h3 ? { role: "3rd Largest", token: summary.h3 } : null,
    summary.body ? { role: "Body range (14–20px)", token: summary.body } : null,
    summary.caption ? { role: "Small text (<14px)", token: summary.caption } : null,
  ].filter((entry): entry is NonNullable<typeof entry> => {
    if (!entry) return false;
    if (seenIds.has(entry.token.id)) return false;
    seenIds.add(entry.token.id);
    return true;
  });

  return (
    <div className="space-y-8">
      <div className={`${ui.heroPanel} grid gap-10 ${summary.fontFamilies.length > 1 ? "md:grid-cols-2" : ""}`}>
        {summary.fontFamilies.length === 0 ? (
          <div>
            <p className={`text-[11px] uppercase tracking-[0.22em] ${ui.heroMetaText}`}>Typeface</p>
            <p className={`mt-3 text-3xl font-semibold tracking-tight ${ui.heroHeadingText}`}>—</p>
          </div>
        ) : summary.fontFamilies.map((family) => (
          <div key={family}>
            <p className={`text-[11px] uppercase tracking-[0.22em] ${ui.heroMetaText}`}>Typeface</p>
            <p className={`mt-3 text-3xl font-semibold tracking-tight ${ui.heroHeadingText}`}>{family}</p>
            <p className={`mt-2 text-[11px] ${ui.heroMetaText}`}>
              {buildFontPreviewStatus(family).message}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-8">
        {scale.map(({ role, token }) => (
          <div key={token.id} className={`border-t pt-6 ${ui.rule}`}>
            <div className={`mb-4 grid grid-cols-[minmax(0,1fr)_100px_100px_100px_80px] gap-4 text-[11px] uppercase tracking-[0.18em] ${ui.mutedText}`}>
              <span>{role} — {token.fontFamily}</span>
              <span>Font Size</span>
              <span>Line Height (ratio)</span>
              <span>Letter Space</span>
              <span>Align</span>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_100px_100px_100px_80px] gap-4">
              <p
                className={`pr-6 ${ui.headingText}`}
                style={{
                  fontFamily: buildPreviewFontStack(token.fontFamily),
                  fontSize: `${Math.min(token.fontSize, 64)}px`,
                  lineHeight: `${Math.min(token.lineHeight, 72)}px`,
                  fontWeight: token.fontWeight,
                  letterSpacing: `${token.letterSpacing}px`,
                  textTransform: token.textTransform ?? "none",
                  textAlign: token.textAlign ?? "left"
                }}
              >
                The quick brown fox jumps over the lazy dog
              </p>
              <p className={`pt-2 text-sm ${ui.bodyText}`}>{Math.round(token.fontSize)}px<span className={`ml-1 text-[11px] ${ui.mutedText}`}>({(token.fontSize / 16).toFixed(2)}rem)</span></p>
              <p className={`pt-2 text-sm ${ui.bodyText}`}>{(token.lineHeight / token.fontSize).toFixed(2)}</p>
              <p className={`pt-2 text-sm ${ui.bodyText}`}>{token.letterSpacing}px</p>
              <p className={`pt-2 text-sm ${ui.bodyText}`}>{token.textAlign ?? "left"}</p>
            </div>
          </div>
        ))}
      </div>

      {scale.length === 0 ? <EmptyState message="No clear typography scale was found." theme={theme} /> : null}
    </div>
  );
}

function LayoutSection({
  layout,
  theme
}: {
  layout: LayoutMetrics;
  theme: ThemeMode;
}) {
  const ui = getThemeClasses(theme);
  const hasAnything = layout.contentWidth || layout.pageMargin || layout.spacingScale.length > 0 || layout.grid;

  return (
    <div className="space-y-8">

      {/* Content width + page margin */}
      {(layout.contentWidth || layout.pageMargin) && (
        <div className="space-y-3">
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${ui.mutedText}`}>Canvas</p>
          <div className={`grid grid-cols-2 gap-4`}>
            {layout.contentWidth && (
              <div className={`${ui.softPanel} p-4 space-y-1`}>
                <p className={`text-[11px] uppercase tracking-[0.18em] ${ui.mutedText}`}>Content width</p>
                <p className={`text-2xl font-semibold tabular-nums ${ui.headingText}`}>{layout.contentWidth}<span className={`text-sm font-normal ml-1 ${ui.mutedText}`}>px</span></p>
              </div>
            )}
            {layout.pageMargin && (
              <div className={`${ui.softPanel} p-4 space-y-1`}>
                <p className={`text-[11px] uppercase tracking-[0.18em] ${ui.mutedText}`}>Page margin</p>
                <p className={`text-2xl font-semibold tabular-nums ${ui.headingText}`}>{layout.pageMargin}<span className={`text-sm font-normal ml-1 ${ui.mutedText}`}>px</span></p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSS grid system */}
      {layout.grid && (
        <div className="space-y-3">
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${ui.mutedText}`}>Grid system</p>
          <div className={`${ui.softPanel} p-4 space-y-3`}>
            <div className={`flex items-center justify-between text-sm ${ui.bodyText}`}>
              <span>{layout.grid.columns} columns</span>
              <span className="flex items-center gap-1.5">
                {layout.grid.gap > 0
                  ? `gap ${layout.grid.gap}px`
                  : <span>gap <span className={`italic ${ui.mutedText}`}>via cell padding</span></span>
                }
              </span>
            </div>
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${Math.min(layout.grid.columns, 12)}, minmax(0, 1fr))`,
                gap: layout.grid.gap > 0 ? `${layout.grid.gap}px` : "0px"
              }}
            >
              {Array.from({ length: Math.min(layout.grid.columns, 12) }).map((_, i) => (
                <div key={i} className={`h-8 rounded ${ui.gridCell}`} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Spacing scale */}
      {layout.spacingScale.length > 0 && (() => {
        const scale = layout.spacingScale.slice(0, 8);
        const baseUnit = scale[0];
        const compact = scale.filter((v) => v <= 12);
        const regular = scale.filter((v) => v > 12 && v <= 32);
        const spacious = scale.filter((v) => v > 32);
        const tiers = [
          { label: "Compact", values: compact },
          { label: "Regular", values: regular },
          { label: "Spacious", values: spacious },
        ].filter((t) => t.values.length > 0);

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${ui.mutedText}`}>Spacing scale</p>
              <span className={`text-[11px] ${ui.mutedText}`}>Base unit: <span className={`font-semibold ${ui.bodyText}`}>{baseUnit}px</span></span>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {tiers.map((tier) => {
                const max = tier.values[tier.values.length - 1];
                return (
                  <div key={tier.label} className="space-y-3">
                    <p className={`text-[10px] uppercase tracking-[0.18em] ${ui.mutedText}`}>{tier.label}</p>
                    <div className="space-y-2">
                      {tier.values.map((value) => (
                        <div key={value} className="space-y-1">
                          <div
                            className={`h-5 rounded ${ui.gridCell}`}
                            style={{ width: `${Math.round((value / max) * 100)}%` }}
                          />
                          <span className={`text-[11px] tabular-nums ${ui.mutedText}`}>{value}px</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {!hasAnything && <EmptyState message="No spacing or layout data could be extracted from this page." theme={theme} />}
    </div>
  );
}

function ComponentsSection({
  result,
  summary,
  theme
}: {
  result: ExtractionResult;
  summary: SummaryModel;
  theme: ThemeMode;
}) {
  const ui = getThemeClasses(theme);
  const STYLE_PRIORITY: Record<string, number> = { fill: 0, outline: 1, ghost: 2 };
  const curatedComponents = filterNonFooterComponents(result.components);
  const heroButtonSlots = pickHeroButtons(curatedComponents);
  const visibleHeroButtons = heroButtonSlots.filter(
    (entry): entry is FilledHeroButtonSlot => Boolean(entry.component)
  );

  // Pick the best Card representative (fill > outline > ghost)
  const baseCard =
    curatedComponents.find((c) => c.type === "Card" && c.variants.style === "fill") ??
    curatedComponents.find((c) => c.type === "Card");

  // Content-type families that are shown via hierarchy, not as standalone cards
  const CONTENT_TYPES = new Set(["FeatureItem", "ContentBlock", "ListItem", "NavigationItem"]);

  // Navigation hierarchy: NavBar container + its NavigationItems
  const navBar = curatedComponents.find((c) => c.type === "Navigation");
  const navItems = curatedComponents.filter((c) => c.type === "NavigationItem").slice(0, 3);

  // Accordion hierarchy: pick representatives for collapsed + expanded states
  const accordions = curatedComponents.filter((c) => c.type === "Accordion");
  const accordionClosed = accordions.find((c) => c.variants.state === "default") ?? accordions[0];
  const accordionOpen = accordions.find((c) => c.variants.state !== "default" && c !== accordionClosed) ?? accordions[1];

  // For non-Button, non-Card families, exclude Navigation + NavigationItem + Accordion (handled via hierarchy panels)
  const otherCurated = summary.componentFamilies
    .filter(
      (family) =>
        family.type !== "Button" &&
        family.type !== "Card" &&
        family.type !== "Navigation" &&
        family.type !== "Accordion" &&
        family.type !== "NavigationItem"
    )
    .map((family) => {
      const matches = curatedComponents.filter((c) => c.type === family.type);
      return matches.sort(
        (a, b) =>
          (STYLE_PRIORITY[a.variants.style] ?? 9) - (STYLE_PRIORITY[b.variants.style] ?? 9)
      )[0];
    })
    .filter((c): c is ExtractedComponent => Boolean(c))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">

      {visibleHeroButtons.length > 0 && (() => {
        const fillComponent =
          visibleHeroButtons.find((entry) => entry.label === "Main CTA")?.component ??
          visibleHeroButtons[0].component;
        const fillType = result.tokens.typography.find((t) => fillComponent.tokens.typography.includes(t.id));
        const fillPad = fillComponent.padding ?? fillComponent.autoLayout?.padding;
        const specs: { label: string; value: string }[] = [];
        if (fillType) specs.push({ label: "Font", value: `${fillType.fontFamily} · ${px(fillType.fontSize)}px · ${fillType.fontWeight}` });
        if (fillPad) {
          specs.push({ label: "Padding", value: `${fillPad.top} · ${fillPad.right} · ${fillPad.bottom} · ${fillPad.left} px` });
        } else if (fillComponent.height) {
          specs.push({ label: "Height", value: `${px(fillComponent.height)}px` });
        }
        if (fillComponent.cornerRadius !== undefined) specs.push({ label: "Corner", value: `${px(fillComponent.cornerRadius)}px` });
        specs.push({ label: "Size", value: fillComponent.variants.size });
        return (
          <div className={`${ui.softPanel} p-5 md:col-span-2`}>
            <div className="flex items-start justify-between gap-3">
              <p className={`text-sm font-semibold ${ui.headingText}`}>Button</p>
              <span className={`text-[11px] uppercase tracking-[0.18em] ${ui.mutedText}`}>{visibleHeroButtons.length} {visibleHeroButtons.length === 1 ? "cta found" : "ctas found"}</span>
            </div>
            <div className={`mt-4 p-4 ${ui.previewPanel} space-y-5`}>
              <div className="flex flex-wrap items-center gap-8">
                {visibleHeroButtons.map(({ label, component }) => (
                  <div key={component.id} className="flex flex-col items-center gap-2">
                    <ComponentPreview component={component} tokens={result.tokens} theme={theme} showSpecs={false} />
                    <p className={`text-[10px] font-medium ${ui.mutedText}`}>{label}</p>
                    <p className={`max-w-[180px] truncate text-[10px] ${ui.mutedText}`} title={component.textContent ?? component.source}>
                      {component.textContent ?? component.name}
                    </p>
                    <p className={`max-w-[140px] truncate text-[9px] ${ui.mutedText} opacity-60`} title={component.source}>{component.source}</p>
                  </div>
                ))}
              </div>
              {specs.length > 0 && (
                <div className={`border-t pt-4 ${ui.rule} grid grid-cols-2 gap-x-8 gap-y-1.5`}>
                  {specs.map((spec) => (
                    <div key={spec.label} className="grid grid-cols-[56px_1fr] gap-3 text-xs">
                      <span className={`font-medium ${ui.mutedText}`}>{spec.label}</span>
                      <span className={ui.bodyText}>{spec.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {!baseCard && (visibleHeroButtons.length > 0 || otherCurated.length > 0) && (
        <div className={`${ui.softPanel} p-5 md:col-span-2 opacity-50`}>
          <div className="flex items-start justify-between gap-3">
            <p className={`text-sm font-semibold ${ui.headingText}`}>Card</p>
            <span className={`text-[11px] uppercase tracking-[0.18em] ${ui.mutedText}`}>not detected</span>
          </div>
          <div className={`mt-4 p-4 ${ui.previewPanel}`}>
            <div className="flex h-28 items-center justify-center rounded-xl border-2 border-dashed" style={{ borderColor: "currentColor" }}>
              <p className={`text-xs ${ui.mutedText}`}>No card pattern found on this page</p>
            </div>
          </div>
        </div>
      )}

      {baseCard && (() => {
        const cardType = result.tokens.typography.find((t) => baseCard.tokens.typography.includes(t.id));
        const cardPad = baseCard.padding ?? baseCard.autoLayout?.padding;
        const cardSpecs: { label: string; value: string }[] = [];
        if (cardType) cardSpecs.push({ label: "Font", value: `${cardType.fontFamily} · ${px(cardType.fontSize)}px · ${cardType.fontWeight}` });
        if (cardPad) cardSpecs.push({ label: "Padding", value: `${cardPad.top} · ${cardPad.right} · ${cardPad.bottom} · ${cardPad.left} px` });
        if (baseCard.cornerRadius !== undefined) cardSpecs.push({ label: "Corner", value: `${px(baseCard.cornerRadius)}px` });
        cardSpecs.push({ label: "Size", value: baseCard.variants.size });
        return (
          <div className={`${ui.softPanel} p-5 md:col-span-2`}>
            <div className="flex items-start justify-between gap-3">
              <p className={`text-sm font-semibold ${ui.headingText}`}>Card</p>
              <span className={`text-[11px] uppercase tracking-[0.18em] ${ui.mutedText}`}>{baseCard.source}</span>
            </div>
            <div className={`mt-4 p-4 ${ui.previewPanel} space-y-5`}>
              <div className="max-w-[220px]">
                <ComponentPreview component={baseCard} tokens={result.tokens} theme={theme} showSpecs={false} />
              </div>
              {cardSpecs.length > 0 && (
                <div className={`border-t pt-4 ${ui.rule} grid grid-cols-2 gap-x-8 gap-y-1.5`}>
                  {cardSpecs.map((spec) => (
                    <div key={spec.label} className="grid grid-cols-[64px_1fr] gap-3 text-xs">
                      <span className={`font-medium ${ui.mutedText}`}>{spec.label}</span>
                      <span className={ui.bodyText}>{spec.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Navigation hierarchy panel */}
      {(navBar || navItems.length > 0) && (() => {
        const navPad = navBar?.padding ?? navBar?.autoLayout?.padding;
        const navSpecs: { label: string; value: string }[] = [];
        if (navBar?.width) navSpecs.push({ label: "Width", value: `${navBar.width}px` });
        if (navBar?.height) navSpecs.push({ label: "Height", value: `${px(navBar.height)}px` });
        if (navPad) navSpecs.push({ label: "Padding", value: `${navPad.top} · ${navPad.right} · ${navPad.bottom} · ${navPad.left} px` });
        if (navBar?.autoLayout?.gap) navSpecs.push({ label: "Gap", value: `${navBar.autoLayout.gap}px` });
        const navItemSample = navItems[0];
        const navItemType = navItemSample ? result.tokens.typography.find((t) => navItemSample.tokens.typography.includes(t.id)) : undefined;
        if (navItemType) navSpecs.push({ label: "Item font", value: `${navItemType.fontFamily} · ${px(navItemType.fontSize)}px · ${navItemType.fontWeight}` });
        return (
          <div className={`${ui.softPanel} p-5 md:col-span-2`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`text-sm font-semibold ${ui.headingText}`}>Navigation</p>
                <p className={`mt-1 text-xs ${ui.bodyText}`}>Nav bar · {navItems.length} item{navItems.length !== 1 ? "s" : ""} detected</p>
              </div>
              <span className={`text-[11px] uppercase tracking-[0.18em] ${ui.mutedText}`}>hierarchy</span>
            </div>
            <div className={`mt-4 p-4 ${ui.previewPanel} space-y-4`}>
              {navBar && (
                <div className="space-y-1">
                  <p className={`text-[10px] uppercase tracking-widest font-medium ${ui.mutedText}`}>Nav Container</p>
                  <ComponentPreview component={navBar} tokens={result.tokens} theme={theme} showSpecs={false} />
                  <p className={`text-[10px] ${ui.mutedText} truncate`} title={navBar.source}>{navBar.source}</p>
                </div>
              )}
              {navItems.length > 0 && (
                <div className="space-y-1">
                  <p className={`text-[10px] uppercase tracking-widest font-medium ${ui.mutedText}`}>Nav Items</p>
                  <div className="flex flex-wrap gap-3">
                    {navItems.map((item) => (
                      <div key={item.id} className="flex flex-col items-center gap-1">
                        <ComponentPreview component={item} tokens={result.tokens} theme={theme} showSpecs={false} />
                        <p className={`text-[10px] ${ui.mutedText} max-w-[120px] truncate`} title={item.textContent ?? item.source}>
                          {item.textContent ?? item.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {navSpecs.length > 0 && (
                <div className={`border-t pt-3 ${ui.rule} grid grid-cols-2 gap-x-8 gap-y-1.5`}>
                  {navSpecs.map((spec) => (
                    <div key={spec.label} className="grid grid-cols-[64px_1fr] gap-3 text-xs">
                      <span className={`font-medium ${ui.mutedText}`}>{spec.label}</span>
                      <span className={ui.bodyText}>{spec.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Accordion hierarchy panel */}
      {(accordionClosed || accordionOpen) && (() => {
        const rep = accordionClosed ?? accordionOpen!;
        const accPad = rep.padding ?? rep.autoLayout?.padding;
        const accType = result.tokens.typography.find((t) => rep.tokens.typography.includes(t.id));
        const accSpecs: { label: string; value: string }[] = [];
        if (accType) accSpecs.push({ label: "Font", value: `${accType.fontFamily} · ${px(accType.fontSize)}px · ${accType.fontWeight}` });
        if (accPad) accSpecs.push({ label: "Padding", value: `${accPad.top} · ${accPad.right} · ${accPad.bottom} · ${accPad.left} px` });
        if (rep.cornerRadius !== undefined) accSpecs.push({ label: "Corner", value: `${px(rep.cornerRadius)}px` });
        return (
          <div className={`${ui.softPanel} p-5 md:col-span-2`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`text-sm font-semibold ${ui.headingText}`}>Accordion</p>
                <p className={`mt-1 text-xs ${ui.bodyText}`}>Expandable section · collapsed + expanded states</p>
              </div>
              <span className={`text-[11px] uppercase tracking-[0.18em] ${ui.mutedText}`}>states</span>
            </div>
            <div className={`mt-4 p-4 ${ui.previewPanel} space-y-4`}>
              <div className="grid grid-cols-2 gap-4">
                {accordionClosed && (
                  <div className="space-y-1">
                    <p className={`text-[10px] uppercase tracking-widest font-medium ${ui.mutedText}`}>Collapsed</p>
                    <ComponentPreview component={accordionClosed} tokens={result.tokens} theme={theme} showSpecs={false} />
                    <p className={`text-[10px] ${ui.mutedText} truncate`} title={accordionClosed.textContent ?? accordionClosed.source}>
                      {accordionClosed.textContent ?? accordionClosed.source}
                    </p>
                  </div>
                )}
                {accordionOpen && (
                  <div className="space-y-1">
                    <p className={`text-[10px] uppercase tracking-widest font-medium ${ui.mutedText}`}>Expanded</p>
                    <ComponentPreview component={accordionOpen} tokens={result.tokens} theme={theme} showSpecs={false} />
                    <p className={`text-[10px] ${ui.mutedText} truncate`} title={accordionOpen.textContent ?? accordionOpen.source}>
                      {accordionOpen.textContent ?? accordionOpen.source}
                    </p>
                  </div>
                )}
                {accordionClosed && !accordionOpen && (
                  <div className={`flex items-center justify-center rounded-lg border-2 border-dashed opacity-40`} style={{ borderColor: "currentColor" }}>
                    <p className={`text-[10px] ${ui.mutedText} p-4`}>expanded state not detected</p>
                  </div>
                )}
              </div>
              {accSpecs.length > 0 && (
                <div className={`border-t pt-3 ${ui.rule} grid grid-cols-2 gap-x-8 gap-y-1.5`}>
                  {accSpecs.map((spec) => (
                    <div key={spec.label} className="grid grid-cols-[64px_1fr] gap-3 text-xs">
                      <span className={`font-medium ${ui.mutedText}`}>{spec.label}</span>
                      <span className={ui.bodyText}>{spec.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {otherCurated.map((component) => {
        const meta = getComponentDisplayMeta(component);
        return (
        <div key={component.id} className={`${ui.softPanel} p-5`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={`text-sm font-semibold ${ui.headingText}`}>{meta.title}</p>
              <p className={`mt-1 text-xs ${ui.bodyText}`}>{meta.subtitle}</p>
            </div>
            <span className={`text-[11px] uppercase tracking-[0.18em] ${ui.mutedText}`}>{meta.badge}</span>
          </div>

          <div className={`mt-4 p-4 ${ui.previewPanel}`}>
            <ComponentPreview component={component} tokens={result.tokens} theme={theme} />
          </div>
        </div>
        );
      })}

      {visibleHeroButtons.length === 0 && !baseCard && !navBar && navItems.length === 0 && !accordionClosed && otherCurated.length === 0 ? <EmptyState message="No curated component families were found." theme={theme} /> : null}
      </div>
    </div>
  );
}

function DebugSection({
  result,
  theme
}: {
  result: ExtractionResult;
  theme: ThemeMode;
}) {
  const ui = getThemeClasses(theme);
  const components = filterNonFooterComponents(result.components);
  const debugRows = components.map((component) => buildComponentDebugRow(component, result));
  const warningCount = debugRows.reduce((count, row) => count + row.warnings.length, 0);

  if (debugRows.length === 0) {
    return <EmptyState message="No components were extracted, so there is nothing to debug yet." theme={theme} />;
  }

  return (
    <div className="space-y-5">
      <div className={`${ui.softPanel} p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className={`text-sm font-semibold ${ui.headingText}`}>Extraction Diagnostics</p>
            <p className={`mt-1 text-xs ${ui.bodyText}`}>
              Use this tab to verify why an element became a component and whether raw measurements were canonicalized.
            </p>
          </div>
          <div className="flex gap-2 text-[11px]">
            <span className={`rounded-full border px-2.5 py-1 ${ui.rule} ${ui.bodyText}`}>{debugRows.length} components</span>
            <span className={`rounded-full border px-2.5 py-1 ${ui.rule} ${warningCount > 0 ? "text-amber-600" : ui.bodyText}`}>
              {warningCount} warnings
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {debugRows.map((row) => (
          <div key={row.component.id} className={`${ui.softPanel} overflow-hidden`}>
            <div className={`flex flex-wrap items-start justify-between gap-3 border-b p-4 ${ui.rule}`}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`text-sm font-semibold ${ui.headingText}`}>{row.component.type}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] ${ui.rule} ${ui.mutedText}`}>
                    {formatTreatment(row.component)} / {row.component.variants.size}
                  </span>
                  {row.component.variants.state !== "default" && (
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] ${ui.rule} ${ui.mutedText}`}>
                      {row.component.variants.state}
                    </span>
                  )}
                </div>
                <p className={`mt-1 max-w-3xl truncate text-xs font-mono ${ui.mutedText}`} title={row.component.source}>
                  {row.component.source}
                </p>
                {row.component.textContent && (
                  <p className={`mt-1 text-xs ${ui.bodyText}`}>"{row.component.textContent}"</p>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {row.warnings.length > 0 ? row.warnings.map((warning) => (
                  <span key={warning} className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                    {warning}
                  </span>
                )) : (
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] ${ui.rule} ${ui.mutedText}`}>no warnings</span>
                )}
              </div>
            </div>

            <div className="grid gap-4 p-4 lg:grid-cols-[1.1fr_1fr_1fr]">
              <DebugPanel title="Decision" theme={theme}>
                {row.decision.map((item) => (
                  <DebugKeyValue key={item.label} label={item.label} value={item.value} theme={theme} />
                ))}
              </DebugPanel>

              <DebugPanel title="Measurements" theme={theme}>
                {row.measurements.map((item) => (
                  <DebugKeyValue key={item.label} label={item.label} value={item.value} theme={theme} />
                ))}
              </DebugPanel>

              <DebugPanel title="Token Matches" theme={theme}>
                {row.tokens.map((item) => (
                  <DebugKeyValue key={item.label} label={item.label} value={item.value} theme={theme} />
                ))}
              </DebugPanel>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DebugPanel({ title, theme, children }: { title: string; theme: ThemeMode; children: ReactNode }) {
  const ui = getThemeClasses(theme);

  return (
    <div className={`rounded-2xl border p-3 ${ui.rule}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${ui.mutedText}`}>{title}</p>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function DebugKeyValue({ label, value, theme }: { label: string; value: string; theme: ThemeMode }) {
  const ui = getThemeClasses(theme);

  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 text-xs">
      <span className={ui.mutedText}>{label}</span>
      <span className={`min-w-0 break-words font-mono ${ui.bodyText}`}>{value || "none"}</span>
    </div>
  );
}

type DebugField = { label: string; value: string };

function buildComponentDebugRow(component: ExtractedComponent, result: ExtractionResult) {
  const padding = component.padding ?? component.autoLayout?.padding;
  const observedPadding = padding
    ? `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`
    : "";
  const canonicalPadding = padding ? formatSpacingBox(padding, result.layout.spacingScale) : "";
  const observedRadius = component.cornerRadius !== undefined ? `${component.cornerRadius}px` : "";
  const canonicalRadius = component.cornerRadius !== undefined ? `${canonicalRadiusValue(component.cornerRadius)}px` : "";
  const observedGap = component.autoLayout?.gap !== undefined ? `${component.autoLayout.gap}px` : "";
  const canonicalGap = component.autoLayout?.gap !== undefined
    ? `${canonicalSpacingValue(component.autoLayout.gap, result.layout.spacingScale)}px`
    : "";
  const typoToken = result.tokens.typography.find((token) => component.tokens.typography.includes(token.id));
  const fillTokens = component.tokens.fills.map((id) => result.tokens.colors.find((token) => token.id === id)).filter(Boolean);
  const textTokens = component.tokens.text
    .map((id) => result.tokens.colors.find((token) => token.id === id))
    .filter((token) => {
      const fillToken = fillTokens[0];
      return Boolean(token && (!fillToken || colorToHex(fillToken.value) !== colorToHex(token.value)));
    });
  const strokeTokens = component.tokens.strokes.map((id) => result.tokens.colors.find((token) => token.id === id)).filter(Boolean);
  const warnings = buildDebugWarnings(component, result.layout.spacingScale);

  const decision: DebugField[] = [
    { label: "type", value: component.type },
    { label: "treatment", value: `${formatTreatment(component)} / ${component.variants.size} / ${component.variants.state}` },
    { label: "raw style", value: component.variants.style },
    { label: "name", value: component.name },
    { label: "why", value: describeClassificationReason(component) },
    { label: "landmark", value: component.landmark ?? "none" },
    { label: "pageY", value: component.pageY !== undefined ? `${canonicalDimensionValue(component.pageY)}px` : "unknown" }
  ];

  const measurements: DebugField[] = [
    { label: "radius", value: observedRadius ? `${observedRadius} -> ${canonicalRadius}` : "none" },
    { label: "padding", value: observedPadding ? `${observedPadding} -> ${canonicalPadding}` : "none" },
    { label: "gap", value: observedGap ? `${observedGap} -> ${canonicalGap}` : "none" },
    {
      label: "size",
      value: [
        component.width !== undefined ? `w ${component.width}px -> ${canonicalDimensionValue(component.width)}px` : null,
        component.height !== undefined ? `h ${component.height}px -> ${canonicalDimensionValue(component.height)}px` : null
      ].filter(Boolean).join(", ")
    },
    {
      label: "layout",
      value: component.autoLayout
        ? `${component.autoLayout.direction}, ${component.autoLayout.primaryAlignment}/${component.autoLayout.counterAlignment}`
        : "none"
    }
  ];

  const tokenMatches: DebugField[] = [
    { label: "fill", value: formatDebugColorTokens(fillTokens) },
    { label: "text", value: formatDebugColorTokens(textTokens) },
    { label: "stroke", value: formatDebugColorTokens(strokeTokens) },
    {
      label: "type",
      value: typoToken
        ? `${typoToken.name}: ${typoToken.fontFamily} ${typoToken.fontSize}px -> ${formatCanonicalTypographyToken(typoToken).size}px / ${typoToken.fontWeight}`
        : "none"
    }
  ];

  if (component.type === "Button") {
    tokenMatches.push({
      label: "style src",
      value: fillTokens.length > 0
        ? "self computed fill"
        : "missing fill on captured element; inspect parent/child wrapper or pseudo-element"
    });
  }

  return {
    component,
    decision,
    measurements,
    tokens: tokenMatches,
    warnings
  };
}

function formatDebugColorTokens(tokens: Array<DesignTokens["colors"][number] | undefined>) {
  const names = tokens
    .filter((token): token is DesignTokens["colors"][number] => Boolean(token))
    .map((token) => `${token.name}: ${colorToHex(token.value) ?? token.value}`);

  return names.length > 0 ? names.join(", ") : "none";
}

function describeClassificationReason(component: ExtractedComponent) {
  const source = component.source.toLowerCase();
  const reasons: string[] = [];

  if (component.type === "Button") {
    if (source.includes("button") || source.includes("btn")) reasons.push("button-like class/source");
    if (source.startsWith("a") || source.includes(" a") || source.includes("href")) reasons.push("anchor promoted to CTA");
    if ((component.textContent?.trim().length ?? 0) > 0) reasons.push("short visible label");
    if (component.variants.style === "fill") reasons.push("visible fill treatment");
  } else if (component.type === "Navigation" || component.type === "NavigationItem") {
    reasons.push("navigation landmark/source");
  } else if (component.type === "Accordion") {
    reasons.push("expandable/disclosure structure");
  } else if (component.type === "Card") {
    reasons.push("contained surface treatment");
  } else if (component.type === "FeatureItem" || component.type === "ListItem") {
    reasons.push("repeated structural pattern");
  }

  return reasons.length > 0 ? reasons.join("; ") : component.description ?? "structural heuristic";
}

function buildDebugWarnings(component: ExtractedComponent, spacingScale: number[]) {
  const warnings = new Set<string>();
  const padding = component.padding ?? component.autoLayout?.padding;
  const values = [
    { label: "radius", value: component.cornerRadius, canonical: component.cornerRadius !== undefined ? canonicalRadiusValue(component.cornerRadius) : undefined },
    { label: "gap", value: component.autoLayout?.gap, canonical: component.autoLayout?.gap !== undefined ? canonicalSpacingValue(component.autoLayout.gap, spacingScale) : undefined },
    { label: "pad top", value: padding?.top, canonical: padding?.top !== undefined ? canonicalSpacingValue(padding.top, spacingScale) : undefined },
    { label: "pad right", value: padding?.right, canonical: padding?.right !== undefined ? canonicalSpacingValue(padding.right, spacingScale) : undefined },
    { label: "pad bottom", value: padding?.bottom, canonical: padding?.bottom !== undefined ? canonicalSpacingValue(padding.bottom, spacingScale) : undefined },
    { label: "pad left", value: padding?.left, canonical: padding?.left !== undefined ? canonicalSpacingValue(padding.left, spacingScale) : undefined }
  ];

  for (const item of values) {
    if (item.value === undefined || item.canonical === undefined) continue;
    if (hasFractionalPixels(item.value)) warnings.add(`fractional ${item.label}`);
    if (Math.abs(item.value - item.canonical) > 0.01) warnings.add(`${item.label} canonicalized`);
  }

  if (component.type === "Button" && /\bcc-[a-z0-9-]*(lime|dragonfruit|ube|tangerine|blueberry)[a-z0-9-]*\b/i.test(component.source)) {
    warnings.add("color-first class");
  }

  return [...warnings];
}

function hasFractionalPixels(value: number) {
  return Math.abs(value - Math.round(value)) > 0.01;
}

function pickPrimaryButton(components: ExtractedComponent[]): ExtractedComponent | undefined {
  const buttons = filterNonFooterComponents(components).filter((component) => component.type === "Button");
  if (buttons.length === 0) {
    return undefined;
  }

  const defaultButtons = buttons.filter((component) => component.variants.state === "default");
  const pool = defaultButtons.length > 0 ? defaultButtons : buttons;
  const fillButtons = pool.filter((component) => component.variants.style === "fill");
  const prioritized = fillButtons.length > 0 ? fillButtons : pool;

  return [...prioritized].sort((left, right) => scorePrimaryButton(right) - scorePrimaryButton(left))[0];
}

function isPrimaryActionLabel(label: string) {
  return /\b(get started|start|try|sign up|signup|register|buy|book|demo|get tickets|contact sales|request|join|subscribe|create|launch)\b/i.test(label);
}

function isUtilityActionLabel(label: string) {
  return /\b(sign in|signin|log in|login|docs|documentation|support|link|privacy|terms|menu)\b/i.test(label);
}

function pickHeroButtons(components: ExtractedComponent[]): HeroButtonSlot[] {
  const buttons = filterNonFooterComponents(components).filter((component) => component.type === "Button");
  if (buttons.length === 0) {
    return [];
  }

  const defaultButtons = buttons.filter((component) => component.variants.state === "default");
  const statePool = defaultButtons.length > 0 ? defaultButtons : buttons;
  const ranked = [...statePool].sort((left, right) => scorePrimaryButton(right) - scorePrimaryButton(left));

  const mainCta = ranked.find((component) => component.variants.style === "fill") ?? ranked[0];
  const remainingAfterMain = ranked.filter((component) => component.id !== mainCta?.id);

  const mainPageY = mainCta?.pageY ?? 0;
  const secondaryCta =
    remainingAfterMain.find(
      (component) =>
        component.variants.style === "outline" &&
        Math.abs((component.pageY ?? 0) - mainPageY) < 400
    ) ??
    remainingAfterMain.find(
      (component) =>
        component.variants.style === "ghost" &&
        Math.abs((component.pageY ?? 0) - mainPageY) < 200 &&
        component.textContent?.trim() !== mainCta?.textContent?.trim()
    );
  const remainingAfterSecondary = remainingAfterMain.filter(
    (component) => component.id !== secondaryCta?.id
  );
  const otherButton = remainingAfterSecondary.find(
    (component) =>
      component.variants.style !== mainCta?.variants.style &&
      component.variants.style !== secondaryCta?.variants.style
  );

  return [
    { label: "Main CTA", component: mainCta },
    { label: "Secondary CTA", component: secondaryCta },
    { label: "Other Button", component: otherButton }
  ];
}

function scorePrimaryButton(component: ExtractedComponent): number {
  let score = 0;
  const label = component.textContent?.trim() ?? "";

  if (component.variants.state === "default") {
    score += 100;
  }

  if (component.variants.style === "fill") {
    score += 80;
  } else if (component.variants.style === "outline") {
    score += 40;
  }

  if (component.variants.size === "lg") {
    score += 40;
  } else if (component.variants.size === "md") {
    score += 20;
  }

  if (component.landmark === "nav" || component.landmark === "header") {
    score -= 120;
  } else if (component.landmark === "footer") {
    score -= 160;
  }

  // Hero/above-fold buttons are more likely to be primary than top-nav utility actions.
  if (component.pageY !== undefined) {
    if (component.pageY >= 96 && component.pageY <= 900) {
      score += 120;
    } else if (component.pageY > 0 && component.pageY < 96) {
      score += 20;
    } else if (component.pageY <= 1400) {
      score += 40;
    }
  }

  if (component.width) {
    score += Math.min(component.width, 320) * 0.2;
  }

  if (component.height) {
    score += Math.min(component.height, 72) * 0.4;
  }

  const padding = component.padding ?? component.autoLayout?.padding;
  if (padding) {
    score += padding.left + padding.right;
    score += (padding.top + padding.bottom) * 0.5;
  }

  if (label.length > 0) {
    score += Math.min(label.length, 24);
    if (isPrimaryActionLabel(label)) {
      score += 140;
    }
    if (isUtilityActionLabel(label)) {
      score -= 180;
    }
  }

  return score;
}

function getComponentDisplayMeta(component: ExtractedComponent): {
  title: string;
  subtitle: string;
  badge: string;
} {
  if (component.type === "Navigation") {
    return {
      title: "Top Nav",
      subtitle: "Layout · width · gap · padding",
      badge: "top nav"
    };
  }

  if (component.type === "NavigationItem") {
    return {
      title: "Top Nav Item",
      subtitle: "Clickable link · inside top nav",
      badge: "top nav item"
    };
  }

  if (component.type === "FeatureItem") {
    return {
      title: "Feature Item",
      subtitle: "Repeated value prop or benefit block",
      badge: "feature item"
    };
  }

  if (component.type === "ContentBlock") {
    return {
      title: "Content Block",
      subtitle: "Structured content group without card treatment",
      badge: "content block"
    };
  }

  if (component.type === "ListItem") {
    return {
      title: "List Item",
      subtitle: "Repeated content item inside a list or grid",
      badge: "list item"
    };
  }

  const STYLE_LABEL_TYPES = new Set(["Button", "Card"]);
  const styleLabel = STYLE_LABEL_TYPES.has(component.type) ? `${formatTreatment(component)} · ` : "";
  return {
    title: component.type,
    subtitle: `${styleLabel}${component.variants.size} · ${component.variants.state}`,
    badge: component.name
  };
}

function ComponentPreview({
  component,
  tokens,
  theme,
  showSpecs = true
}: {
  component: ExtractedComponent;
  tokens: DesignTokens;
  theme: ThemeMode;
  showSpecs?: boolean;
}) {
  const ui = getThemeClasses(theme);
  const fill = tokens.colors.find((token) => component.tokens.fills.includes(token.id))?.value;
  const stroke = tokens.colors.find((token) => component.tokens.strokes.includes(token.id))?.value;
  const text = tokens.colors.find((token) => component.tokens.text.includes(token.id))?.value;
  const type = tokens.typography.find((token) => component.tokens.typography.includes(token.id));
  const variantStyle = component.variants.style;

  // For fill buttons with no captured background, fall back to the primary brand color
  const primaryBrandColor = tokens.colors.find(
    (t) => t.role === "fill" && !isNeutralColor(t.value)
  )?.value;

  const resolvedBackground =
    variantStyle === "outline" || variantStyle === "ghost"
      ? "transparent"
      : (fill ?? primaryBrandColor ?? (theme === "light" ? "#6366f1" : "#4f46e5"));
  const resolvedBorder = stroke ?? fill ?? primaryBrandColor ?? (theme === "light" ? "#d4d4d8" : "#334155");
  const previewTextColor = getReadableTextColor(
    variantStyle === "outline" || variantStyle === "ghost"
      ? (theme === "light" ? "#ffffff" : "#0f172a")
      : resolvedBackground,
    text ?? (variantStyle !== "fill" ? (fill ?? stroke) : undefined),
    theme
  );

  const padding = component.padding ?? component.autoLayout?.padding;
  const previewPadding = padding ? clampPreviewPadding(canonicalSpacingBox(padding)) : undefined;
  const paddingStyle = padding
    ? {
        paddingTop: `${previewPadding?.top}px`,
        paddingRight: `${previewPadding?.right}px`,
        paddingBottom: `${previewPadding?.bottom}px`,
        paddingLeft: `${previewPadding?.left}px`
      }
    : {};

  const style = {
    backgroundColor: resolvedBackground,
    border: variantStyle === "fill" ? "none" : undefined,
    borderColor: variantStyle === "fill" ? undefined : (variantStyle === "ghost" ? "transparent" : resolvedBorder),
    color: previewTextColor,
    fontFamily: type ? `"${type.fontFamily}", sans-serif` : undefined,
    fontSize: type ? `${Math.min(type.fontSize, 18)}px` : undefined,
    fontWeight: type?.fontWeight,
    ...paddingStyle
  };

  if (component.type === "Button" || component.type === "Badge") {
    const borderRadius = component.cornerRadius !== undefined ? `${canonicalRadiusValue(component.cornerRadius)}px` : "9999px";
    const pad = component.padding ?? component.autoLayout?.padding;
    const specs: { label: string; value: string }[] = [];
    if (type) specs.push({ label: "Font", value: `${type.fontFamily} · ${px(type.fontSize)}px · ${type.fontWeight}` });
    if (pad) {
      specs.push({ label: "Padding", value: formatSpacingBox(pad) });
    } else if (component.height) {
      specs.push({ label: "Height", value: `${px(component.height)}px` });
    }
    if (component.cornerRadius !== undefined) specs.push({ label: "Corner", value: `${canonicalRadiusValue(component.cornerRadius)}px` });
    specs.push({ label: "Size", value: component.variants.size });
    const previewLabel =
      component.textContent && component.textContent.trim().length <= 24
        ? component.textContent.trim()
        : component.type;
    return (
      <div className="space-y-4">
        <button
          type="button"
          className={`w-fit max-w-[220px] truncate ${variantStyle === "ghost" ? "border-0" : "border"}${!padding ? " px-5 py-2.5" : ""}`}
          style={{ ...style, borderRadius, fontSize: type ? `${Math.min(type.fontSize, 16)}px` : undefined }}
          title={component.textContent ?? component.source}
        >
          {previewLabel}
        </button>
        {showSpecs && specs.length > 0 && (
          <div className="space-y-1.5">
            {specs.map((spec) => (
              <div key={spec.label} className="grid grid-cols-[56px_1fr] gap-3 text-xs">
                <span className={`font-medium ${ui.mutedText}`}>{spec.label}</span>
                <span className={ui.bodyText}>{spec.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (component.type === "Card") {
    const borderRadius = component.cornerRadius !== undefined ? `${component.cornerRadius}px` : "8px";
    const pad = component.padding ?? component.autoLayout?.padding;
    const specs: { label: string; value: string }[] = [];
    if (pad) specs.push({ label: "Padding", value: `${px(pad.top)} · ${px(pad.right)} · ${px(pad.bottom)} · ${px(pad.left)} px` });
    if (component.cornerRadius !== undefined) specs.push({ label: "Corner", value: `${px(component.cornerRadius)}px` });
    if (type) specs.push({ label: "Font", value: `${type.fontFamily} · ${px(type.fontSize)}px · ${type.fontWeight}` });
    specs.push({ label: "Size", value: component.variants.size });

    const cardBg = fill ?? (theme === "light" ? "#ffffff" : "#1e293b");
    const cardBorder = stroke ?? (theme === "light" ? "#e2e8f0" : "#334155");
    const cardTextColor = getReadableTextColor(cardBg, text, theme);

    return (
      <div className="space-y-4">
        <div
          className="border"
          style={{
            backgroundColor: cardBg,
            borderColor: cardBorder,
            borderRadius,
            color: cardTextColor,
            fontFamily: type ? `"${type.fontFamily}", sans-serif` : undefined,
            ...(pad
              ? { paddingTop: `${pad.top}px`, paddingRight: `${pad.right}px`, paddingBottom: `${pad.bottom}px`, paddingLeft: `${pad.left}px` }
              : { padding: "16px" })
          }}
        >
          {component.textContent ? (
            <p className="text-sm font-semibold leading-snug">{component.textContent}</p>
          ) : (
            <p className={`text-xs ${ui.mutedText}`}>{component.source}</p>
          )}
        </div>
        {showSpecs && specs.length > 0 && (
          <div className="space-y-1.5">
            {specs.map((spec) => (
              <div key={spec.label} className="grid grid-cols-[64px_1fr] gap-3 text-xs">
                <span className={`font-medium ${ui.mutedText}`}>{spec.label}</span>
                <span className={ui.bodyText}>{spec.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (component.type === "Navigation") {
    const borderRadius = component.cornerRadius !== undefined ? `${component.cornerRadius}px` : "8px";
    const navBg = fill ?? (theme === "light" ? "#ffffff" : "#1e293b");
    const navBorder = stroke ?? (theme === "light" ? "#e2e8f0" : "#334155");
    const navText = getReadableTextColor(navBg, text, theme);
    const pad = component.padding ?? component.autoLayout?.padding;
    const gap = component.autoLayout?.gap ?? 16;

    const specs: { label: string; value: string }[] = [];
    if (component.width) specs.push({ label: "Width", value: `${component.width}px` });
    if (component.height) specs.push({ label: "Height", value: `${px(component.height)}px` });
    if (component.autoLayout) {
      const layout = component.autoLayout;
      const parts = [layout.direction === "horizontal" ? "Row" : "Column"];
      if (layout.primaryAlignment !== "start") parts.push(layout.primaryAlignment);
      if (layout.counterAlignment !== "start") parts.push(`cross: ${layout.counterAlignment}`);
      if (layout.wrap) parts.push("wrap");
      specs.push({ label: "Layout", value: parts.join(" · ") });
    }
    if (component.autoLayout?.gap) specs.push({ label: "Gap", value: `${component.autoLayout.gap}px` });
    if (fill) specs.push({ label: "Bg", value: colorToHex(fill) ?? fill });
    if (text) specs.push({ label: "Color", value: colorToHex(text) ?? text });
    if (type) specs.push({ label: "Font", value: `${type.fontFamily} · ${px(type.fontSize)}px · ${type.fontWeight}` });
    if (pad) specs.push({ label: "Space", value: `${px(pad.top)} · ${px(pad.right)} · ${px(pad.bottom)} · ${px(pad.left)} px` });
    if (component.cornerRadius !== undefined) specs.push({ label: "Corner", value: `${px(component.cornerRadius)}px` });
    if (component.position) specs.push({ label: "Position", value: component.position });
    if (stroke) specs.push({ label: "Border", value: colorToHex(stroke) ?? stroke });
    if (component.tokens.effects.length > 0) specs.push({ label: "Shadow", value: "yes" });

    return (
      <div className="space-y-4">
        <div
          className="flex items-center border text-sm"
          style={{
            gap: `${gap}px`,
            backgroundColor: navBg,
            borderColor: navBorder,
            borderRadius,
            color: navText,
            fontFamily: type ? `"${type.fontFamily}", sans-serif` : undefined,
            fontSize: type ? `${Math.min(type.fontSize, 18)}px` : undefined,
            fontWeight: type?.fontWeight,
            ...(pad
              ? {
                  paddingTop: `${pad.top}px`,
                  paddingRight: `${pad.right}px`,
                  paddingBottom: `${pad.bottom}px`,
                  paddingLeft: `${pad.left}px`
                }
              : { padding: "12px 20px" })
          }}
        >
          <span>Overview</span>
          <span style={{ opacity: 0.6 }}>Pricing</span>
          <span style={{ opacity: 0.6 }}>Docs</span>
        </div>
        {showSpecs && specs.length > 0 && (
          <div className="space-y-1.5">
            {specs.map((spec) => (
              <div key={spec.label} className="grid grid-cols-[64px_1fr] gap-3 text-xs">
                <span className={`font-medium ${ui.mutedText}`}>{spec.label}</span>
                <span className={ui.bodyText}>{spec.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (component.type === "NavigationItem") {
    const itemBg = fill ?? "transparent";
    const itemText = getReadableTextColor(
      itemBg === "transparent" ? (theme === "light" ? "#ffffff" : "#0f172a") : itemBg,
      text,
      theme
    );
    const pad = component.padding ?? component.autoLayout?.padding;
    const specs: { label: string; value: string }[] = [];
    if (type) specs.push({ label: "Font", value: `${type.fontFamily} · ${px(type.fontSize)}px · ${type.fontWeight}` });
    if (pad) specs.push({ label: "Space", value: `${px(pad.top)} · ${px(pad.right)} · ${px(pad.bottom)} · ${px(pad.left)} px` });
    if (component.cornerRadius !== undefined) specs.push({ label: "Corner", value: `${px(component.cornerRadius)}px` });

    const itemStyle = {
      color: itemText,
      fontFamily: type ? `"${type.fontFamily}", sans-serif` : undefined,
      fontSize: type ? `${Math.min(type.fontSize, 16)}px` : undefined,
      fontWeight: type?.fontWeight,
      borderRadius: component.cornerRadius !== undefined ? `${component.cornerRadius}px` : undefined,
      ...(pad
        ? { paddingTop: `${pad.top}px`, paddingRight: `${pad.right}px`, paddingBottom: `${pad.bottom}px`, paddingLeft: `${pad.left}px` }
        : { padding: "8px 12px" }),
      textDecoration: "none" as const
    };

    return (
      <div className="space-y-4">
        <a
          href="#"
          className="inline-block text-sm"
          onClick={(e) => e.preventDefault()}
          style={{ ...itemStyle, backgroundColor: itemBg === "transparent" ? undefined : itemBg }}
        >
          Item 1
        </a>
        {showSpecs && specs.length > 0 && (
          <div className="space-y-1.5">
            {specs.map((spec) => (
              <div key={spec.label} className="grid grid-cols-[64px_1fr] gap-3 text-xs">
                <span className={`font-medium ${ui.mutedText}`}>{spec.label}</span>
                <span className={ui.bodyText}>{spec.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (component.type === "Accordion") {
    const borderRadius = component.cornerRadius !== undefined ? `${component.cornerRadius}px` : "8px";
    const accordionBg = fill ?? "transparent";
    const dividerColor = stroke ?? (theme === "light" ? "#e2e8f0" : "#334155");
    const headingText = text ?? (theme === "light" ? "#0f172a" : "#f8fafc");
    const bodyTextColor = theme === "light" ? "#475569" : "#94a3b8";
    const pad = component.padding ?? component.autoLayout?.padding;
    const primaryLabel = component.textContent?.trim() || "Accordion item";
    const supportingLabel = component.textContent?.trim() || "Expandable content";
    const specs: { label: string; value: string }[] = [];
    if (type) specs.push({ label: "Font", value: `${type.fontFamily} · ${px(type.fontSize)}px · ${type.fontWeight}` });
    if (pad) specs.push({ label: "Space", value: `${px(pad.top)} · ${px(pad.right)} · ${px(pad.bottom)} · ${px(pad.left)} px` });
    if (component.cornerRadius !== undefined) specs.push({ label: "Corner", value: `${px(component.cornerRadius)}px` });

    return (
      <div className="space-y-4">
        <div
          style={{
            backgroundColor: accordionBg,
            borderRadius,
            fontFamily: type ? `"${type.fontFamily}", sans-serif` : undefined,
            ...(pad
              ? {
                  paddingTop: `${pad.top}px`,
                  paddingRight: `${pad.right}px`,
                  paddingBottom: `${pad.bottom}px`,
                  paddingLeft: `${pad.left}px`
                }
              : {})
          }}
        >
          <div
            className="flex items-center justify-between py-4 text-sm"
            style={{ borderBottom: `1px solid ${dividerColor}`, color: headingText, fontWeight: type?.fontWeight ?? 600 }}
          >
            <span>{primaryLabel}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.5 }}>
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ borderBottom: `1px solid ${dividerColor}` }}>
            <div
              className="flex items-center justify-between py-4 text-sm"
              style={{ color: headingText, fontWeight: type?.fontWeight ?? 600 }}
            >
              <span>{supportingLabel}</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="pb-4 text-xs leading-relaxed" style={{ color: bodyTextColor }}>
              Expand to inspect the extracted interaction styling and layout treatment.
            </p>
          </div>
          <div
            className="flex items-center justify-between py-4 text-sm"
            style={{ borderBottom: `1px solid ${dividerColor}`, color: headingText, fontWeight: type?.fontWeight ?? 600 }}
          >
            <span>{component.name.replace(/^accordion\//, "").replace(/-/g, " ")}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.5 }}>
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        {showSpecs && specs.length > 0 && (
          <div className="space-y-1.5">
            {specs.map((spec) => (
              <div key={spec.label} className="grid grid-cols-[64px_1fr] gap-3 text-xs">
                <span className={`font-medium ${ui.mutedText}`}>{spec.label}</span>
                <span className={ui.bodyText}>{spec.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (component.type === "Input") {
    const borderRadius = component.cornerRadius !== undefined ? `${component.cornerRadius}px` : "10px";
    const inputBg = fill ?? (theme === "light" ? "#ffffff" : "#0f172a");
    const inputBorder = stroke ?? (theme === "light" ? "#cbd5e1" : "#334155");
    const inputText = getReadableTextColor(inputBg, text, theme);
    const pad = component.padding ?? component.autoLayout?.padding;
    const specs: { label: string; value: string }[] = [];
    if (type) specs.push({ label: "Font", value: `${type.fontFamily} · ${px(type.fontSize)}px · ${type.fontWeight}` });
    if (pad) specs.push({ label: "Space", value: `${px(pad.top)} · ${px(pad.right)} · ${px(pad.bottom)} · ${px(pad.left)} px` });
    if (component.cornerRadius !== undefined) specs.push({ label: "Corner", value: `${px(component.cornerRadius)}px` });
    specs.push({ label: "Size", value: component.variants.size });

    return (
      <div className="space-y-4">
        <div
          className="border"
          style={{
            backgroundColor: inputBg,
            borderColor: inputBorder,
            borderRadius,
            color: inputText,
            fontFamily: type ? `"${type.fontFamily}", sans-serif` : undefined,
            fontSize: type ? `${Math.min(type.fontSize, 18)}px` : undefined,
            fontWeight: type?.fontWeight,
            ...(pad
              ? {
                  paddingTop: `${pad.top}px`,
                  paddingRight: `${pad.right}px`,
                  paddingBottom: `${pad.bottom}px`,
                  paddingLeft: `${pad.left}px`
                }
              : { padding: "12px 14px" })
          }}
        >
          <span style={{ opacity: 0.55 }}>Email address</span>
        </div>
        {showSpecs && specs.length > 0 && (
          <div className="space-y-1.5">
            {specs.map((spec) => (
              <div key={spec.label} className="grid grid-cols-[64px_1fr] gap-3 text-xs">
                <span className={`font-medium ${ui.mutedText}`}>{spec.label}</span>
                <span className={ui.bodyText}>{spec.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (component.type === "Modal") {
    const borderRadius = component.cornerRadius !== undefined ? `${component.cornerRadius}px` : "20px";
    const modalBg = fill ?? (theme === "light" ? "#ffffff" : "#0f172a");
    const modalBorder = stroke ?? (theme === "light" ? "#e2e8f0" : "#334155");
    const modalText = getReadableTextColor(modalBg, text, theme);
    const pad = component.padding ?? component.autoLayout?.padding;
    const specs: { label: string; value: string }[] = [];
    if (type) specs.push({ label: "Font", value: `${type.fontFamily} · ${px(type.fontSize)}px · ${type.fontWeight}` });
    if (pad) specs.push({ label: "Space", value: `${px(pad.top)} · ${px(pad.right)} · ${px(pad.bottom)} · ${px(pad.left)} px` });
    if (component.cornerRadius !== undefined) specs.push({ label: "Corner", value: `${px(component.cornerRadius)}px` });
    if (component.tokens.effects.length > 0) specs.push({ label: "Effect", value: "shadow" });

    return (
      <div className="space-y-4">
        <div className="rounded-[24px] p-4" style={{ backgroundColor: theme === "light" ? "#f1f5f9" : "#020617" }}>
          <div
            className="border"
            style={{
              backgroundColor: modalBg,
              borderColor: modalBorder,
              borderRadius,
              color: modalText,
              fontFamily: type ? `"${type.fontFamily}", sans-serif` : undefined,
              ...(pad
                ? {
                    paddingTop: `${pad.top}px`,
                    paddingRight: `${pad.right}px`,
                    paddingBottom: `${pad.bottom}px`,
                    paddingLeft: `${pad.left}px`
                  }
                : { padding: "24px" })
            }}
          >
            <p className="text-base font-semibold">Invite your team</p>
            <p className="mt-2 text-sm opacity-70">
              Add collaborators and assign workspace permissions.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-full border px-4 py-2 text-sm"
                style={{ borderColor: modalBorder, color: modalText, backgroundColor: "transparent" }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full px-4 py-2 text-sm font-medium"
                style={{
                  backgroundColor: text ? "transparent" : (theme === "light" ? "#0f172a" : "#f8fafc"),
                  color: text ?? (theme === "light" ? "#ffffff" : "#0f172a")
                }}
              >
                Invite
              </button>
            </div>
          </div>
        </div>
        {showSpecs && specs.length > 0 && (
          <div className="space-y-1.5">
            {specs.map((spec) => (
              <div key={spec.label} className="grid grid-cols-[64px_1fr] gap-3 text-xs">
                <span className={`font-medium ${ui.mutedText}`}>{spec.label}</span>
                <span className={ui.bodyText}>{spec.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-[18px] border p-5" style={style}>
      <p className="text-sm font-semibold">{component.type}</p>
      <p className="mt-2 text-xs opacity-70">{component.name}</p>
    </div>
  );
}

function SectionShell({
  title,
  subtitle,
  children,
  theme,
  copyLabel,
  copied,
  onCopy,
  extraAction
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  theme: ThemeMode;
  copyLabel: string;
  copied: boolean;
  onCopy: () => void;
  extraAction?: { label: string; onClick: () => void };
}) {
  const ui = getThemeClasses(theme);
  return (
    <div className="space-y-6">
      <div className={`border-t pt-6 ${ui.rule}`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className={`text-5xl font-semibold tracking-tight ${ui.headingText}`}>{title}</h1>
            <p className={`mt-3 text-sm leading-6 ${ui.mutedText}`}>{subtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {extraAction && (
              <button type="button" onClick={extraAction.onClick} className={`rounded-full border px-4 py-2 text-sm transition ${ui.copyButton}`}>
                {extraAction.label}
              </button>
            )}
            <button type="button" onClick={onCopy} className={`rounded-full border px-4 py-2 text-sm transition ${ui.copyButton}`}>
              {copied ? "Copied" : copyLabel}
            </button>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message, theme }: { message: string; theme: ThemeMode }) {
  const ui = getThemeClasses(theme);
  return <div className={`${ui.softPanel} p-5 text-sm ${ui.mutedText}`}>{message}</div>;
}


interface SummaryModel {
  primaryColor?: DesignTokens["colors"][number];
  mainTypography?: DesignTokens["typography"][number];
  fontFamilies: string[];
  h1?: DesignTokens["typography"][number];
  h2?: DesignTokens["typography"][number];
  h3?: DesignTokens["typography"][number];
  body?: DesignTokens["typography"][number];
  caption?: DesignTokens["typography"][number];
  componentFamilies: Array<{ type: ExtractedComponent["type"]; count: number }>;
  colorGroups: {
    primary: DesignTokens["colors"];
    neutral: DesignTokens["colors"];
    accent: DesignTokens["colors"];
  };
  layout: LayoutMetrics;
}

function buildSummary(result: ExtractionResult): SummaryModel {
  const typography = [...result.tokens.typography].sort(compareTypographyPriority);
  const fontFamilies = [...new Set(typography.map((t) => t.fontFamily))];
  const body = [...result.tokens.typography]
    .filter((token) => token.fontSize >= 14 && token.fontSize <= 20)
    .sort((left, right) => {
      const distanceDiff = Math.abs(left.fontSize - 16) - Math.abs(right.fontSize - 16);
      if (distanceDiff !== 0) {
        return distanceDiff;
      }
      return (right.usageCount ?? 0) - (left.usageCount ?? 0);
    })[0];
  const caption = [...result.tokens.typography]
    .filter((token) => token.fontSize < 14)
    .sort(compareTypographyPriority)[0];
  // Headings must be > 20px so they never overlap with body or caption
  const headings = typography.filter((token) => token.fontSize > 20);
  const primaryColors = result.tokens.colors.filter(
    (token) => (token.role === "fill" || token.role === "text") && !isNeutralColor(token.value)
  ).sort(comparePrimaryColorPriority);
  const neutralColors = result.tokens.colors.filter((token) => isNeutralColor(token.value));
  const accentColors = result.tokens.colors.filter(
    (token) => !primaryColors.includes(token) && !neutralColors.includes(token)
  );
  const familyCounts = filterNonFooterComponents(result.components).reduce<Record<string, number>>((accumulator, component) => {
    accumulator[component.type] = (accumulator[component.type] ?? 0) + 1;
    return accumulator;
  }, {});

  return {
    primaryColor: primaryColors[0] ?? result.tokens.colors[0],
    mainTypography: headings[0] ?? body,
    fontFamilies,
    h1: headings[0],
    h2: headings[1],
    h3: headings[2],
    body,
    caption,
    componentFamilies: Object.entries(familyCounts)
      .map(([type, count]) => ({ type: type as ExtractedComponent["type"], count }))
      .sort((left, right) => right.count - left.count),
    colorGroups: {
      primary: primaryColors.slice(0, 4),
      neutral: neutralColors.slice(0, 5),
      accent: accentColors.slice(0, 6)
    },
    layout: result.layout
  };
}

function comparePrimaryColorPriority(
  left: DesignTokens["colors"][number],
  right: DesignTokens["colors"][number]
) {
  const rightSemantic = right.description === "from CSS variable" ? 1 : 0;
  const leftSemantic = left.description === "from CSS variable" ? 1 : 0;
  if (rightSemantic !== leftSemantic) {
    return rightSemantic - leftSemantic;
  }

  const rightFill = right.role === "fill" ? 1 : 0;
  const leftFill = left.role === "fill" ? 1 : 0;
  if (rightFill !== leftFill) {
    return rightFill - leftFill;
  }

  const usageDiff = (right.usageCount ?? 0) - (left.usageCount ?? 0);
  if (usageDiff !== 0) {
    return usageDiff;
  }

  return left.name.localeCompare(right.name);
}

function compareTypographyPriority(
  left: DesignTokens["typography"][number],
  right: DesignTokens["typography"][number]
) {
  const sizeDiff = right.fontSize - left.fontSize;
  if (sizeDiff !== 0) {
    return sizeDiff;
  }

  const usageDiff = (right.usageCount ?? 0) - (left.usageCount ?? 0);
  if (usageDiff !== 0) {
    return usageDiff;
  }

  return right.fontWeight - left.fontWeight;
}

function filterNonFooterComponents(components: ExtractedComponent[]) {
  const nonFooter = components.filter((component) => component.landmark !== "footer");
  return nonFooter.length > 0 ? nonFooter : components;
}


function isNeutralColor(value: string) {
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return false;
  const [r, g, b] = [Number(match[1]), Number(match[2]), Number(match[3])];
  return Math.abs(r - g) < 12 && Math.abs(g - b) < 12;
}

function getReadableTextColor(
  backgroundColor: string | undefined,
  preferredTextColor: string | undefined,
  theme: ThemeMode
) {
  const fallbackLight = "#111827";
  const fallbackDark = "#f8fafc";
  const backgroundLuminance = getColorLuminance(backgroundColor);

  if (preferredTextColor) {
    const preferredLuminance = getColorLuminance(preferredTextColor);
    if (backgroundLuminance !== null && preferredLuminance !== null) {
      const contrast = Math.abs(backgroundLuminance - preferredLuminance);
      if (contrast >= 0.42) {
        return preferredTextColor;
      }
    } else {
      return preferredTextColor;
    }
  }

  if (backgroundLuminance === null) {
    return theme === "light" ? fallbackLight : fallbackDark;
  }

  return backgroundLuminance > 0.6 ? fallbackLight : fallbackDark;
}

function colorToHex(value: string): string | null {
  const hexMatch = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const h = hexMatch[1];
    const full = h.length === 3 ? h.split("").map((c) => `${c}${c}`).join("") : h;
    return `#${full.toUpperCase()}`;
  }

  const rgbMatch = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    const r = Number(rgbMatch[1]).toString(16).padStart(2, "0");
    const g = Number(rgbMatch[2]).toString(16).padStart(2, "0");
    const b = Number(rgbMatch[3]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`.toUpperCase();
  }

  return null;
}

const CANONICAL_SPACING_STEPS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 72, 80, 88, 96];

function roundToNearestInteger(value: number) {
  return Math.round(value);
}

function snapToNearestStep(value: number, steps: number[], threshold = 1.5) {
  const nearest = steps.reduce((best, step) =>
    Math.abs(step - value) < Math.abs(best - value) ? step : best
  );

  return Math.abs(nearest - value) <= threshold ? nearest : roundToNearestInteger(value);
}

function canonicalSpacingValue(value: number, spacingScale: number[] = []) {
  const uniqueSteps = [...new Set([...spacingScale, ...CANONICAL_SPACING_STEPS])].sort((a, b) => a - b);
  return snapToNearestStep(value, uniqueSteps);
}

function canonicalRadiusValue(value: number) {
  return snapToNearestStep(value, CANONICAL_SPACING_STEPS);
}

function canonicalDimensionValue(value: number) {
  return roundToNearestInteger(value);
}

function canonicalLetterSpacingValue(value: number) {
  return Math.round(value * 10) / 10;
}

function formatSpacingBox(
  spacing: { top: number; right: number; bottom: number; left: number },
  spacingScale: number[] = []
) {
  return [
    canonicalSpacingValue(spacing.top, spacingScale),
    canonicalSpacingValue(spacing.right, spacingScale),
    canonicalSpacingValue(spacing.bottom, spacingScale),
    canonicalSpacingValue(spacing.left, spacingScale)
  ].join("px ") + "px";
}

function canonicalSpacingBox(
  spacing: { top: number; right: number; bottom: number; left: number },
  spacingScale: number[] = []
) {
  return {
    top: canonicalSpacingValue(spacing.top, spacingScale),
    right: canonicalSpacingValue(spacing.right, spacingScale),
    bottom: canonicalSpacingValue(spacing.bottom, spacingScale),
    left: canonicalSpacingValue(spacing.left, spacingScale)
  };
}

function clampPreviewPadding(spacing: { top: number; right: number; bottom: number; left: number }) {
  return {
    top: Math.min(spacing.top, 14),
    right: Math.min(spacing.right, 22),
    bottom: Math.min(spacing.bottom, 14),
    left: Math.min(spacing.left, 22)
  };
}

function formatCanonicalTypographyToken(
  token: {
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    lineHeight: number;
    letterSpacing: number;
    textAlign?: string;
  }
) {
  const size = canonicalDimensionValue(token.fontSize);
  const lineHeight = canonicalDimensionValue(token.lineHeight);
  const letterSpacing = canonicalLetterSpacingValue(token.letterSpacing);
  return {
    size,
    lineHeight,
    letterSpacing,
    label: `${size}px / ${lineHeight}px / weight ${token.fontWeight} / ls ${letterSpacing}px / ${token.textAlign ?? "left"}`
  };
}

function getColorLuminance(color: string | undefined) {
  if (!color) {
    return null;
  }

  const hexMatch = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    const normalized =
      hex.length === 3
        ? hex
            .split("")
            .map((part) => `${part}${part}`)
            .join("")
        : hex;
    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }

  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) {
    return null;
  }

  const [r, g, b] = [Number(match[1]), Number(match[2]), Number(match[3])];
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function getThemeClasses(theme: ThemeMode) {
  if (theme === "dark") {
    return {
      headingText: "text-slate-100",
      heroHeadingText: "text-slate-100",
      heroMetaText: "text-slate-400",
      strongText: "text-slate-100",
      bodyText: "text-slate-300",
      heroBodyText: "text-slate-300",
      subtleText: "text-slate-400",
      mutedText: "text-slate-500",
      sidebarBorder: "border-slate-800",
      rule: "border-slate-800",
      navIdle: "border-transparent text-slate-400 hover:border-slate-700 hover:text-slate-100",
      navActive: "border-slate-100 text-slate-100",
      softPanel: "rounded-[20px] border border-slate-800 bg-slate-950",
      heroPanel: "rounded-[24px] border border-slate-800 bg-slate-900 px-8 py-10",
      metricPanel: "rounded-[18px] border border-slate-800 bg-slate-950",
      previewPanel: "rounded-[18px] border border-slate-800 bg-slate-900",
      gridCell: "rounded-md bg-slate-900 text-slate-300",
      copyButton: "border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-600 hover:bg-slate-800"
    };
  }

  return {
    headingText: "text-slate-900",
    heroHeadingText: "text-white",
    heroMetaText: "text-slate-300",
    strongText: "text-slate-900",
    bodyText: "text-slate-700",
    heroBodyText: "text-slate-200",
    subtleText: "text-slate-700",
    mutedText: "text-slate-500",
    sidebarBorder: "border-slate-200",
    rule: "border-slate-200",
    navIdle: "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900",
    navActive: "border-slate-900 text-slate-900",
    softPanel: "rounded-[20px] border border-slate-200 bg-white",
    heroPanel: "rounded-[24px] border border-slate-200 bg-slate-900 px-8 py-10 text-white",
    metricPanel: "rounded-[18px] border border-slate-200 bg-white",
    previewPanel: "rounded-[18px] border border-slate-200 bg-slate-50",
    gridCell: "rounded-md bg-slate-100 text-slate-700",
    copyButton: "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
  };
}

function buildCopyText(key: ReviewTab | "everything", summary: SummaryModel, result: ExtractionResult) {
  const sections = {
    overview: buildOverviewCopy(summary),
    color: buildColorCopy(result.tokens, summary),
    typography: buildTypographyCopy(summary),
    layout: buildLayoutCopy(summary),
    components: buildComponentsCopy(result.components, result.tokens),
    debug: buildDebugCopy(result)
  };

  if (key === "everything") {
    return buildPromptReadySpec(summary, result.tokens, result.components);
  }

  return sections[key];
}

function buildOverviewCopy(summary: SummaryModel) {
  return [
    "Overview",
    "- Measurements are normalized to likely source tokens. Do not treat raw computed CSS decimals as canonical spec values.",
    `- Most common fill: ${summary.primaryColor?.value ?? "Unknown"}`,
    `- Typefaces: ${summary.fontFamilies.length > 0 ? summary.fontFamilies.join(", ") : "Unknown"}`,
    `- Largest text: ${summary.h1 ? `${canonicalDimensionValue(summary.h1.fontSize)}px / ${canonicalDimensionValue(summary.h1.lineHeight)}px / ${summary.h1.fontWeight}` : "Unknown"}`,
    `- Body range: ${summary.body ? `${canonicalDimensionValue(summary.body.fontSize)}px / ${canonicalDimensionValue(summary.body.lineHeight)}px / ${summary.body.fontWeight}` : "Unknown"}`,
    `- Main component families: ${summary.componentFamilies.slice(0, 3).map((family) => family.type).join(", ") || "Unknown"}`
  ].join("\n");
}

function buildColorCopy(tokens: DesignTokens, summary: SummaryModel) {
  return [
    "Color",
    ...summary.colorGroups.primary.map((token) => `- Primary: ${token.name} = ${token.value}`),
    ...summary.colorGroups.neutral.map((token) => `- Neutral: ${token.name} = ${token.value}`),
    ...summary.colorGroups.accent.map((token) => `- Accent: ${token.name} = ${token.value}`)
  ].join("\n");
}

function buildTypographyCopy(summary: SummaryModel) {
  const lines = [
    "Typography",
    "- Values below are normalized to likely source tokens rather than copied from raw DevTools output."
  ];
  if (summary.fontFamilies.length > 0) {
    lines.push(`- Typefaces: ${summary.fontFamilies.join(", ")}`);
    for (const family of summary.fontFamilies) {
      const status = buildFontPreviewStatus(family);
      const alternatives = getFreeAlternatives(family);
      if (alternatives.length > 0) {
        lines.push(`  - ${family}: ${status.copyLabel} — free alternatives: ${alternatives.join(", ")}`);
      } else {
        lines.push(`  - ${family}: ${status.copyLabel}`);
      }
    }
  }
  if (summary.h1) lines.push(`- Largest: ${formatCanonicalTypographyToken(summary.h1).label}`);
  if (summary.h2) lines.push(`- 2nd Largest: ${formatCanonicalTypographyToken(summary.h2).label}`);
  if (summary.h3) lines.push(`- 3rd Largest: ${formatCanonicalTypographyToken(summary.h3).label}`);
  if (summary.body) lines.push(`- Body range (14-20px): ${formatCanonicalTypographyToken(summary.body).label}`);
  if (summary.caption) lines.push(`- Small text (<14px): ${formatCanonicalTypographyToken(summary.caption).label}`);
  return lines.join("\n");
}

interface OpenSourceFontDefinition {
  id: string;
  family: string;
  url: string;
}

const OPEN_SOURCE_FONT_REGISTRY: Record<string, OpenSourceFontDefinition> = {
  inter: {
    id: "inter",
    family: "Inter",
    url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  },
  sora: {
    id: "sora",
    family: "Sora",
    url: "https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap"
  },
  "ibm plex sans": {
    id: "ibm-plex-sans",
    family: "IBM Plex Sans",
    url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
  },
  "ibm plex serif": {
    id: "ibm-plex-serif",
    family: "IBM Plex Serif",
    url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:wght@400;500;600;700&display=swap"
  },
  "ibm plex mono": {
    id: "ibm-plex-mono",
    family: "IBM Plex Mono",
    url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap"
  }
};

const PAID_FONT_ALTERNATIVES: Record<string, string[]> = {
  "circular": ["Inter", "Plus Jakarta Sans", "Satoshi"],
  "circular std": ["Inter", "Plus Jakarta Sans", "Satoshi"],
  "sf pro": ["Inter", "Geist", "Outfit"],
  "sf pro display": ["Inter", "Geist", "Outfit"],
  "sf pro text": ["Inter", "Geist", "Outfit"],
  "gt walsheim": ["General Sans", "Satoshi", "DM Sans"],
  "gt walsheim pro": ["General Sans", "Satoshi", "DM Sans"],
  "proxima nova": ["Montserrat", "Nunito Sans", "Source Sans 3"],
  "graphik": ["Inter", "Manrope", "Switzer"],
  "neue haas grotesk": ["Inter", "DM Sans", "Outfit"],
  "neue haas grotesk display": ["Inter", "DM Sans", "Outfit"],
  "futura": ["Jost", "Poppins", "Nunito"],
  "futura pt": ["Jost", "Poppins", "Nunito"],
  "avenir": ["Nunito", "Outfit", "Plus Jakarta Sans"],
  "avenir next": ["Nunito", "Outfit", "Plus Jakarta Sans"],
  "gotham": ["Montserrat", "Raleway", "Outfit"],
  "gotham rounded": ["Nunito", "Varela Round", "Outfit"],
  "gilroy": ["Outfit", "Plus Jakarta Sans", "General Sans"],
  "apercu": ["DM Sans", "Karla", "Manrope"],
  "suisse int'l": ["Inter", "Switzer", "DM Sans"],
  "suisse intl": ["Inter", "Switzer", "DM Sans"],
  "brandon grotesque": ["Raleway", "Josefin Sans", "Nunito"],
  "neue montreal": ["General Sans", "Switzer", "Inter"],
  "acumin pro": ["Source Sans 3", "Open Sans", "Nunito Sans"],
  "freight sans": ["Libre Franklin", "Source Sans 3", "Nunito Sans"],
  "museo sans": ["Nunito Sans", "Open Sans", "Lato"],
  "din": ["DM Sans", "Barlow", "Roboto"],
  "din next": ["DM Sans", "Barlow", "Roboto"],
  "ff din": ["DM Sans", "Barlow", "Roboto"],
  "helvetica": ["Inter", "DM Sans", "Outfit"],
  "helvetica neue": ["Inter", "DM Sans", "Outfit"],
};

function getFreeAlternatives(family: string): string[] {
  const key = normalizeFontLookupKey(family);
  return PAID_FONT_ALTERNATIVES[key] ?? [];
}

function buildTypographyPreviewNote(family: string): string {
  return buildFontPreviewStatus(family).message;
}

function buildFontPreviewStatus(family: string): { message: string; copyLabel: string } {
  const definition = getOpenSourceFontDefinition(family);
  if (definition) {
    return {
      message: `${definition.family} is open source. This preview uses the actual font when it is available here.`,
      copyLabel: "open-source font, preview uses the real typeface when available"
    };
  }

  const alternatives = getFreeAlternatives(family);
  if (alternatives.length > 0) {
    return {
      message: `${family} may require a license. Free alternatives: ${alternatives.join(", ")}. Preview uses a fallback font.`,
      copyLabel: "may require license"
    };
  }

  return {
    message: `The typography shown here is not the site's actual font. ${family} is not verified open-source in this preview, so a fallback is used.`,
    copyLabel: "not verified open-source, preview is fallback only"
  };
}

function buildPreviewFontStack(family: string): string | undefined {
  const definition = getOpenSourceFontDefinition(family);
  if (!definition) {
    return undefined;
  }

  return `"${definition.family}", "${family}", sans-serif`;
}

function getOpenSourceFontDefinition(family: string): OpenSourceFontDefinition | undefined {
  const normalized = normalizeFontLookupKey(family);
  return OPEN_SOURCE_FONT_REGISTRY[normalized];
}

function normalizeFontLookupKey(family: string): string {
  return family
    .split(",")[0]
    .replace(/['"]/g, "")
    .replace(/\bvariable\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function buildLayoutCopy(_summary: SummaryModel) {
  return "Spacing & Layout — see extension for spacing scale, content width, and grid details.";
}

function buildPromptReadySpec(
  summary: SummaryModel,
  tokens: DesignTokens,
  components: ExtractedComponent[]
) {
  const lines = ["# Prompt-Ready Design Spec", ""];

  const themeParagraph = buildVisualThemeParagraph(summary, tokens, components);
  if (themeParagraph) {
    lines.push("## Visual Theme");
    lines.push(themeParagraph);
    lines.push("");
  }

  const colorLines = buildPromptReadyColorLines(summary);
  if (colorLines.length > 0) {
    lines.push("## Color System");
    lines.push(...colorLines);
    lines.push("");
  }

  const typographyLines = buildPromptReadyTypographyLines(summary);
  if (typographyLines.length > 0) {
    lines.push("## Typography");
    lines.push(...typographyLines);
    lines.push("");
  }

  const componentLines = buildPromptReadyComponentLines(summary, tokens, components);
  if (componentLines.length > 0) {
    lines.push("## Components");
    lines.push(...componentLines);
    lines.push("");
  }

  const layoutLines = buildPromptReadyLayoutLines(summary);
  if (layoutLines.length > 0) {
    lines.push("## Layout");
    lines.push(...layoutLines);
    lines.push("");
  }

  const doLines = buildPromptReadyDoLines(summary, components);
  if (doLines.length > 0) {
    lines.push("## Do");
    lines.push(...doLines);
    lines.push("");
  }

  const dontLines = buildPromptReadyDontLines(summary, components);
  if (dontLines.length > 0) {
    lines.push("## Don't");
    lines.push(...dontLines);
    lines.push("");
  }

  lines.push("## Build Guidance");
  lines.push(
    "Recreate the same visual system and component feel rather than cloning the original page literally. Keep the hierarchy, spacing rhythm, color roles, and action emphasis consistent."
  );
  lines.push(
    "Treat computed browser styles as evidence only. Canonicalize measurements back to source tokens or the nearest approved scale before documenting them."
  );

  return lines.join("\n");
}

function buildVisualThemeParagraph(
  summary: SummaryModel,
  tokens: DesignTokens,
  components: ExtractedComponent[]
) {
  const primary = summary.primaryColor ? describeColorMood(summary.primaryColor.value) : null;
  const font = summary.fontFamilies[0]?.split(",")[0].trim();
  const density = describeDensity(summary);
  const primaryButton = pickPrimaryButton(components);
  const representativeCard = pickRepresentativeCard(components);
  const emphasis = primaryButton ? describeButtonEmphasis(primaryButton) : null;
  const surface = representativeCard ? describeSurfaceFeel(representativeCard, tokens) : null;

  const sentences = [
    "A concise interface with a clear visual hierarchy and limited decorative noise.",
    [primary, font ? `${font}-led typography` : null, density].filter(Boolean).join(", ") + ".",
    [surface, emphasis].filter(Boolean).join(" ")
  ]
    .map((part) => part.trim())
    .filter((part) => part && part !== ".");

  return sentences.slice(0, 3).join(" ");
}

function buildPromptReadyColorLines(summary: SummaryModel) {
  const lines: string[] = [];
  const primary = summary.primaryColor;
  const neutralSurface = summary.colorGroups.neutral[0];
  const neutralText = summary.colorGroups.neutral[1];
  const accent = summary.colorGroups.accent[0];

  if (primary) {
    lines.push(`- Primary: ${formatColorToken(primary)} used for actions and highlights.`);
  }
  if (neutralSurface) {
    lines.push(`- Surface: ${formatColorToken(neutralSurface)} used for panels and quiet UI areas.`);
  }
  if (neutralText) {
    lines.push(`- Text/Muted: ${formatColorToken(neutralText)} used for body copy, strokes, or secondary content.`);
  }
  if (accent) {
    lines.push(`- Accent: ${formatColorToken(accent)} used sparingly for secondary emphasis.`);
  }

  return lines.slice(0, 4);
}

function buildPromptReadyTypographyLines(summary: SummaryModel) {
  const lines: string[] = [];
  const primaryFamily = summary.fontFamilies[0]?.split(",")[0].trim();

  if (primaryFamily) {
    lines.push(`- Primary typeface: ${primaryFamily}.`);
  }
  if (summary.h1) {
    const heading = formatCanonicalTypographyToken(summary.h1);
    lines.push(
      `- Heading style: ${heading.size}px / ${heading.lineHeight}px / weight ${summary.h1.fontWeight}.`
    );
  }
  if (summary.body) {
    const body = formatCanonicalTypographyToken(summary.body);
    lines.push(
      `- Body style: ${body.size}px / ${body.lineHeight}px / weight ${summary.body.fontWeight}.`
    );
  }
  if (summary.caption) {
    const caption = formatCanonicalTypographyToken(summary.caption);
    lines.push(`- Small text: ${caption.size}px / ${caption.lineHeight}px.`);
  }

  return lines.slice(0, 4);
}

function buildPromptReadyComponentLines(
  summary: SummaryModel,
  tokens: DesignTokens,
  components: ExtractedComponent[]
) {
  const lines: string[] = [];
  const primaryButton = pickPrimaryButton(components);
  const card = pickRepresentativeCard(components);

  if (primaryButton) {
    const padding = primaryButton.padding ?? primaryButton.autoLayout?.padding;
    const radius = primaryButton.cornerRadius !== undefined ? `${canonicalRadiusValue(primaryButton.cornerRadius)}px` : "fully rounded";
    const spacing = padding
      ? formatSpacingBox(padding, summary.layout.spacingScale)
      : "compact balanced padding";
    lines.push(
      `- Primary button: ${formatTreatment(primaryButton)} style with ${radius} corners and ${spacing}.`
    );
  }

  if (card) {
    lines.push(`- Surface/card: ${describeSurfaceFeel(card, tokens)}`);
  }

  const secondFamily = summary.componentFamilies.find(
    (family) => family.type !== "Button" && family.type !== "Card"
  );
  if (secondFamily) {
    lines.push(`- Repeated pattern: ${secondFamily.type.toLowerCase()} appears as a reusable supporting module.`);
  }

  return lines.slice(0, 4);
}

function buildPromptReadyLayoutLines(summary: SummaryModel) {
  const lines: string[] = [];

  if (summary.layout.contentWidth) {
    lines.push(`- Content width: around ${canonicalDimensionValue(summary.layout.contentWidth)}px.`);
  }
  if (summary.layout.spacingScale.length > 0) {
    lines.push(`- Spacing rhythm: mainly ${summary.layout.spacingScale.slice(0, 5).join(", ")}px.`);
  }
  lines.push(`- Density: ${describeDensity(summary)}.`);
  if (summary.layout.grid) {
    lines.push(`- Grid feel: structured ${summary.layout.grid.columns}-column layout with ${canonicalSpacingValue(summary.layout.grid.gap, summary.layout.spacingScale)}px gaps.`);
  }

  return lines.slice(0, 4);
}

function buildPromptReadyDoLines(summary: SummaryModel, components: ExtractedComponent[]) {
  const lines: string[] = [];
  const primary = summary.primaryColor ? colorToHex(summary.primaryColor.value) ?? summary.primaryColor.value : null;
  const primaryButton = pickPrimaryButton(components);

  if (primary) {
    lines.push(`- Use ${primary} primarily for high-emphasis actions and active states.`);
  }
  if (summary.layout.spacingScale[0]) {
    lines.push(`- Preserve the ${summary.layout.spacingScale[0]}px-based spacing rhythm across layouts and components.`);
  }
  if (summary.h1 && summary.body) {
    lines.push(`- Keep strong hierarchy between ${canonicalDimensionValue(summary.h1.fontSize)}px headings and ${canonicalDimensionValue(summary.body.fontSize)}px body copy.`);
  }
  const buttonStyles = new Set(components.filter((c) => c.type === "Button").map((c) => c.variants.style));
  if (primaryButton && buttonStyles.size > 1) {
    lines.push(`- Keep primary actions ${formatTreatment(primaryButton)} and visually more prominent than supporting actions.`);
  }

  return lines.slice(0, 4);
}

function buildPromptReadyDontLines(summary: SummaryModel, components: ExtractedComponent[]) {
  const lines: string[] = ["- Do not introduce extra accent colors or decorative effects beyond the extracted core palette."];
  const card = pickRepresentativeCard(components);

  if (card?.cornerRadius !== undefined) {
    lines.push(`- Do not make surfaces noticeably more rounded or sharper than the current ${canonicalRadiusValue(card.cornerRadius)}px card language.`);
  }
  if (summary.layout.spacingScale.length > 1) {
    lines.push("- Do not drift away from the extracted spacing rhythm with inconsistent one-off gaps.");
  }
  lines.push("- Do not add dashboard-like visual noise if the extracted system feels restrained and editorial.");

  return lines.slice(0, 4);
}

function formatColorToken(token: DesignTokens["colors"][number]) {
  return `${token.name} (${colorToHex(token.value) ?? token.value})`;
}

function describeColorMood(value: string) {
  const rgbMatch = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  const hex = colorToHex(value);
  let r = 0;
  let g = 0;
  let b = 0;

  if (hex) {
    r = Number.parseInt(hex.slice(1, 3), 16);
    g = Number.parseInt(hex.slice(3, 5), 16);
    b = Number.parseInt(hex.slice(5, 7), 16);
  } else if (rgbMatch) {
    r = Number(rgbMatch[1]);
    g = Number(rgbMatch[2]);
    b = Number(rgbMatch[3]);
  } else {
    return "one restrained accent color";
  }

  if (Math.abs(r - g) < 12 && Math.abs(g - b) < 12) {
    return "a mostly neutral palette";
  }

  if (b >= r && b >= g) return "cool blue-led accents";
  if (g >= r && g >= b) return "green-led accents";
  if (r >= g && g >= b) return "warm red-orange accents";
  if (r >= b && b >= g) return "magenta-purple accents";

  return "one restrained accent color";
}

function describeDensity(summary: SummaryModel) {
  const base = summary.layout.spacingScale[0];

  if (!base) return "balanced density";
  if (base <= 8) return "compact density";
  if (base >= 20) return "spacious density";
  return "balanced density";
}

function describeButtonEmphasis(component: ExtractedComponent) {
  if (component.variants.style === "fill") {
    return "Primary actions should feel solid and immediately visible.";
  }
  if (component.variants.style === "outline") {
    return "Actions should stay crisp and restrained rather than heavily filled.";
  }
  return "Actions should stay visually light unless emphasis is necessary.";
}

function describeSurfaceFeel(component: ExtractedComponent, tokens: DesignTokens) {
  const fill = tokens.colors.find((token) => component.tokens.fills.includes(token.id))?.value;
  const stroke = tokens.colors.find((token) => component.tokens.strokes.includes(token.id))?.value;
  const hasFill = Boolean(fill && fill !== "transparent" && fill !== "rgba(0, 0, 0, 0)");
  const hasStroke = Boolean(stroke && stroke !== "transparent" && stroke !== "rgba(0, 0, 0, 0)");

  if (hasFill && hasStroke) {
    return "Filled surfaces with a visible boundary and restrained separation.";
  }
  if (hasFill) {
    return "Filled surfaces with low visual noise and minimal extra ornament.";
  }
  if (hasStroke) {
    return "Outlined surfaces with light separation instead of heavy elevation.";
  }

  return "Minimal surfaces with subtle separation.";
}

function pickRepresentativeCard(components: ExtractedComponent[]) {
  return (
    components.find((component) => component.type === "Card" && component.variants.style === "fill") ??
    components.find((component) => component.type === "Card")
  );
}

function exportDesignMd(result: ExtractionResult, summary: SummaryModel): void {
  const md = buildDesignMd(result, summary);
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "design.md";
  a.click();
  URL.revokeObjectURL(url);
}

function buildDesignMd(result: ExtractionResult, summary: SummaryModel): string {
  const date = new Date().toISOString().split("T")[0];
  const lines: string[] = [];
  const curatedComponents = filterNonFooterComponents(result.components);

  lines.push("# Design System Spec");
  lines.push(`> Extracted: ${date}`);
  lines.push("> Values below are normalized to likely source tokens. Raw computed CSS may include subpixel rounding, transforms, or browser zoom artifacts.");
  lines.push("");
  lines.push("---");
  lines.push("");

  // ── Colors ──────────────────────────────────────────────────────────────
  lines.push("## Color Tokens");
  lines.push("");

  const { primary, neutral, accent } = summary.colorGroups;

  if (primary.length > 0) {
    lines.push("### Primary");
    for (const token of primary) {
      const hex = colorToHex(token.value) ?? token.value;
      const comment = token.role === "fill" ? "brand fill" : token.role === "text" ? "brand text" : "brand stroke";
      lines.push(`--${token.name}: ${hex}    /* ${comment} */`);
    }
    lines.push("");
  }

  if (neutral.length > 0) {
    lines.push("### Neutral");
    for (const token of neutral) {
      const hex = colorToHex(token.value) ?? token.value;
      lines.push(`--${token.name}: ${hex}`);
    }
    lines.push("");
  }

  if (accent.length > 0) {
    lines.push("### Accent");
    for (const token of accent) {
      const hex = colorToHex(token.value) ?? token.value;
      lines.push(`--${token.name}: ${hex}`);
    }
    lines.push("");
  }

  lines.push("---");
  lines.push("");

  // ── Typography ───────────────────────────────────────────────────────────
  lines.push("## Typography");
  lines.push("");

  if (summary.fontFamilies.length > 0) {
    lines.push(`Font: ${summary.fontFamilies.join(", ")}`);
    lines.push("");
  }

  const seenTypoIds = new Set<string>();
  const typographyScale = [
    summary.h1     ? { role: "display", token: summary.h1 }     : null,
    summary.h2     ? { role: "h2",      token: summary.h2 }     : null,
    summary.h3     ? { role: "h3",      token: summary.h3 }     : null,
    summary.body   ? { role: "body",    token: summary.body }   : null,
    summary.caption ? { role: "caption", token: summary.caption } : null,
  ].filter((entry): entry is NonNullable<typeof entry> => {
    if (!entry) return false;
    if (seenTypoIds.has(entry.token.id)) return false;
    seenTypoIds.add(entry.token.id);
    return true;
  });

  if (typographyScale.length > 0) {
    lines.push("| Token | Family | Size | Weight | Line Height (ratio) | Letter-spacing | Align |");
    lines.push("|-------|--------|------|--------|-------------|----------------|-------|");
    for (const { role, token } of typographyScale) {
      const canonicalType = formatCanonicalTypographyToken(token);
      lines.push(`| ${role} | ${token.fontFamily} | ${canonicalType.size}px (${(canonicalType.size / 16).toFixed(2)}rem) | ${token.fontWeight} | ${(canonicalType.lineHeight / canonicalType.size).toFixed(2)} | ${canonicalType.letterSpacing}px | ${token.textAlign ?? "left"} |`);
    }
    lines.push("");
  }

  lines.push("---");
  lines.push("");

  // ── Spacing & Layout ────────────────────────────────────────────────────
  lines.push("## Spacing & Layout");
  lines.push("");

  if (result.layout.spacingScale.length > 0) {
    lines.push(`Scale: ${result.layout.spacingScale.slice(0, 8).join(", ")}px`);
    lines.push("");
  }

  if (result.layout.contentWidth) lines.push(`--content-width: ${canonicalDimensionValue(result.layout.contentWidth)}px`);
  if (result.layout.pageMargin)   lines.push(`--page-margin: ${canonicalSpacingValue(result.layout.pageMargin, result.layout.spacingScale)}px`);
  if (result.layout.grid) {
    lines.push(`--grid-columns: ${result.layout.grid.columns}`);
    lines.push(`--grid-gap: ${canonicalSpacingValue(result.layout.grid.gap, result.layout.spacingScale)}px`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");

  // ── Components ──────────────────────────────────────────────────────────
  lines.push("## Components");
  lines.push("");

  const STYLE_PRIORITY: Record<string, number> = { fill: 0, outline: 1, ghost: 2 };
  const familyMap = new Map<string, ExtractedComponent[]>();
  for (const c of curatedComponents) {
    const list = familyMap.get(c.type) ?? [];
    list.push(c);
    familyMap.set(c.type, list);
  }

  // Pull Navigation + NavigationItem out for hierarchy rendering
  const mdNavBar = curatedComponents.find((c) => c.type === "Navigation");
  const mdNavItems = curatedComponents.filter((c) => c.type === "NavigationItem").slice(0, 3);
  familyMap.delete("Navigation");
  familyMap.delete("NavigationItem");

  // Pull Accordion out for states rendering
  const mdAccordions = curatedComponents.filter((c) => c.type === "Accordion");
  const mdAccordionClosed = mdAccordions.find((c) => c.variants.state === "default") ?? mdAccordions[0];
  const mdAccordionOpen = mdAccordions.find((c) => c !== mdAccordionClosed) ?? mdAccordions[1];
  familyMap.delete("Accordion");

  const families = [...familyMap.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5);

  const emitComponentSpecs = (rep: ExtractedComponent) => {
    const fillToken   = result.tokens.colors.find((t) => rep.tokens.fills.includes(t.id));
    const textToken   = result.tokens.colors.find((t) => rep.tokens.text.includes(t.id));
    const strokeToken = result.tokens.colors.find((t) => rep.tokens.strokes.includes(t.id));
    const typoToken   = result.tokens.typography.find((t) => rep.tokens.typography.includes(t.id));
    const pad         = rep.padding ?? rep.autoLayout?.padding;
    const fillHex     = fillToken ? (colorToHex(fillToken.value) ?? fillToken.value) : null;

    if (fillHex)                         lines.push(`  background: ${fillHex}`);
    // Skip text color if it resolves to the same value as the fill (extraction artifact)
    if (textToken) {
      const textHex = colorToHex(textToken.value) ?? textToken.value;
      if (textHex !== fillHex)           lines.push(`  color: ${textHex}`);
    }
    if (strokeToken)                     lines.push(`  border: 1px solid ${colorToHex(strokeToken.value) ?? strokeToken.value}`);
    if (rep.cornerRadius !== undefined)  lines.push(`  border-radius: ${canonicalRadiusValue(rep.cornerRadius)}px`);
    if (pad)                             lines.push(`  padding: ${formatSpacingBox(pad, result.layout.spacingScale)}`);
    if (typoToken) {
      const canonicalType = formatCanonicalTypographyToken(typoToken);
      lines.push(`  font: ${typoToken.fontFamily} ${canonicalType.size}px / ${typoToken.fontWeight}`);
    }
    if (rep.width)                       lines.push(`  width: ${canonicalDimensionValue(rep.width)}px`);
    if (rep.height)                      lines.push(`  height: ${canonicalDimensionValue(rep.height)}px`);
    if (rep.autoLayout?.gap)             lines.push(`  gap: ${canonicalSpacingValue(rep.autoLayout.gap, result.layout.spacingScale)}px`);
  };

  for (const [type, members] of families) {
    const sorted = [...members].sort((a, b) => {
      const styleDiff = (STYLE_PRIORITY[a.variants.style] ?? 9) - (STYLE_PRIORITY[b.variants.style] ?? 9);
      if (styleDiff !== 0) return styleDiff;
      if (a.variants.state === "default" && b.variants.state !== "default") return -1;
      if (b.variants.state === "default" && a.variants.state !== "default") return 1;
      return 0;
    });
    const rep = sorted[0];

    const roleDesc =
      type === "Button" && rep.variants.style === "fill"    ? "Primary CTA, highest visual priority" :
      type === "Button" && rep.variants.style === "outline" ? "Secondary action, lower visual weight" :
      type === "Button"                                     ? "Ghost action, minimal visual weight" :
      type === "Card"                                       ? "Content container" :
      type === "Input"                                      ? "Form text input" :
      type === "Modal"                                      ? "Overlay dialog" :
      type === "Badge"                                      ? "Status label" : "Component";

    const showStyle = type === "Button" || type === "Card";
    lines.push(`### ${type}${showStyle ? ` / ${formatTreatment(rep)}` : ""}`);
    lines.push(`Role: ${roleDesc}`);
    if (rep.textContent) lines.push(`Label: "${rep.textContent}"`);
    lines.push("");
    emitComponentSpecs(rep);
    lines.push("");
  }

  // Navigation hierarchy
  if (mdNavBar || mdNavItems.length > 0) {
    lines.push("### Navigation");
    lines.push("Role: Top navigation bar with link items");
    lines.push("");
    if (mdNavBar) {
      lines.push("  // Nav Container");
      emitComponentSpecs(mdNavBar);
    }
    if (mdNavItems.length > 0) {
      lines.push("  // Nav Items");
      for (const item of mdNavItems) {
        const typoToken = result.tokens.typography.find((t) => item.tokens.typography.includes(t.id));
        const textToken = result.tokens.colors.find((t) => item.tokens.text.includes(t.id));
        const itemPad = item.padding ?? item.autoLayout?.padding;
        const label = item.textContent ? `"${item.textContent}"` : item.source;
        const specs = [
          typoToken ? `font: ${typoToken.fontFamily} ${typoToken.fontSize}px / ${typoToken.fontWeight}` : null,
          textToken ? `color: ${colorToHex(textToken.value) ?? textToken.value}` : null,
          itemPad ? `padding: ${itemPad.top}px ${itemPad.right}px ${itemPad.bottom}px ${itemPad.left}px` : null
        ].filter(Boolean).join(", ");
        lines.push(`  ${label}${specs ? ` — ${specs}` : ""}`);
      }
    }
    lines.push("");
  }

  // Accordion states
  if (mdAccordionClosed || mdAccordionOpen) {
    lines.push("### Accordion");
    lines.push("Role: Expandable content section with collapsed and expanded states");
    lines.push("");
    if (mdAccordionClosed) {
      lines.push("  // Collapsed state");
      if (mdAccordionClosed.textContent) lines.push(`  label: "${mdAccordionClosed.textContent}"`);
      emitComponentSpecs(mdAccordionClosed);
    }
    if (mdAccordionOpen) {
      lines.push("  // Expanded state");
      if (mdAccordionOpen.textContent) lines.push(`  label: "${mdAccordionOpen.textContent}"`);
      emitComponentSpecs(mdAccordionOpen);
    }
    lines.push("");
  }

  // ── Agent Quick-Start ────────────────────────────────────────────────────
  const primaryHex = summary.primaryColor ? (colorToHex(summary.primaryColor.value) ?? summary.primaryColor.value) : null;
  const primaryFont = summary.fontFamilies[0]?.split(",")[0].trim() ?? null;
  const primaryButton = pickPrimaryButton(curatedComponents);
  const baseSpacing = result.layout.spacingScale[0] ?? null;

  const quickTokens: string[] = [];
  if (primaryHex) quickTokens.push(`Primary: ${primaryHex}`);
  if (primaryFont) quickTokens.push(`Font: ${primaryFont}`);
  if (primaryButton?.cornerRadius !== undefined) quickTokens.push(`Radius: ${canonicalRadiusValue(primaryButton.cornerRadius)}px`);
  if (baseSpacing) quickTokens.push(`Spacing: ${baseSpacing}px base`);

  if (quickTokens.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("## Agent Quick-Start");
    lines.push(quickTokens.join(" · "));
    lines.push("");
    const doLines = buildPromptReadyDoLines(summary, curatedComponents);
    const dontLines = buildPromptReadyDontLines(summary, curatedComponents);
    for (const line of doLines) lines.push(line);
    for (const line of dontLines) lines.push(line);
    lines.push("");
  }

  return lines.join("\n");
}

function buildComponentsCopy(components: ExtractedComponent[], tokens: DesignTokens) {
  const STYLE_PRIORITY: Record<string, number> = { fill: 0, outline: 1, ghost: 2 };
  const curatedComponents = filterNonFooterComponents(components);

  // Group by type and pick the best representative per family
  const familyMap = new Map<string, ExtractedComponent[]>();
  for (const c of curatedComponents) {
    const list = familyMap.get(c.type) ?? [];
    list.push(c);
    familyMap.set(c.type, list);
  }

  // Sort families by count descending, take top 6
  const families = [...familyMap.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 6);

  if (families.length === 0) return "Components\nNo components detected.";

  const lines: string[] = [
    "Components",
    "Measurements below are normalized to likely source tokens rather than copied verbatim from computed CSS."
  ];

  for (const [type, members] of families) {
    // Pick best representative: prefer fill + default state
    const sorted =
      type === "Button"
        ? [...members].sort((a, b) => scorePrimaryButton(b) - scorePrimaryButton(a))
        : [...members].sort((a, b) => {
            const styleDiff = (STYLE_PRIORITY[a.variants.style] ?? 9) - (STYLE_PRIORITY[b.variants.style] ?? 9);
            if (styleDiff !== 0) return styleDiff;
            if (a.variants.state === "default" && b.variants.state !== "default") return -1;
            if (b.variants.state === "default" && a.variants.state !== "default") return 1;
            return 0;
          });
    const rep = sorted[0];

    lines.push("");
    lines.push(`${type}`);
    if (rep.textContent && rep.textContent.trim().length <= 40) {
      lines.push(`  label: "${rep.textContent.trim()}"`);
    }

    // Style variant
    lines.push(`  treatment: ${formatTreatment(rep)}`);
    lines.push(`  size: ${rep.variants.size}`);

    // Dimensions
    if (rep.width || rep.height) {
      const dims = [
        rep.width ? `${canonicalDimensionValue(rep.width)}px wide` : null,
        rep.height ? `${canonicalDimensionValue(rep.height)}px tall` : null
      ].filter(Boolean).join(", ");
      lines.push(`  dimensions: ${dims}`);
    }

    // Padding
    const pad = rep.padding ?? rep.autoLayout?.padding;
    if (pad) {
      lines.push(`  padding: ${formatSpacingBox(pad)}`);
    }

    // Corner radius
    if (rep.cornerRadius !== undefined) {
      lines.push(`  border-radius: ${canonicalRadiusValue(rep.cornerRadius)}px`);
    }

    // Background color (fill token)
    const fillToken = tokens.colors.find((t) => rep.tokens.fills.includes(t.id));
    const fillHex = fillToken ? (colorToHex(fillToken.value) ?? fillToken.value) : null;
    if (fillHex) {
      lines.push(`  background: ${fillHex}`);
    }

    // Text color — skip if it resolves to the same value as the fill (extraction artifact)
    const textToken = tokens.colors.find((t) => rep.tokens.text.includes(t.id));
    if (textToken) {
      const hex = colorToHex(textToken.value) ?? textToken.value;
      if (hex !== fillHex) {
        lines.push(`  text-color: ${hex}`);
      }
    }

    // Typography
    const typoToken = tokens.typography.find((t) => rep.tokens.typography.includes(t.id));
    if (typoToken) {
      const canonicalType = formatCanonicalTypographyToken(typoToken);
      lines.push(`  font: ${typoToken.fontFamily}, ${canonicalType.size}px, weight ${typoToken.fontWeight}`);
    }

    // Border (stroke token)
    const strokeToken = tokens.colors.find((t) => rep.tokens.strokes.includes(t.id));
    if (strokeToken) {
      const hex = colorToHex(strokeToken.value);
      lines.push(`  border-color: ${hex ?? strokeToken.value}`);
    }

    // Layout direction
    if (rep.autoLayout) {
      const al = rep.autoLayout;
      const layoutParts = [`direction: ${al.direction}`];
      if (al.gap !== undefined) layoutParts.push(`gap: ${canonicalSpacingValue(al.gap)}px`);
      if (al.primaryAlignment) layoutParts.push(`align: ${al.primaryAlignment}`);
      lines.push(`  layout: ${layoutParts.join(", ")}`);
    }
  }

  return lines.join("\n");
}

function buildDebugCopy(result: ExtractionResult) {
  const rows = filterNonFooterComponents(result.components).map((component) => buildComponentDebugRow(component, result));
  if (rows.length === 0) {
    return "Debug\nNo components detected.";
  }

  const lines = [
    "Debug",
    "Computed browser values are observed evidence. Canonical values are the spec candidates."
  ];

  for (const row of rows) {
    lines.push("");
    lines.push(`${row.component.type}: ${row.component.source}`);
    if (row.component.textContent) lines.push(`  label: "${row.component.textContent}"`);
    for (const item of row.decision) lines.push(`  ${item.label}: ${item.value}`);
    for (const item of row.measurements) lines.push(`  ${item.label}: ${item.value}`);
    for (const item of row.tokens) lines.push(`  token ${item.label}: ${item.value}`);
    lines.push(`  warnings: ${row.warnings.length > 0 ? row.warnings.join(", ") : "none"}`);
  }

  return lines.join("\n");
}
