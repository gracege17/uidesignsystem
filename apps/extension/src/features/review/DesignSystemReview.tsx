import { useEffect, useMemo, useState } from "react";
import type { DesignTokens, ExtractedComponent, ExtractionResult, LayoutMetrics } from "@extractor/types";

const REVIEW_TABS = [
  { id: "overview", label: "Overview" },
  { id: "color", label: "Color" },
  { id: "typography", label: "Typography" },
  { id: "layout", label: "Spacing" },
  { id: "components", label: "Components" }
] as const;

type ReviewTab = (typeof REVIEW_TABS)[number]["id"];
type ThemeMode = "light" | "dark";
type HeroButtonSlotLabel = "Main CTA" | "Secondary CTA" | "Other Button";
type HeroButtonSlot = { label: HeroButtonSlotLabel; component?: ExtractedComponent };
type FilledHeroButtonSlot = { label: HeroButtonSlotLabel; component: ExtractedComponent };

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
    const text = buildCopyText(key, summary, result.tokens);
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
      <SectionShell title="Overview" subtitle="Key extracted foundations and primary signals." theme={theme} copyLabel="Copy Everything" copied={copiedKey === "everything"} onCopy={() => void copySection("everything")}>
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
      <SectionShell title="Overview" subtitle="Start here to identify the main design-system signals." theme={theme} copyLabel="Copy Everything" copied={copiedKey === "everything"} onCopy={() => void onCopy("everything")}>
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

  return (
    <SectionShell title="Components" subtitle="Curated gallery of the most repeated component families." theme={theme} copyLabel="Copy Components" copied={copiedKey === "components"} onCopy={() => void onCopy("components")}>
      <ComponentsSection result={result} summary={summary} theme={theme} />
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
              <p className={`text-[11px] ${ui.mutedText}`}>{bodyStyle.fontSize}px / {bodyStyle.fontWeight}</p>
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
            {group.items.map((token) => (
              <div key={token.id} className={`${ui.softPanel} overflow-hidden`}>
                <div className={`h-20 ${ui.rule}`} style={{ backgroundColor: token.value }} />
                <div className="p-4">
                  <p className={`text-sm font-semibold ${ui.headingText}`}>{token.name}</p>
                  <p className={`mt-1 text-xs ${ui.bodyText}`}>{token.value}</p>
                  <p className={`mt-2 truncate text-[11px] ${ui.mutedText}`}>{token.source}</p>
                </div>
              </div>
            ))}
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
            <div className={`mb-4 grid grid-cols-[minmax(0,1fr)_100px_100px_100px] gap-4 text-[11px] uppercase tracking-[0.18em] ${ui.mutedText}`}>
              <span>{role} — {token.fontFamily}</span>
              <span>Font Size</span>
              <span>Line Height</span>
              <span>Letter Space</span>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_100px_100px_100px] gap-4">
              <p
                className={`pr-6 ${ui.headingText}`}
                style={{
                  fontFamily: buildPreviewFontStack(token.fontFamily),
                  fontSize: `${Math.min(token.fontSize, 64)}px`,
                  lineHeight: `${Math.min(token.lineHeight, 72)}px`,
                  fontWeight: token.fontWeight,
                  letterSpacing: `${token.letterSpacing}px`,
                  textTransform: token.textTransform ?? "none"
                }}
              >
                The quick brown fox jumps over the lazy dog
              </p>
              <p className={`pt-2 text-sm ${ui.bodyText}`}>{token.fontSize}px</p>
              <p className={`pt-2 text-sm ${ui.bodyText}`}>{token.lineHeight}px</p>
              <p className={`pt-2 text-sm ${ui.bodyText}`}>{token.letterSpacing}px</p>
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
  const heroButtonSlots = pickHeroButtons(result.components);
  const visibleHeroButtons = heroButtonSlots.filter(
    (entry): entry is FilledHeroButtonSlot => Boolean(entry.component)
  );

  // Pick the best Card representative (fill > outline > ghost)
  const baseCard =
    result.components.find((c) => c.type === "Card" && c.variants.style === "fill") ??
    result.components.find((c) => c.type === "Card");

  // For non-Button, non-Card families, pick the best fill representative
  const otherCurated = summary.componentFamilies
    .filter((family) => family.type !== "Button" && family.type !== "Card")
    .map((family) => {
      const matches = result.components.filter((c) => c.type === family.type);
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
        if (fillType) specs.push({ label: "Font", value: `${fillType.fontFamily} · ${fillType.fontSize}px · ${fillType.fontWeight}` });
        if (fillPad) specs.push({ label: "Space", value: `${fillPad.top} · ${fillPad.right} · ${fillPad.bottom} · ${fillPad.left} px` });
        if (fillComponent.cornerRadius !== undefined) specs.push({ label: "Corner", value: `${fillComponent.cornerRadius}px` });
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
        if (cardType) cardSpecs.push({ label: "Font", value: `${cardType.fontFamily} · ${cardType.fontSize}px · ${cardType.fontWeight}` });
        if (cardPad) cardSpecs.push({ label: "Padding", value: `${cardPad.top} · ${cardPad.right} · ${cardPad.bottom} · ${cardPad.left} px` });
        if (baseCard.cornerRadius !== undefined) cardSpecs.push({ label: "Corner", value: `${baseCard.cornerRadius}px` });
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

      {visibleHeroButtons.length === 0 && !baseCard && otherCurated.length === 0 ? <EmptyState message="No curated component families were found." theme={theme} /> : null}
      </div>
    </div>
  );
}

function pickPrimaryButton(components: ExtractedComponent[]): ExtractedComponent | undefined {
  const buttons = components.filter((component) => component.type === "Button");
  if (buttons.length === 0) {
    return undefined;
  }

  const defaultButtons = buttons.filter((component) => component.variants.state === "default");
  const pool = defaultButtons.length > 0 ? defaultButtons : buttons;
  const fillButtons = pool.filter((component) => component.variants.style === "fill");
  const prioritized = fillButtons.length > 0 ? fillButtons : pool;

  return [...prioritized].sort((left, right) => scorePrimaryButton(right) - scorePrimaryButton(left))[0];
}

function pickHeroButtons(components: ExtractedComponent[]): HeroButtonSlot[] {
  const buttons = components.filter((component) => component.type === "Button");
  if (buttons.length === 0) {
    return [];
  }

  const defaultButtons = buttons.filter((component) => component.variants.state === "default");
  const statePool = defaultButtons.length > 0 ? defaultButtons : buttons;
  const ranked = [...statePool].sort((left, right) => scorePrimaryButton(right) - scorePrimaryButton(left));

  const mainCta = ranked.find((component) => component.variants.style === "fill") ?? ranked[0];
  const remainingAfterMain = ranked.filter((component) => component.id !== mainCta?.id);

  const secondaryCta =
    remainingAfterMain.find((component) => component.variants.style === "outline") ??
    remainingAfterMain[0];
  const remainingAfterSecondary = remainingAfterMain.filter(
    (component) => component.id !== secondaryCta?.id
  );
  const otherButton = remainingAfterSecondary[0];

  return [
    { label: "Main CTA", component: mainCta },
    { label: "Secondary CTA", component: secondaryCta },
    { label: "Other Button", component: otherButton }
  ];
}

function scorePrimaryButton(component: ExtractedComponent): number {
  let score = 0;

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

  // Buttons higher on the page are more likely to be the primary CTA.
  // pageY 0-200 covers nav + hero; 200-700 covers above-the-fold content.
  if (component.pageY !== undefined) {
    if (component.pageY <= 200) {
      score += 80;
    } else if (component.pageY <= 700) {
      score += 50;
    } else if (component.pageY <= 1400) {
      score += 20;
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

  const label = component.textContent?.trim() ?? "";
  if (label.length > 0) {
    score += Math.min(label.length, 24);
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
      subtitle: "Container · padding · gap",
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

  return {
    title: component.type,
    subtitle: `${component.variants.style} · ${component.variants.size} · ${component.variants.state}`,
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
  const paddingStyle = padding
    ? {
        paddingTop: `${padding.top}px`,
        paddingRight: `${padding.right}px`,
        paddingBottom: `${padding.bottom}px`,
        paddingLeft: `${padding.left}px`
      }
    : { padding: "10px 20px" };

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
    const borderRadius = component.cornerRadius !== undefined ? `${component.cornerRadius}px` : "9999px";
    const pad = component.padding ?? component.autoLayout?.padding;
    const specs: { label: string; value: string }[] = [];
    if (type) specs.push({ label: "Font", value: `${type.fontFamily} · ${type.fontSize}px · ${type.fontWeight}` });
    if (pad) specs.push({ label: "Space", value: `${pad.top} · ${pad.right} · ${pad.bottom} · ${pad.left} px` });
    if (component.cornerRadius !== undefined) specs.push({ label: "Corner", value: `${component.cornerRadius}px` });
    specs.push({ label: "Size", value: component.variants.size });
    return (
      <div className="space-y-4">
        <button
          type="button"
          className={`w-fit ${variantStyle === "ghost" ? "border-0" : "border"}`}
          style={{ ...style, borderRadius }}
        >
          Button
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
    if (pad) specs.push({ label: "Padding", value: `${pad.top} · ${pad.right} · ${pad.bottom} · ${pad.left} px` });
    if (component.cornerRadius !== undefined) specs.push({ label: "Corner", value: `${component.cornerRadius}px` });
    if (type) specs.push({ label: "Font", value: `${type.fontFamily} · ${type.fontSize}px · ${type.fontWeight}` });
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
    if (type) specs.push({ label: "Font", value: `${type.fontFamily} · ${type.fontSize}px · ${type.fontWeight}` });
    if (pad) specs.push({ label: "Space", value: `${pad.top} · ${pad.right} · ${pad.bottom} · ${pad.left} px` });
    if (component.cornerRadius !== undefined) specs.push({ label: "Corner", value: `${component.cornerRadius}px` });
    if (component.autoLayout?.gap) specs.push({ label: "Gap", value: `${component.autoLayout.gap}px` });

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
    const label = component.textContent?.trim() || "Overview";
    const specs: { label: string; value: string }[] = [];
    if (type) specs.push({ label: "Font", value: `${type.fontFamily} · ${type.fontSize}px · ${type.fontWeight}` });
    if (pad) specs.push({ label: "Space", value: `${pad.top} · ${pad.right} · ${pad.bottom} · ${pad.left} px` });
    if (component.cornerRadius !== undefined) specs.push({ label: "Corner", value: `${component.cornerRadius}px` });

    return (
      <div className="space-y-4">
        <a
          href="#"
          className="inline-block text-sm"
          onClick={(e) => e.preventDefault()}
          style={{
            backgroundColor: itemBg === "transparent" ? undefined : itemBg,
            color: itemText,
            fontFamily: type ? `"${type.fontFamily}", sans-serif` : undefined,
            fontSize: type ? `${Math.min(type.fontSize, 16)}px` : undefined,
            fontWeight: type?.fontWeight,
            borderRadius: component.cornerRadius !== undefined ? `${component.cornerRadius}px` : undefined,
            ...(pad
              ? { paddingTop: `${pad.top}px`, paddingRight: `${pad.right}px`, paddingBottom: `${pad.bottom}px`, paddingLeft: `${pad.left}px` }
              : { padding: "8px 12px" }),
            textDecoration: "none"
          }}
        >
          {label}
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
    if (type) specs.push({ label: "Font", value: `${type.fontFamily} · ${type.fontSize}px · ${type.fontWeight}` });
    if (pad) specs.push({ label: "Space", value: `${pad.top} · ${pad.right} · ${pad.bottom} · ${pad.left} px` });
    if (component.cornerRadius !== undefined) specs.push({ label: "Corner", value: `${component.cornerRadius}px` });

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
    if (type) specs.push({ label: "Font", value: `${type.fontFamily} · ${type.fontSize}px · ${type.fontWeight}` });
    if (pad) specs.push({ label: "Space", value: `${pad.top} · ${pad.right} · ${pad.bottom} · ${pad.left} px` });
    if (component.cornerRadius !== undefined) specs.push({ label: "Corner", value: `${component.cornerRadius}px` });
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
    if (type) specs.push({ label: "Font", value: `${type.fontFamily} · ${type.fontSize}px · ${type.fontWeight}` });
    if (pad) specs.push({ label: "Space", value: `${pad.top} · ${pad.right} · ${pad.bottom} · ${pad.left} px` });
    if (component.cornerRadius !== undefined) specs.push({ label: "Corner", value: `${component.cornerRadius}px` });
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
  onCopy
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  theme: ThemeMode;
  copyLabel: string;
  copied: boolean;
  onCopy: () => void;
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
          <button type="button" onClick={onCopy} className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${ui.copyButton}`}>
            {copied ? "Copied" : copyLabel}
          </button>
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
}

function buildSummary(result: ExtractionResult): SummaryModel {
  const typography = [...result.tokens.typography].sort((left, right) => right.fontSize - left.fontSize);
  const fontFamilies = [...new Set(typography.map((t) => t.fontFamily))];
  const body = [...result.tokens.typography]
    .filter((token) => token.fontSize >= 14 && token.fontSize <= 20)
    .sort((left, right) => Math.abs(left.fontSize - 16) - Math.abs(right.fontSize - 16))[0];
  const caption = [...result.tokens.typography]
    .filter((token) => token.fontSize < 14)
    .sort((left, right) => right.fontSize - left.fontSize)[0];
  // Headings must be > 20px so they never overlap with body or caption
  const headings = typography.filter((token) => token.fontSize > 20);
  const primaryColors = result.tokens.colors.filter(
    (token) => (token.role === "fill" || token.role === "text") && !isNeutralColor(token.value)
  );
  const neutralColors = result.tokens.colors.filter((token) => isNeutralColor(token.value));
  const accentColors = result.tokens.colors.filter(
    (token) => !primaryColors.includes(token) && !neutralColors.includes(token)
  );
  const familyCounts = result.components.reduce<Record<string, number>>((accumulator, component) => {
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
    }
  };
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

function buildCopyText(key: ReviewTab | "everything", summary: SummaryModel, tokens: DesignTokens) {
  const sections = {
    overview: buildOverviewCopy(summary),
    color: buildColorCopy(tokens, summary),
    typography: buildTypographyCopy(summary),
    layout: buildLayoutCopy(summary),
    components: buildComponentsCopy(summary)
  };

  if (key === "everything") {
    return [
      "Design System Summary",
      "",
      sections.overview,
      "",
      sections.color,
      "",
      sections.typography,
      "",
      sections.layout,
      "",
      sections.components
    ].join("\n");
  }

  return sections[key];
}

function buildOverviewCopy(summary: SummaryModel) {
  return [
    "Overview",
    `- Most common fill: ${summary.primaryColor?.value ?? "Unknown"}`,
    `- Typefaces: ${summary.fontFamilies.length > 0 ? summary.fontFamilies.join(", ") : "Unknown"}`,
    `- Largest text: ${summary.h1 ? `${summary.h1.fontSize}px / ${summary.h1.lineHeight}px / ${summary.h1.fontWeight}` : "Unknown"}`,
    `- Body range: ${summary.body ? `${summary.body.fontSize}px / ${summary.body.lineHeight}px / ${summary.body.fontWeight}` : "Unknown"}`,
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
  const lines = ["Typography"];
  if (summary.fontFamilies.length > 0) {
    lines.push(`- Typefaces: ${summary.fontFamilies.join(", ")}`);
    for (const family of summary.fontFamilies) {
      const status = buildFontPreviewStatus(family);
      lines.push(`  - ${family}: ${status.copyLabel}`);
    }
  }
  if (summary.h1) lines.push(`- Largest: ${summary.h1.fontSize}px / ${summary.h1.lineHeight}px / weight ${summary.h1.fontWeight} / ls ${summary.h1.letterSpacing}px`);
  if (summary.h2) lines.push(`- 2nd Largest: ${summary.h2.fontSize}px / ${summary.h2.lineHeight}px / weight ${summary.h2.fontWeight} / ls ${summary.h2.letterSpacing}px`);
  if (summary.h3) lines.push(`- 3rd Largest: ${summary.h3.fontSize}px / ${summary.h3.lineHeight}px / weight ${summary.h3.fontWeight} / ls ${summary.h3.letterSpacing}px`);
  if (summary.body) lines.push(`- Body range (14-20px): ${summary.body.fontSize}px / ${summary.body.lineHeight}px / weight ${summary.body.fontWeight} / ls ${summary.body.letterSpacing}px`);
  if (summary.caption) lines.push(`- Small text (<14px): ${summary.caption.fontSize}px / ${summary.caption.lineHeight}px / weight ${summary.caption.fontWeight} / ls ${summary.caption.letterSpacing}px`);
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

function buildComponentsCopy(summary: SummaryModel) {
  return [
    "Components",
    ...summary.componentFamilies.slice(0, 6).map((family) => `- ${family.type}: ${family.count} detected variant${family.count !== 1 ? "s" : ""}`)
  ].join("\n");
}
