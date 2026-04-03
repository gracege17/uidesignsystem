import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
const REVIEW_TABS = [
    { id: "overview", label: "Overview" },
    { id: "color", label: "Color" },
    { id: "typography", label: "Typography" },
    { id: "layout", label: "Grids" },
    { id: "components", label: "Components" }
];
export default function DesignSystemReview({ result, layout = "stacked", theme = "light" }) {
    const [activeTab, setActiveTab] = useState("overview");
    const [copiedKey, setCopiedKey] = useState(null);
    const ui = getThemeClasses(theme);
    const summary = useMemo(() => buildSummary(result), [result]);
    const copySection = async (key) => {
        const text = buildCopyText(key, summary);
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);
        globalThis.setTimeout(() => {
            setCopiedKey((current) => (current === key ? null : current));
        }, 1500);
    };
    if (layout === "split") {
        return (_jsxs("div", { className: "grid min-h-[780px] grid-cols-[180px_minmax(0,1fr)] gap-8", children: [_jsx("aside", { className: `border-r pr-6 ${ui.sidebarBorder}`, children: _jsxs("div", { className: "sticky top-8", children: [_jsx("p", { className: `text-[11px] uppercase tracking-[0.24em] ${ui.mutedText}`, children: "Basics" }), _jsx("nav", { className: "mt-6 space-y-1", children: REVIEW_TABS.map((tab) => (_jsx("button", { type: "button", onClick: () => setActiveTab(tab.id), className: `block w-full border-l-2 py-2 pl-4 text-left text-sm transition ${activeTab === tab.id ? ui.navActive : ui.navIdle}`, children: tab.label }, tab.id))) })] }) }), _jsx("main", { className: "min-w-0", children: _jsx(SplitSection, { tab: activeTab, result: result, summary: summary, theme: theme, copiedKey: copiedKey, onCopy: copySection }) })] }));
    }
    return (_jsxs("div", { className: "space-y-12", children: [_jsx(SectionShell, { title: "Overview", subtitle: "Key extracted foundations and primary signals.", theme: theme, copyLabel: "Copy Everything", copied: copiedKey === "everything", onCopy: () => void copySection("everything"), children: _jsx(OverviewSection, { summary: summary, theme: theme }) }), _jsx(SectionShell, { title: "Color Styles", subtitle: "Starter color styles extracted from the page.", theme: theme, copyLabel: "Copy Color", copied: copiedKey === "color", onCopy: () => void copySection("color"), children: _jsx(ColorSection, { tokens: result.tokens, summary: summary, theme: theme }) }), _jsx(SectionShell, { title: "Typography", subtitle: "Likely display, heading, and body styles.", theme: theme, copyLabel: "Copy Typography", copied: copiedKey === "typography", onCopy: () => void copySection("typography"), children: _jsx(TypographySection, { tokens: result.tokens, summary: summary, theme: theme }) }), _jsx(SectionShell, { title: "Grid & Layout", subtitle: "Common layout patterns and spacing primitives.", theme: theme, copyLabel: "Copy Layout", copied: copiedKey === "layout", onCopy: () => void copySection("layout"), children: _jsx(LayoutSection, { components: result.components, summary: summary, theme: theme }) }), _jsx(SectionShell, { title: "Components", subtitle: "Top reusable component families extracted from the page.", theme: theme, copyLabel: "Copy Components", copied: copiedKey === "components", onCopy: () => void copySection("components"), children: _jsx(ComponentsSection, { result: result, summary: summary, theme: theme }) })] }));
}
function SplitSection({ tab, result, summary, theme, copiedKey, onCopy }) {
    if (tab === "overview") {
        return (_jsx(SectionShell, { title: "Overview", subtitle: "Start here to identify the main design-system signals.", theme: theme, copyLabel: "Copy Everything", copied: copiedKey === "everything", onCopy: () => void onCopy("everything"), children: _jsx(OverviewSection, { summary: summary, theme: theme }) }));
    }
    if (tab === "color") {
        return (_jsx(SectionShell, { title: "Color Styles", subtitle: "Grouped color styles with primary and supporting tokens.", theme: theme, copyLabel: "Copy Color", copied: copiedKey === "color", onCopy: () => void onCopy("color"), children: _jsx(ColorSection, { tokens: result.tokens, summary: summary, theme: theme }) }));
    }
    if (tab === "typography") {
        return (_jsx(SectionShell, { title: "Typography", subtitle: "Likely display, heading, and body specimens.", theme: theme, copyLabel: "Copy Typography", copied: copiedKey === "typography", onCopy: () => void onCopy("typography"), children: _jsx(TypographySection, { tokens: result.tokens, summary: summary, theme: theme }) }));
    }
    if (tab === "layout") {
        return (_jsx(SectionShell, { title: "Grid & Layout", subtitle: "Visual layout primitives instead of raw auto-layout metadata.", theme: theme, copyLabel: "Copy Layout", copied: copiedKey === "layout", onCopy: () => void onCopy("layout"), children: _jsx(LayoutSection, { components: result.components, summary: summary, theme: theme }) }));
    }
    return (_jsx(SectionShell, { title: "Components", subtitle: "Curated gallery of the most repeated component families.", theme: theme, copyLabel: "Copy Components", copied: copiedKey === "components", onCopy: () => void onCopy("components"), children: _jsx(ComponentsSection, { result: result, summary: summary, theme: theme }) }));
}
function OverviewSection({ summary, theme }) {
    const ui = getThemeClasses(theme);
    return (_jsxs("div", { className: "space-y-8", children: [_jsx("div", { className: `border-t pt-8 ${ui.rule}`, children: _jsxs("div", { className: "grid gap-4 md:grid-cols-3", children: [_jsx(OverviewCard, { label: "Primary Color", value: summary.primaryColor?.name ?? "Not found", detail: summary.primaryColor?.value ?? "No dominant color yet", theme: theme }), _jsx(OverviewCard, { label: summary.fontFamilies.length > 1 ? "Typefaces" : "Typeface", value: summary.fontFamilies.length > 0 ? summary.fontFamilies.join(" / ") : "Not found", detail: summary.fontFamilies.length > 1 ? "Paired typeface system" : (summary.mainTypography ? `${summary.mainTypography.fontSize}px / ${summary.mainTypography.lineHeight}px` : "No dominant text style yet"), theme: theme }), _jsx(OverviewCard, { label: "Top Family", value: summary.componentFamilies[0]?.type ?? "Not found", detail: summary.componentFamilies[0] ? `${summary.componentFamilies[0].count} instances` : "No repeated family yet", theme: theme })] }) }), _jsxs("div", { className: `grid gap-4 md:grid-cols-2`, children: [_jsxs("div", { className: `p-6 ${ui.softPanel}`, children: [_jsx("p", { className: `text-[11px] uppercase tracking-[0.22em] ${ui.mutedText}`, children: "Designer Questions" }), _jsxs("div", { className: `mt-4 space-y-3 text-sm ${ui.bodyText}`, children: [_jsxs("p", { children: ["Primary color: ", _jsx("span", { className: ui.strongText, children: summary.primaryColor?.value ?? "Unknown" })] }), _jsxs("p", { children: ["H1 candidate: ", _jsx("span", { className: ui.strongText, children: summary.h1 ? `${summary.h1.fontFamily} ${summary.h1.fontSize}px / ${summary.h1.fontWeight}` : "Unknown" })] }), _jsxs("p", { children: ["Body style: ", _jsx("span", { className: ui.strongText, children: summary.body ? `${summary.body.fontFamily} ${summary.body.fontSize}px / ${summary.body.fontWeight}` : "Unknown" })] }), _jsxs("p", { children: ["Main component families: ", _jsx("span", { className: ui.strongText, children: summary.componentFamilies.slice(0, 3).map((family) => family.type).join(", ") || "Unknown" })] })] })] }), _jsxs("div", { className: `p-6 ${ui.softPanel}`, children: [_jsx("p", { className: `text-[11px] uppercase tracking-[0.22em] ${ui.mutedText}`, children: "System Snapshot" }), _jsxs("div", { className: "mt-4 grid grid-cols-2 gap-3", children: [_jsx(MiniMetric, { label: "Colors", value: summary.counts.colors, theme: theme }), _jsx(MiniMetric, { label: "Typography", value: summary.counts.typography, theme: theme }), _jsx(MiniMetric, { label: "Layouts", value: summary.counts.layouts, theme: theme }), _jsx(MiniMetric, { label: "Components", value: summary.counts.components, theme: theme })] })] })] })] }));
}
function ColorSection({ tokens, summary, theme }) {
    const ui = getThemeClasses(theme);
    const groups = [
        { label: "Primary", items: summary.colorGroups.primary },
        { label: "Neutral", items: summary.colorGroups.neutral },
        { label: "Accent", items: summary.colorGroups.accent }
    ].filter((group) => group.items.length > 0);
    return (_jsxs("div", { className: "space-y-10", children: [groups.map((group) => (_jsxs("section", { className: "grid grid-cols-[88px_minmax(0,1fr)] gap-8", children: [_jsx("div", { className: `pt-3 text-sm font-medium ${ui.subtleText}`, children: group.label }), _jsx("div", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4", children: group.items.map((token) => (_jsxs("div", { className: `${ui.softPanel} overflow-hidden`, children: [_jsx("div", { className: `h-20 ${ui.rule}`, style: { backgroundColor: token.value } }), _jsxs("div", { className: "p-4", children: [_jsx("p", { className: `text-sm font-semibold ${ui.headingText}`, children: token.name }), _jsx("p", { className: `mt-1 text-xs ${ui.bodyText}`, children: token.value }), _jsx("p", { className: `mt-2 truncate text-[11px] ${ui.mutedText}`, children: token.source })] })] }, token.id))) })] }, group.label))), groups.length === 0 ? (_jsx(EmptyState, { message: "No clear color groups were found.", theme: theme })) : null] }));
}
function TypographySection({ tokens, summary, theme }) {
    const ui = getThemeClasses(theme);
    const seenIds = new Set();
    const scale = [
        summary.h1 ? { role: "H1", token: summary.h1 } : null,
        summary.h2 ? { role: "H2", token: summary.h2 } : null,
        summary.h3 ? { role: "H3", token: summary.h3 } : null,
        summary.body ? { role: "Body", token: summary.body } : null,
        summary.caption ? { role: "Caption", token: summary.caption } : null,
    ].filter((entry) => {
        if (!entry)
            return false;
        if (seenIds.has(entry.token.id))
            return false;
        seenIds.add(entry.token.id);
        return true;
    });
    return (_jsxs("div", { className: "space-y-8", children: [_jsx("div", { className: `${ui.heroPanel} grid gap-10 ${summary.fontFamilies.length > 1 ? "md:grid-cols-2" : ""}`, children: summary.fontFamilies.length === 0 ? (_jsxs("div", { children: [_jsx("p", { className: `text-[11px] uppercase tracking-[0.22em] ${ui.heroMetaText}`, children: "Typeface" }), _jsx("p", { className: `mt-3 text-3xl font-semibold tracking-tight ${ui.heroHeadingText}`, children: "\u2014" })] })) : summary.fontFamilies.map((family) => (_jsxs("div", { children: [_jsx("p", { className: `text-[11px] uppercase tracking-[0.22em] ${ui.heroMetaText}`, children: "Typeface" }), _jsx("p", { className: `mt-3 text-3xl font-semibold tracking-tight ${ui.heroHeadingText}`, children: family })] }, family))) }), _jsx("div", { className: "space-y-8", children: scale.map(({ role, token }) => (_jsxs("div", { className: `border-t pt-6 ${ui.rule}`, children: [_jsxs("div", { className: `mb-4 grid grid-cols-[minmax(0,1fr)_100px_100px] gap-4 text-[11px] uppercase tracking-[0.18em] ${ui.mutedText}`, children: [_jsxs("span", { children: [role, " \u2014 ", token.fontFamily] }), _jsx("span", { children: "Font Size" }), _jsx("span", { children: "Line Height" })] }), _jsxs("div", { className: "grid grid-cols-[minmax(0,1fr)_100px_100px] gap-4", children: [_jsx("p", { className: `pr-6 ${ui.headingText}`, style: {
                                        fontSize: `${Math.min(token.fontSize, 64)}px`,
                                        lineHeight: `${Math.min(token.lineHeight, 72)}px`,
                                        fontWeight: token.fontWeight,
                                        letterSpacing: `${token.letterSpacing}px`,
                                        textTransform: token.textTransform ?? "none"
                                    }, children: "The quick brown fox jumps over the lazy dog" }), _jsxs("p", { className: `pt-2 text-sm ${ui.bodyText}`, children: [token.fontSize, "px"] }), _jsxs("p", { className: `pt-2 text-sm ${ui.bodyText}`, children: [token.lineHeight, "px"] })] })] }, token.id))) }), scale.length === 0 ? _jsx(EmptyState, { message: "No clear typography scale was found.", theme: theme }) : null] }));
}
function LayoutSection({ components, summary, theme }) {
    const ui = getThemeClasses(theme);
    const layouts = summary.layoutPatterns.slice(0, 6);
    return (_jsxs("div", { className: "space-y-8", children: [_jsxs("div", { className: `p-8 ${ui.heroPanel}`, children: [_jsx("p", { className: `text-[11px] uppercase tracking-[0.22em] ${ui.heroMetaText}`, children: "Desktop" }), _jsx("h2", { className: `mt-3 text-5xl font-semibold tracking-tight ${ui.heroHeadingText}`, children: "Grid & Layout" }), _jsxs("div", { className: `mt-6 space-y-2 text-sm ${ui.heroBodyText}`, children: [_jsxs("p", { children: [summary.gridColumns, " common repeated layout groups"] }), _jsx("p", { children: summary.layoutPatterns[0] ? `typical gap ${summary.layoutPatterns[0].gap}px` : "gap not detected" }), _jsxs("p", { children: [components.filter((component) => component.autoLayout).length, " spaced layout candidates"] })] })] }), _jsx("div", { className: "space-y-4", children: layouts.map((pattern, index) => (_jsxs("div", { className: `border-t pt-4 ${ui.rule}`, children: [_jsxs("div", { className: `mb-2 flex items-center justify-between text-sm ${ui.bodyText}`, children: [_jsxs("span", { children: [pattern.columns, " columns"] }), _jsxs("span", { children: [pattern.direction, " \u00B7 gap ", pattern.gap] })] }), _jsx("div", { className: "grid gap-2", style: { gridTemplateColumns: `repeat(${pattern.columns}, minmax(0, 1fr))` }, children: Array.from({ length: pattern.columns }).map((_, columnIndex) => (_jsx("div", { className: `${ui.gridCell} py-3 text-center text-sm`, children: pattern.columns === 1 ? "1" : `${columnIndex + 1}` }, columnIndex))) })] }, `${pattern.direction}-${pattern.gap}-${index}`))) }), layouts.length === 0 ? _jsx(EmptyState, { message: "No strong layout patterns were found.", theme: theme }) : null] }));
}
function ComponentsSection({ result, summary, theme }) {
    const ui = getThemeClasses(theme);
    const curated = summary.componentFamilies
        .map((family) => result.components.find((component) => component.type === family.type))
        .filter((component) => Boolean(component))
        .slice(0, 6);
    return (_jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [curated.map((component) => (_jsxs("div", { className: `${ui.softPanel} p-5`, children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: `text-sm font-semibold ${ui.headingText}`, children: component.type }), _jsxs("p", { className: `mt-1 text-xs ${ui.bodyText}`, children: [component.variants.style, " \u00B7 ", component.variants.size, " \u00B7 ", component.variants.state] })] }), _jsx("span", { className: `text-[11px] uppercase tracking-[0.18em] ${ui.mutedText}`, children: component.name })] }), _jsx("div", { className: `mt-4 p-4 ${ui.previewPanel}`, children: _jsx(ComponentPreview, { component: component, tokens: result.tokens, theme: theme }) })] }, component.id))), curated.length === 0 ? _jsx(EmptyState, { message: "No curated component families were found.", theme: theme }) : null] }) }));
}
function ComponentPreview({ component, tokens, theme }) {
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
        return (_jsx("button", { type: "button", className: "rounded-full border px-5 py-2.5 text-sm", style: style, children: component.type }));
    }
    if (component.type === "Navigation") {
        return (_jsxs("div", { className: "flex items-center gap-4 rounded-full border px-5 py-3 text-sm", style: style, children: [_jsx("span", { children: "Overview" }), _jsx("span", { className: "opacity-60", children: "Pricing" }), _jsx("span", { className: "opacity-60", children: "Docs" })] }));
    }
    return (_jsxs("div", { className: "rounded-[18px] border p-5", style: style, children: [_jsx("p", { className: "text-sm font-semibold", children: component.type }), _jsx("p", { className: "mt-2 text-xs opacity-70", children: component.name })] }));
}
function SectionShell({ title, subtitle, children, theme, copyLabel, copied, onCopy }) {
    const ui = getThemeClasses(theme);
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: `border-t pt-6 ${ui.rule}`, children: _jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: `text-5xl font-semibold tracking-tight ${ui.headingText}`, children: title }), _jsx("p", { className: `mt-3 text-sm leading-6 ${ui.mutedText}`, children: subtitle })] }), _jsx("button", { type: "button", onClick: onCopy, className: `shrink-0 rounded-full border px-4 py-2 text-sm transition ${ui.copyButton}`, children: copied ? "Copied" : copyLabel })] }) }), children] }));
}
function OverviewCard({ label, value, detail, theme }) {
    const ui = getThemeClasses(theme);
    return (_jsxs("div", { className: `${ui.softPanel} p-5`, children: [_jsx("p", { className: `text-[11px] uppercase tracking-[0.22em] ${ui.mutedText}`, children: label }), _jsx("p", { className: `mt-3 text-xl font-semibold ${ui.headingText}`, children: value }), _jsx("p", { className: `mt-2 text-sm ${ui.bodyText}`, children: detail })] }));
}
function MiniMetric({ label, value, theme }) {
    const ui = getThemeClasses(theme);
    return (_jsxs("div", { className: `${ui.metricPanel} p-4`, children: [_jsx("p", { className: `text-[10px] uppercase tracking-[0.2em] ${ui.mutedText}`, children: label }), _jsx("p", { className: `mt-2 text-2xl font-semibold ${ui.headingText}`, children: value })] }));
}
function EmptyState({ message, theme }) {
    const ui = getThemeClasses(theme);
    return _jsx("div", { className: `${ui.softPanel} p-5 text-sm ${ui.mutedText}`, children: message });
}
function buildSummary(result) {
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
    const primaryColors = result.tokens.colors.filter((token) => (token.role === "fill" || token.role === "text") && !isNeutralColor(token.value));
    const neutralColors = result.tokens.colors.filter((token) => isNeutralColor(token.value));
    const accentColors = result.tokens.colors.filter((token) => !primaryColors.includes(token) && !neutralColors.includes(token) && token.role !== "stroke");
    const familyCounts = result.components.reduce((accumulator, component) => {
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
        mainTypography: headings[0] ?? body,
        fontFamilies,
        h1: headings[0],
        h2: headings[1],
        h3: headings[2],
        body,
        caption,
        componentFamilies: Object.entries(familyCounts)
            .map(([type, count]) => ({ type: type, count }))
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
function inferColumns(component) {
    const gap = component.autoLayout?.gap ?? 0;
    if (gap >= 48)
        return 12;
    if (gap >= 24)
        return 6;
    if (gap >= 12)
        return 4;
    if (gap > 0)
        return 3;
    return 1;
}
function isNeutralColor(value) {
    let r, g, b;
    const hexMatch = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hexMatch) {
        const hex = hexMatch[1];
        const normalized = hex.length === 3
            ? hex.split("").map((part) => `${part}${part}`).join("")
            : hex;
        r = Number.parseInt(normalized.slice(0, 2), 16);
        g = Number.parseInt(normalized.slice(2, 4), 16);
        b = Number.parseInt(normalized.slice(4, 6), 16);
    } else {
        const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if (!match)
            return false;
        [r, g, b] = [Number(match[1]), Number(match[2]), Number(match[3])];
    }
    return Math.abs(r - g) < 12 && Math.abs(g - b) < 12;
}
function getReadableTextColor(backgroundColor, preferredTextColor, theme) {
    const fallbackLight = "#111827";
    const fallbackDark = "#f8fafc";
    const backgroundLuminance = getColorLuminance(backgroundColor);
    if (preferredTextColor) {
        const preferredLuminance = getColorLuminance(preferredTextColor);
        if (backgroundLuminance !== null && preferredLuminance !== null) {
            const lighter = Math.max(backgroundLuminance, preferredLuminance);
            const darker = Math.min(backgroundLuminance, preferredLuminance);
            const contrastRatio = (lighter + 0.05) / (darker + 0.05);
            if (contrastRatio >= 4.5) {
                return preferredTextColor;
            }
        }
        else {
            return preferredTextColor;
        }
    }
    if (backgroundLuminance === null) {
        return theme === "light" ? fallbackLight : fallbackDark;
    }
    return backgroundLuminance > 0.6 ? fallbackLight : fallbackDark;
}
function toRelativeLuminance(r, g, b) {
    const linearize = (channel) => {
        const sRGB = channel / 255;
        return sRGB <= 0.04045 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}
function getColorLuminance(color) {
    if (!color) {
        return null;
    }
    const hexMatch = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hexMatch) {
        const hex = hexMatch[1];
        const normalized = hex.length === 3
            ? hex
                .split("")
                .map((part) => `${part}${part}`)
                .join("")
            : hex;
        const r = Number.parseInt(normalized.slice(0, 2), 16);
        const g = Number.parseInt(normalized.slice(2, 4), 16);
        const b = Number.parseInt(normalized.slice(4, 6), 16);
        return toRelativeLuminance(r, g, b);
    }
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!match) {
        return null;
    }
    const [r, g, b] = [Number(match[1]), Number(match[2]), Number(match[3])];
    return toRelativeLuminance(r, g, b);
}
function getThemeClasses(theme) {
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
function buildCopyText(key, summary) {
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
function buildOverviewCopy(summary) {
    return [
        "Overview",
        `- Primary color: ${summary.primaryColor?.value ?? "Unknown"}`,
        `- Typefaces: ${summary.fontFamilies.length > 0 ? summary.fontFamilies.join(", ") : "Unknown"}`,
        `- H1 candidate: ${summary.h1 ? `${summary.h1.fontSize}px / ${summary.h1.lineHeight}px / ${summary.h1.fontWeight}` : "Unknown"}`,
        `- Body style: ${summary.body ? `${summary.body.fontSize}px / ${summary.body.lineHeight}px / ${summary.body.fontWeight}` : "Unknown"}`,
        `- Main component families: ${summary.componentFamilies.slice(0, 3).map((family) => family.type).join(", ") || "Unknown"}`
    ].join("\n");
}
function buildColorCopy(summary) {
    return [
        "Color",
        ...summary.colorGroups.primary.map((token) => `- Primary: ${token.name} = ${token.value}`),
        ...summary.colorGroups.neutral.map((token) => `- Neutral: ${token.name} = ${token.value}`),
        ...summary.colorGroups.accent.map((token) => `- Accent: ${token.name} = ${token.value}`)
    ].join("\n");
}
function buildTypographyCopy(summary) {
    const lines = ["Typography"];
    if (summary.fontFamilies.length > 0)
        lines.push(`- Typefaces: ${summary.fontFamilies.join(", ")}`);
    if (summary.h1)
        lines.push(`- H1: ${summary.h1.fontSize}px / ${summary.h1.lineHeight}px / weight ${summary.h1.fontWeight}`);
    if (summary.h2)
        lines.push(`- H2: ${summary.h2.fontSize}px / ${summary.h2.lineHeight}px / weight ${summary.h2.fontWeight}`);
    if (summary.h3)
        lines.push(`- H3: ${summary.h3.fontSize}px / ${summary.h3.lineHeight}px / weight ${summary.h3.fontWeight}`);
    if (summary.body)
        lines.push(`- Body: ${summary.body.fontSize}px / ${summary.body.lineHeight}px / weight ${summary.body.fontWeight}`);
    if (summary.caption)
        lines.push(`- Caption: ${summary.caption.fontSize}px / ${summary.caption.lineHeight}px / weight ${summary.caption.fontWeight}`);
    return lines.join("\n");
}
function buildLayoutCopy(summary) {
    return [
        "Layout",
        ...summary.layoutPatterns.map((pattern) => `- ${pattern.columns} column pattern, ${pattern.direction} direction, gap ${pattern.gap}px`)
    ].join("\n");
}
function buildComponentsCopy(summary) {
    return [
        "Components",
        ...summary.componentFamilies.slice(0, 6).map((family) => `- ${family.type}: ${family.count} repeated instances`)
    ].join("\n");
}
