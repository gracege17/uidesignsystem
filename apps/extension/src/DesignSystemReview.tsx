import { useMemo, useState } from "react";
import type { DesignTokens, ExtractedComponent, ExtractionResult } from "@extractor/types";

const REVIEW_TABS = [
  { id: "overview", label: "Overview" },
  { id: "color", label: "Color" },
  { id: "typography", label: "Typography" },
  { id: "layout", label: "Grids" },
  { id: "components", label: "Components" }
] as const;

type ReviewTab = (typeof REVIEW_TABS)[number]["id"];
type ThemeMode = "light" | "dark";

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
    const text = buildCopyText(key, summary);
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
        <OverviewSection summary={summary} theme={theme} />
      </SectionShell>
      <SectionShell title="Color Styles" subtitle="Starter color styles extracted from the page." theme={theme} copyLabel="Copy Color" copied={copiedKey === "color"} onCopy={() => void copySection("color")}>
        <ColorSection tokens={result.tokens} summary={summary} theme={theme} />
      </SectionShell>
      <SectionShell title="Typography" subtitle="Likely display, heading, and body styles." theme={theme} copyLabel="Copy Typography" copied={copiedKey === "typography"} onCopy={() => void copySection("typography")}>
        <TypographySection tokens={result.tokens} summary={summary} theme={theme} />
      </SectionShell>
      <SectionShell title="Grid & Layout" subtitle="Common layout patterns and spacing primitives." theme={theme} copyLabel="Copy Layout" copied={copiedKey === "layout"} onCopy={() => void copySection("layout")}>
        <LayoutSection components={result.components} summary={summary} theme={theme} />
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
        <OverviewSection summary={summary} theme={theme} />
      </SectionShell>
    );
  }

  if (tab === "color") {
    return (
      <SectionShell title="Color Styles" subtitle="Grouped color styles with primary and supporting tokens." theme={theme} copyLabel="Copy Color" copied={copiedKey === "color"} onCopy={() => void onCopy("color")}>
        <ColorSection tokens={result.tokens} summary={summary} theme={theme} />
      </SectionShell>
    );
  }

  if (tab === "typography") {
    return (
      <SectionShell title="Typography" subtitle="Likely display, heading, and body specimens." theme={theme} copyLabel="Copy Typography" copied={copiedKey === "typography"} onCopy={() => void onCopy("typography")}>
        <TypographySection tokens={result.tokens} summary={summary} theme={theme} />
      </SectionShell>
    );
  }

  if (tab === "layout") {
    return (
      <SectionShell title="Grid & Layout" subtitle="Visual layout primitives instead of raw auto-layout metadata." theme={theme} copyLabel="Copy Layout" copied={copiedKey === "layout"} onCopy={() => void onCopy("layout")}>
        <LayoutSection components={result.components} summary={summary} theme={theme} />
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
  summary,
  theme
}: {
  summary: SummaryModel;
  theme: ThemeMode;
}) {
  const ui = getThemeClasses(theme);

  return (
    <div className="space-y-8">
      <div className={`border-t pt-8 ${ui.rule}`}>
        <div className="grid gap-4 md:grid-cols-3">
          <OverviewCard label="Primary Color" value={summary.primaryColor?.name ?? "Not found"} detail={summary.primaryColor?.value ?? "No dominant color yet"} theme={theme} />
          <OverviewCard
            label={summary.fontFamilies.length > 1 ? "Typefaces" : "Typeface"}
            value={summary.fontFamilies.length > 0 ? summary.fontFamilies.join(" / ") : "Not found"}
            detail={summary.fontFamilies.length > 1 ? "Paired typeface system" : (summary.mainTypography ? `${summary.mainTypography.fontSize}px / ${summary.mainTypography.lineHeight}px` : "No dominant text style yet")}
            theme={theme}
          />
          <OverviewCard label="Top Family" value={summary.componentFamilies[0]?.type ?? "Not found"} detail={summary.componentFamilies[0] ? `${summary.componentFamilies[0].count} instances` : "No repeated family yet"} theme={theme} />
        </div>
      </div>

      <div className={`grid gap-4 md:grid-cols-2`}>
        <div className={`p-6 ${ui.softPanel}`}>
          <p className={`text-[11px] uppercase tracking-[0.22em] ${ui.mutedText}`}>Designer Questions</p>
          <div className={`mt-4 space-y-3 text-sm ${ui.bodyText}`}>
            <p>Primary color: <span className={ui.strongText}>{summary.primaryColor?.value ?? "Unknown"}</span></p>
            <p>H1 candidate: <span className={ui.strongText}>{summary.h1 ? `${summary.h1.fontFamily} ${summary.h1.fontSize}px / ${summary.h1.fontWeight}` : "Unknown"}</span></p>
            <p>Body style: <span className={ui.strongText}>{summary.body ? `${summary.body.fontFamily} ${summary.body.fontSize}px / ${summary.body.fontWeight}` : "Unknown"}</span></p>
            <p>Main component families: <span className={ui.strongText}>{summary.componentFamilies.slice(0, 3).map((family) => family.type).join(", ") || "Unknown"}</span></p>
          </div>
        </div>

        <div className={`p-6 ${ui.softPanel}`}>
          <p className={`text-[11px] uppercase tracking-[0.22em] ${ui.mutedText}`}>System Snapshot</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniMetric label="Colors" value={summary.counts.colors} theme={theme} />
            <MiniMetric label="Typography" value={summary.counts.typography} theme={theme} />
            <MiniMetric label="Layouts" value={summary.counts.layouts} theme={theme} />
            <MiniMetric label="Components" value={summary.counts.components} theme={theme} />
          </div>
        </div>
      </div>
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
  const scale: Array<{ role: string; token: NonNullable<typeof summary.h1> }> = [
    summary.h1 ? { role: "H1", token: summary.h1 } : null,
    summary.h2 ? { role: "H2", token: summary.h2 } : null,
    summary.h3 ? { role: "H3", token: summary.h3 } : null,
    summary.body ? { role: "Body", token: summary.body } : null,
    summary.caption ? { role: "Caption", token: summary.caption } : null,
  ].filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  return (
    <div className="space-y-8">
      <div className="space-y-0">
        {summary.fontFamilies.map((family, index) => (
          <div key={family} className={`${ui.heroPanel} ${index > 0 ? "mt-4" : ""}`}>
            <p className={`text-[11px] uppercase tracking-[0.22em] ${ui.heroMetaText}`}>{family}</p>
            <div className={`mt-6 space-y-3 ${ui.heroBodyText}`} style={{ fontFamily: `"${family}", sans-serif` }}>
              <p className="text-2xl tracking-wide">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
              <p className="text-2xl tracking-wide">abcdefghijklmnopqrstuvwxyz</p>
              <p className="text-2xl tracking-wide">0123456789</p>
              <p className="text-2xl tracking-wide">!@#$%^&*()</p>
            </div>
          </div>
        ))}
        {summary.fontFamilies.length === 0 && (
          <div className={`${ui.heroPanel}`}>
            <p className={`text-[11px] uppercase tracking-[0.22em] ${ui.heroMetaText}`}>Typeface</p>
            <h2 className={`mt-3 text-5xl font-semibold tracking-tight ${ui.heroHeadingText}`}>Typography</h2>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {scale.map(({ role, token }) => (
          <div key={token.id} className={`border-t pt-6 ${ui.rule}`}>
            <div className={`mb-4 grid grid-cols-[minmax(0,1fr)_100px_100px] gap-4 text-[11px] uppercase tracking-[0.18em] ${ui.mutedText}`}>
              <span>{role} — {token.fontFamily}</span>
              <span>Font Size</span>
              <span>Line Height</span>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_100px_100px] gap-4">
              <p
                className={`pr-6 ${ui.headingText}`}
                style={{
                  fontFamily: `"${token.fontFamily}", sans-serif`,
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
            </div>
          </div>
        ))}
      </div>

      {scale.length === 0 ? <EmptyState message="No clear typography scale was found." theme={theme} /> : null}
    </div>
  );
}

function LayoutSection({
  components,
  summary,
  theme
}: {
  components: ExtractedComponent[];
  summary: SummaryModel;
  theme: ThemeMode;
}) {
  const ui = getThemeClasses(theme);
  const layouts = summary.layoutPatterns.slice(0, 6);

  return (
    <div className="space-y-8">
      <div className={`p-8 ${ui.heroPanel}`}>
        <p className={`text-[11px] uppercase tracking-[0.22em] ${ui.heroMetaText}`}>Desktop</p>
        <h2 className={`mt-3 text-5xl font-semibold tracking-tight ${ui.heroHeadingText}`}>Grid & Layout</h2>
        <div className={`mt-6 space-y-2 text-sm ${ui.heroBodyText}`}>
          <p>{summary.gridColumns} common repeated layout groups</p>
          <p>{summary.layoutPatterns[0] ? `typical gap ${summary.layoutPatterns[0].gap}px` : "gap not detected"}</p>
          <p>{components.filter((component) => component.autoLayout).length} spaced layout candidates</p>
        </div>
      </div>

      <div className="space-y-4">
        {layouts.map((pattern, index) => (
          <div key={`${pattern.direction}-${pattern.gap}-${index}`} className={`border-t pt-4 ${ui.rule}`}>
            <div className={`mb-2 flex items-center justify-between text-sm ${ui.bodyText}`}>
              <span>{pattern.columns} columns</span>
              <span>{pattern.direction} · gap {pattern.gap}</span>
            </div>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${pattern.columns}, minmax(0, 1fr))` }}>
              {Array.from({ length: pattern.columns }).map((_, columnIndex) => (
                <div key={columnIndex} className={`${ui.gridCell} py-3 text-center text-sm`}>
                  {pattern.columns === 1 ? "1" : `${columnIndex + 1}`}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {layouts.length === 0 ? <EmptyState message="No strong layout patterns were found." theme={theme} /> : null}
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
  const curated = summary.componentFamilies
    .map((family) => result.components.find((component) => component.type === family.type))
    .filter((component): component is ExtractedComponent => Boolean(component))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
      {curated.map((component) => (
        <div key={component.id} className={`${ui.softPanel} p-5`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={`text-sm font-semibold ${ui.headingText}`}>{component.type}</p>
              <p className={`mt-1 text-xs ${ui.bodyText}`}>
                {component.variants.style} · {component.variants.size} · {component.variants.state}
              </p>
            </div>
            <span className={`text-[11px] uppercase tracking-[0.18em] ${ui.mutedText}`}>{component.name}</span>
          </div>

          <div className={`mt-4 p-4 ${ui.previewPanel}`}>
            <ComponentPreview component={component} tokens={result.tokens} theme={theme} />
          </div>
        </div>
      ))}

      {curated.length === 0 ? <EmptyState message="No curated component families were found." theme={theme} /> : null}
      </div>
    </div>
  );
}

function ComponentPreview({
  component,
  tokens,
  theme
}: {
  component: ExtractedComponent;
  tokens: DesignTokens;
  theme: ThemeMode;
}) {
  const fill = tokens.colors.find((token) => component.tokens.fills.includes(token.id))?.value;
  const stroke = tokens.colors.find((token) => component.tokens.strokes.includes(token.id))?.value;
  const text = tokens.colors.find((token) => component.tokens.text.includes(token.id))?.value;
  const type = tokens.typography.find((token) => component.tokens.typography.includes(token.id));
  const resolvedBackground = fill ?? (theme === "light" ? "#ffffff" : "#0f172a");
  const resolvedBorder = stroke ?? (theme === "light" ? "#d4d4d8" : "#334155");
  const previewTextColor = getReadableTextColor(resolvedBackground, text, theme);

  const style = {
    backgroundColor: resolvedBackground,
    borderColor: resolvedBorder,
    color: previewTextColor,
    fontFamily: type ? `"${type.fontFamily}", sans-serif` : undefined,
    fontSize: type ? `${Math.min(type.fontSize, 18)}px` : undefined,
    fontWeight: type?.fontWeight
  };

  if (component.type === "Button" || component.type === "Badge") {
    return (
      <button type="button" className="rounded-full border px-5 py-2.5 text-sm" style={style}>
        {component.type}
      </button>
    );
  }

  if (component.type === "Navigation") {
    return (
      <div className="flex items-center gap-4 rounded-full border px-5 py-3 text-sm" style={style}>
        <span>Overview</span>
        <span className="opacity-60">Pricing</span>
        <span className="opacity-60">Docs</span>
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

function OverviewCard({
  label,
  value,
  detail,
  theme
}: {
  label: string;
  value: string;
  detail: string;
  theme: ThemeMode;
}) {
  const ui = getThemeClasses(theme);
  return (
    <div className={`${ui.softPanel} p-5`}>
      <p className={`text-[11px] uppercase tracking-[0.22em] ${ui.mutedText}`}>{label}</p>
      <p className={`mt-3 text-xl font-semibold ${ui.headingText}`}>{value}</p>
      <p className={`mt-2 text-sm ${ui.bodyText}`}>{detail}</p>
    </div>
  );
}

function MiniMetric({ label, value, theme }: { label: string; value: number; theme: ThemeMode }) {
  const ui = getThemeClasses(theme);
  return (
    <div className={`${ui.metricPanel} p-4`}>
      <p className={`text-[10px] uppercase tracking-[0.2em] ${ui.mutedText}`}>{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${ui.headingText}`}>{value}</p>
    </div>
  );
}

function EmptyState({ message, theme }: { message: string; theme: ThemeMode }) {
  const ui = getThemeClasses(theme);
  return <div className={`${ui.softPanel} p-5 text-sm ${ui.mutedText}`}>{message}</div>;
}


interface SummaryModel {
  counts: {
    colors: number;
    typography: number;
    layouts: number;
    components: number;
  };
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
  layoutPatterns: Array<{ columns: number; gap: number; direction: string }>;
  gridColumns: number;
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
  const layoutPatterns = result.components
    .filter((component) => component.autoLayout)
    .map((component) => ({
      columns: inferColumns(component),
      gap: component.autoLayout?.gap ?? 0,
      direction: component.autoLayout?.direction ?? "horizontal"
    }))
    .sort((left, right) => right.columns - left.columns || right.gap - left.gap)
    .slice(0, 6);

  return {
    counts: {
      colors: result.tokens.colors.length,
      typography: result.tokens.typography.length,
      layouts: result.components.filter((component) => component.autoLayout).length,
      components: result.components.length
    },
    primaryColor: primaryColors[0] ?? result.tokens.colors[0],
    mainTypography: typography[0] ?? body,
    fontFamilies,
    h1: typography[0],
    h2: typography[1],
    h3: typography[2],
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
    layoutPatterns,
    gridColumns: layoutPatterns[0]?.columns ?? 0
  };
}

function inferColumns(component: ExtractedComponent) {
  const gap = component.autoLayout?.gap ?? 0;
  if (gap >= 48) return 12;
  if (gap >= 24) return 6;
  if (gap >= 12) return 4;
  if (gap > 0) return 3;
  return 1;
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

function buildCopyText(key: ReviewTab | "everything", summary: SummaryModel) {
  const sections = {
    overview: buildOverviewCopy(summary),
    color: buildColorCopy(summary),
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
    `- Primary color: ${summary.primaryColor?.value ?? "Unknown"}`,
    `- Typefaces: ${summary.fontFamilies.length > 0 ? summary.fontFamilies.join(", ") : "Unknown"}`,
    `- H1 candidate: ${summary.h1 ? `${summary.h1.fontSize}px / ${summary.h1.lineHeight}px / ${summary.h1.fontWeight}` : "Unknown"}`,
    `- Body style: ${summary.body ? `${summary.body.fontSize}px / ${summary.body.lineHeight}px / ${summary.body.fontWeight}` : "Unknown"}`,
    `- Main component families: ${summary.componentFamilies.slice(0, 3).map((family) => family.type).join(", ") || "Unknown"}`
  ].join("\n");
}

function buildColorCopy(summary: SummaryModel) {
  return [
    "Color",
    ...summary.colorGroups.primary.map((token) => `- Primary: ${token.name} = ${token.value}`),
    ...summary.colorGroups.neutral.map((token) => `- Neutral: ${token.name} = ${token.value}`),
    ...summary.colorGroups.accent.map((token) => `- Accent: ${token.name} = ${token.value}`)
  ].join("\n");
}

function buildTypographyCopy(summary: SummaryModel) {
  const lines = ["Typography"];
  if (summary.fontFamilies.length > 0) lines.push(`- Typefaces: ${summary.fontFamilies.join(", ")}`);
  if (summary.h1) lines.push(`- H1: ${summary.h1.fontSize}px / ${summary.h1.lineHeight}px / weight ${summary.h1.fontWeight}`);
  if (summary.h2) lines.push(`- H2: ${summary.h2.fontSize}px / ${summary.h2.lineHeight}px / weight ${summary.h2.fontWeight}`);
  if (summary.h3) lines.push(`- H3: ${summary.h3.fontSize}px / ${summary.h3.lineHeight}px / weight ${summary.h3.fontWeight}`);
  if (summary.body) lines.push(`- Body: ${summary.body.fontSize}px / ${summary.body.lineHeight}px / weight ${summary.body.fontWeight}`);
  if (summary.caption) lines.push(`- Caption: ${summary.caption.fontSize}px / ${summary.caption.lineHeight}px / weight ${summary.caption.fontWeight}`);
  return lines.join("\n");
}

function buildLayoutCopy(summary: SummaryModel) {
  return [
    "Layout",
    ...summary.layoutPatterns.map((pattern) => `- ${pattern.columns} column pattern, ${pattern.direction} direction, gap ${pattern.gap}px`)
  ].join("\n");
}

function buildComponentsCopy(summary: SummaryModel) {
  return [
    "Components",
    ...summary.componentFamilies.slice(0, 6).map((family) => `- ${family.type}: ${family.count} repeated instances`)
  ].join("\n");
}
