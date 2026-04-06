import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
const REVIEW_TABS = [
    { id: "overview", label: "Overview" },
    { id: "color", label: "Color" },
    { id: "typography", label: "Typography" },
    { id: "layout", label: "Spacing" },
    { id: "components", label: "Components" }
];
export default function DesignSystemReview({ result, layout = "stacked", theme = "light" }) {
    const [activeTab, setActiveTab] = useState("overview");
    const [copiedKey, setCopiedKey] = useState(null);
    const ui = getThemeClasses(theme);
    const summary = useMemo(() => buildSummary(result), [result]);
    const copySection = async (key) => {
        const text = buildCopyText(key, summary, result.tokens);
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);
        globalThis.setTimeout(() => {
            setCopiedKey((current) => (current === key ? null : current));
        }, 1500);
    };
    if (layout === "split") {
        return (_jsxs("div", { className: "grid min-h-[780px] grid-cols-[180px_minmax(0,1fr)] gap-8", children: [_jsx("aside", { className: `border-r pr-6 ${ui.sidebarBorder}`, children: _jsxs("div", { className: "sticky top-8", children: [_jsx("p", { className: `text-[11px] uppercase tracking-[0.24em] ${ui.mutedText}`, children: "Basics" }), _jsx("nav", { className: "mt-6 space-y-1", children: REVIEW_TABS.map((tab) => (_jsx("button", { type: "button", onClick: () => setActiveTab(tab.id), className: `block w-full border-l-2 py-2 pl-4 text-left text-sm transition ${activeTab === tab.id ? ui.navActive : ui.navIdle}`, children: tab.label }, tab.id))) })] }) }), _jsx("main", { className: "min-w-0", children: _jsx(SplitSection, { tab: activeTab, result: result, summary: summary, theme: theme, copiedKey: copiedKey, onCopy: copySection }) })] }));
    }
    return (_jsxs("div", { className: "space-y-12", children: [_jsx(SectionShell, { title: "Overview", subtitle: "Key extracted foundations and primary signals.", theme: theme, copyLabel: "Copy Everything", copied: copiedKey === "everything", onCopy: () => void copySection("everything"), children: _jsx(OverviewSection, { result: result, summary: summary, theme: theme }) }), _jsx(SectionShell, { title: "Color Styles", subtitle: "Color styles extracted from the page, grouped by role.", theme: theme, copyLabel: "Copy Color", copied: copiedKey === "color", onCopy: () => void copySection("color"), children: _jsx(ColorSection, { tokens: result.tokens, summary: summary, theme: theme }) }), _jsx(SectionShell, { title: "Typography", subtitle: "Font families and text styles extracted from the page, ordered by size.", theme: theme, copyLabel: "Copy Typography", copied: copiedKey === "typography", onCopy: () => void copySection("typography"), children: _jsx(TypographySection, { tokens: result.tokens, summary: summary, theme: theme }) }), _jsx(SectionShell, { title: "Spacing & Layout", subtitle: "Content width, page margins, and spacing scale extracted from the page.", theme: theme, copyLabel: "Copy Layout", copied: copiedKey === "layout", onCopy: () => void copySection("layout"), children: _jsx(LayoutSection, { layout: result.layout, theme: theme }) }), _jsx(SectionShell, { title: "Components", subtitle: "Top reusable component families extracted from the page.", theme: theme, copyLabel: "Copy Components", copied: copiedKey === "components", onCopy: () => void copySection("components"), children: _jsx(ComponentsSection, { result: result, summary: summary, theme: theme }) })] }));
}
function SplitSection({ tab, result, summary, theme, copiedKey, onCopy }) {
    if (tab === "overview") {
        return (_jsx(SectionShell, { title: "Overview", subtitle: "Start here to identify the main design-system signals.", theme: theme, copyLabel: "Copy Everything", copied: copiedKey === "everything", onCopy: () => void onCopy("everything"), children: _jsx(OverviewSection, { result: result, summary: summary, theme: theme }) }));
    }
    if (tab === "color") {
        return (_jsx(SectionShell, { title: "Color Styles", subtitle: "Color styles extracted from the page, grouped by role.", theme: theme, copyLabel: "Copy Color", copied: copiedKey === "color", onCopy: () => void onCopy("color"), children: _jsx(ColorSection, { tokens: result.tokens, summary: summary, theme: theme }) }));
    }
    if (tab === "typography") {
        return (_jsx(SectionShell, { title: "Typography", subtitle: "Font families and text styles extracted from the page, ordered by size.", theme: theme, copyLabel: "Copy Typography", copied: copiedKey === "typography", onCopy: () => void onCopy("typography"), children: _jsx(TypographySection, { tokens: result.tokens, summary: summary, theme: theme }) }));
    }
    if (tab === "layout") {
        return (_jsx(SectionShell, { title: "Spacing & Layout", subtitle: "Content width, page margins, and spacing scale extracted from the page.", theme: theme, copyLabel: "Copy Layout", copied: copiedKey === "layout", onCopy: () => void onCopy("layout"), children: _jsx(LayoutSection, { layout: result.layout, theme: theme }) }));
    }
    return (_jsx(SectionShell, { title: "Components", subtitle: "Curated gallery of the most repeated component families.", theme: theme, copyLabel: "Copy Components", copied: copiedKey === "components", onCopy: () => void onCopy("components"), children: _jsx(ComponentsSection, { result: result, summary: summary, theme: theme }) }));
}
function OverviewSection({ result, summary, theme }) {
    const ui = getThemeClasses(theme);
    // Primary brand color — first non-neutral fill token
    const brandColor = summary.primaryColor;
    // Primary font — most common font family
    const primaryFont = summary.fontFamilies[0];
    const bodyStyle = summary.body;
    // Primary fill button
    const primaryButton = result.components.find((c) => c.type === "Button" && c.variants.style === "fill" && c.variants.state === "default");
    // One-line summary sentence
    const summaryParts = [];
    if (primaryFont)
        summaryParts.push(primaryFont.split(",")[0].trim());
    if (brandColor)
        summaryParts.push(brandColor.value);
    if (result.layout.contentWidth)
        summaryParts.push(`${result.layout.contentWidth}px canvas`);
    if (result.layout.spacingScale[0])
        summaryParts.push(`${result.layout.spacingScale[0]}px base grid`);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4 md:grid-cols-4", children: [_jsxs("div", { className: `${ui.softPanel} overflow-hidden`, children: [_jsx("div", { className: "h-20 w-full", style: { backgroundColor: brandColor?.value ?? "#e2e8f0" } }), _jsxs("div", { className: "p-3", children: [_jsx("p", { className: `text-[10px] uppercase tracking-[0.18em] ${ui.mutedText}`, children: "Brand color" }), _jsx("p", { className: `mt-1 text-xs font-semibold ${ui.headingText}`, children: brandColor?.value ?? "—" })] })] }), _jsxs("div", { className: `${ui.softPanel} p-4 flex flex-col justify-between`, children: [_jsx("p", { className: `text-[10px] uppercase tracking-[0.18em] ${ui.mutedText}`, children: "Typeface" }), _jsxs("div", { children: [_jsx("p", { className: `mt-2 text-4xl font-bold leading-none ${ui.headingText}`, style: { fontFamily: primaryFont ? `"${primaryFont}", sans-serif` : undefined }, children: "Aa" }), _jsx("p", { className: `mt-2 text-xs font-semibold ${ui.headingText}`, children: primaryFont?.split(",")[0].trim() ?? "—" }), bodyStyle && (_jsxs("p", { className: `text-[11px] ${ui.mutedText}`, children: [bodyStyle.fontSize, "px / ", bodyStyle.fontWeight] }))] })] }), _jsxs("div", { className: `${ui.softPanel} p-4 flex flex-col justify-between`, children: [_jsx("p", { className: `text-[10px] uppercase tracking-[0.18em] ${ui.mutedText}`, children: "Primary button" }), primaryButton ? (_jsx(ComponentPreview, { component: primaryButton, tokens: result.tokens, theme: theme, showSpecs: false })) : (_jsx("p", { className: `text-xs ${ui.mutedText}`, children: "Not detected" }))] }), _jsxs("div", { className: `${ui.softPanel} p-4 flex flex-col justify-between`, children: [_jsx("p", { className: `text-[10px] uppercase tracking-[0.18em] ${ui.mutedText}`, children: "Canvas" }), _jsxs("div", { className: "space-y-2", children: [result.layout.contentWidth ? (_jsxs("div", { children: [_jsxs("p", { className: `text-2xl font-semibold tabular-nums ${ui.headingText}`, children: [result.layout.contentWidth, _jsx("span", { className: `text-sm font-normal ml-0.5 ${ui.mutedText}`, children: "px" })] }), _jsx("p", { className: `text-[11px] ${ui.mutedText}`, children: "max content width" })] })) : (_jsx("p", { className: `text-xs ${ui.mutedText}`, children: "Not detected" })), result.layout.spacingScale[0] && (_jsxs("p", { className: `text-[11px] ${ui.mutedText}`, children: [result.layout.spacingScale[0], "px base unit"] }))] })] })] }), summaryParts.length > 0 && (_jsx("div", { className: `${ui.softPanel} px-5 py-4`, children: _jsxs("p", { className: `text-sm ${ui.bodyText}`, children: [_jsx("span", { className: `font-medium ${ui.headingText}`, children: "At a glance \u2014 " }), summaryParts.join(" · ")] }) }))] }));
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
    // Labels describe what we actually know — size position and range — not assumed semantic role
    const scale = [
        summary.h1 ? { role: "Largest", token: summary.h1 } : null,
        summary.h2 ? { role: "2nd Largest", token: summary.h2 } : null,
        summary.h3 ? { role: "3rd Largest", token: summary.h3 } : null,
        summary.body ? { role: "Body range (14–20px)", token: summary.body } : null,
        summary.caption ? { role: "Small text (<14px)", token: summary.caption } : null,
    ].filter((entry) => {
        if (!entry)
            return false;
        if (seenIds.has(entry.token.id))
            return false;
        seenIds.add(entry.token.id);
        return true;
    });
    return (_jsxs("div", { className: "space-y-8", children: [_jsx("div", { className: `${ui.heroPanel} grid gap-10 ${summary.fontFamilies.length > 1 ? "md:grid-cols-2" : ""}`, children: summary.fontFamilies.length === 0 ? (_jsxs("div", { children: [_jsx("p", { className: `text-[11px] uppercase tracking-[0.22em] ${ui.heroMetaText}`, children: "Typeface" }), _jsx("p", { className: `mt-3 text-3xl font-semibold tracking-tight ${ui.heroHeadingText}`, children: "\u2014" })] })) : summary.fontFamilies.map((family) => (_jsxs("div", { children: [_jsx("p", { className: `text-[11px] uppercase tracking-[0.22em] ${ui.heroMetaText}`, children: "Typeface" }), _jsx("p", { className: `mt-3 text-3xl font-semibold tracking-tight ${ui.heroHeadingText}`, children: family }), _jsxs("p", { className: `mt-2 text-[11px] ${ui.heroMetaText}`, children: ["Preview uses a system fallback \u2014 not the actual font. To use ", _jsx("span", { className: "italic", children: family }), ", source it separately."] })] }, family))) }), _jsx("div", { className: "space-y-8", children: scale.map(({ role, token }) => (_jsxs("div", { className: `border-t pt-6 ${ui.rule}`, children: [_jsxs("div", { className: `mb-4 grid grid-cols-[minmax(0,1fr)_100px_100px_100px] gap-4 text-[11px] uppercase tracking-[0.18em] ${ui.mutedText}`, children: [_jsxs("span", { children: [role, " \u2014 ", token.fontFamily] }), _jsx("span", { children: "Font Size" }), _jsx("span", { children: "Line Height" }), _jsx("span", { children: "Letter Space" })] }), _jsxs("div", { className: "grid grid-cols-[minmax(0,1fr)_100px_100px_100px] gap-4", children: [_jsx("p", { className: `pr-6 ${ui.headingText}`, style: {
                                        fontSize: `${Math.min(token.fontSize, 64)}px`,
                                        lineHeight: `${Math.min(token.lineHeight, 72)}px`,
                                        fontWeight: token.fontWeight,
                                        letterSpacing: `${token.letterSpacing}px`,
                                        textTransform: token.textTransform ?? "none"
                                    }, children: "The quick brown fox jumps over the lazy dog" }), _jsxs("p", { className: `pt-2 text-sm ${ui.bodyText}`, children: [token.fontSize, "px"] }), _jsxs("p", { className: `pt-2 text-sm ${ui.bodyText}`, children: [token.lineHeight, "px"] }), _jsxs("p", { className: `pt-2 text-sm ${ui.bodyText}`, children: [token.letterSpacing, "px"] })] })] }, token.id))) }), scale.length === 0 ? _jsx(EmptyState, { message: "No clear typography scale was found.", theme: theme }) : null] }));
}
function LayoutSection({ layout, theme }) {
    const ui = getThemeClasses(theme);
    const hasAnything = layout.contentWidth || layout.pageMargin || layout.spacingScale.length > 0 || layout.grid;
    return (_jsxs("div", { className: "space-y-8", children: [(layout.contentWidth || layout.pageMargin) && (_jsxs("div", { className: "space-y-3", children: [_jsx("p", { className: `text-xs font-semibold uppercase tracking-[0.18em] ${ui.mutedText}`, children: "Canvas" }), _jsxs("div", { className: `grid grid-cols-2 gap-4`, children: [layout.contentWidth && (_jsxs("div", { className: `${ui.softPanel} p-4 space-y-1`, children: [_jsx("p", { className: `text-[11px] uppercase tracking-[0.18em] ${ui.mutedText}`, children: "Content width" }), _jsxs("p", { className: `text-2xl font-semibold tabular-nums ${ui.headingText}`, children: [layout.contentWidth, _jsx("span", { className: `text-sm font-normal ml-1 ${ui.mutedText}`, children: "px" })] })] })), layout.pageMargin && (_jsxs("div", { className: `${ui.softPanel} p-4 space-y-1`, children: [_jsx("p", { className: `text-[11px] uppercase tracking-[0.18em] ${ui.mutedText}`, children: "Page margin" }), _jsxs("p", { className: `text-2xl font-semibold tabular-nums ${ui.headingText}`, children: [layout.pageMargin, _jsx("span", { className: `text-sm font-normal ml-1 ${ui.mutedText}`, children: "px" })] })] }))] })] })), layout.grid && (_jsxs("div", { className: "space-y-3", children: [_jsx("p", { className: `text-xs font-semibold uppercase tracking-[0.18em] ${ui.mutedText}`, children: "Grid system" }), _jsxs("div", { className: `${ui.softPanel} p-4 space-y-3`, children: [_jsxs("div", { className: `flex items-center justify-between text-sm ${ui.bodyText}`, children: [_jsxs("span", { children: [layout.grid.columns, " columns"] }), _jsx("span", { className: "flex items-center gap-1.5", children: layout.grid.gap > 0
                                            ? `gap ${layout.grid.gap}px`
                                            : _jsxs("span", { children: ["gap ", _jsx("span", { className: `italic ${ui.mutedText}`, children: "via cell padding" })] }) })] }), _jsx("div", { className: "grid", style: {
                                    gridTemplateColumns: `repeat(${Math.min(layout.grid.columns, 12)}, minmax(0, 1fr))`,
                                    gap: layout.grid.gap > 0 ? `${layout.grid.gap}px` : "0px"
                                }, children: Array.from({ length: Math.min(layout.grid.columns, 12) }).map((_, i) => (_jsx("div", { className: `h-8 rounded ${ui.gridCell}` }, i))) })] })] })), layout.spacingScale.length > 0 && (() => {
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
                return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: `text-xs font-semibold uppercase tracking-[0.18em] ${ui.mutedText}`, children: "Spacing scale" }), _jsxs("span", { className: `text-[11px] ${ui.mutedText}`, children: ["Base unit: ", _jsxs("span", { className: `font-semibold ${ui.bodyText}`, children: [baseUnit, "px"] })] })] }), _jsx("div", { className: "grid grid-cols-3 gap-6", children: tiers.map((tier) => {
                                const max = tier.values[tier.values.length - 1];
                                return (_jsxs("div", { className: "space-y-3", children: [_jsx("p", { className: `text-[10px] uppercase tracking-[0.18em] ${ui.mutedText}`, children: tier.label }), _jsx("div", { className: "space-y-2", children: tier.values.map((value) => (_jsxs("div", { className: "space-y-1", children: [_jsx("div", { className: `h-5 rounded ${ui.gridCell}`, style: { width: `${Math.round((value / max) * 100)}%` } }), _jsxs("span", { className: `text-[11px] tabular-nums ${ui.mutedText}`, children: [value, "px"] })] }, value))) })] }, tier.label));
                            }) })] }));
            })(), !hasAnything && _jsx(EmptyState, { message: "No spacing or layout data could be extracted from this page.", theme: theme })] }));
}
function ComponentsSection({ result, summary, theme }) {
    const ui = getThemeClasses(theme);
    const STYLE_PRIORITY = { fill: 0, outline: 1, ghost: 2 };
    const BUTTON_STYLES = ["fill", "outline", "ghost"];
    // Prefer default-state fill button as the base; fall back to any button
    const baseButton = result.components.find((c) => c.type === "Button" && c.variants.style === "fill" && c.variants.state === "default") ?? result.components.find((c) => c.type === "Button");
    // For each style, use a real extracted button if available; otherwise synthesize from base
    const buttonVariants = baseButton
        ? BUTTON_STYLES.map((style) => {
            const real = result.components.find((c) => c.type === "Button" &&
                c.variants.style === style &&
                c.variants.state === "default");
            if (real)
                return { component: real, synthesized: false };
            return {
                component: {
                    ...baseButton,
                    id: `${baseButton.id}-${style}`,
                    variants: { ...baseButton.variants, style }
                },
                synthesized: true
            };
        })
        : [];
    // Pick the best Card representative (fill > outline > ghost)
    const baseCard = result.components.find((c) => c.type === "Card" && c.variants.style === "fill") ??
        result.components.find((c) => c.type === "Card");
    // For non-Button, non-Card families, pick the best fill representative
    const otherCurated = summary.componentFamilies
        .filter((family) => family.type !== "Button" && family.type !== "Card")
        .map((family) => {
        const matches = result.components.filter((c) => c.type === family.type);
        return matches.sort((a, b) => (STYLE_PRIORITY[a.variants.style] ?? 9) - (STYLE_PRIORITY[b.variants.style] ?? 9))[0];
    })
        .filter((c) => Boolean(c))
        .slice(0, 5);
    return (_jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [buttonVariants.length > 0 && (() => {
                    const realVariants = buttonVariants.filter((v) => !v.synthesized);
                    if (realVariants.length === 0)
                        return null;
                    const fillEntry = realVariants.find((v) => v.component.variants.style === "fill");
                    const fillComponent = fillEntry?.component ?? realVariants[0].component;
                    const fillType = result.tokens.typography.find((t) => fillComponent.tokens.typography.includes(t.id));
                    const fillPad = fillComponent.padding ?? fillComponent.autoLayout?.padding;
                    const specs = [];
                    if (fillType)
                        specs.push({ label: "Font", value: `${fillType.fontFamily} · ${fillType.fontSize}px · ${fillType.fontWeight}` });
                    if (fillPad)
                        specs.push({ label: "Space", value: `${fillPad.top} · ${fillPad.right} · ${fillPad.bottom} · ${fillPad.left} px` });
                    if (fillComponent.cornerRadius !== undefined)
                        specs.push({ label: "Corner", value: `${fillComponent.cornerRadius}px` });
                    specs.push({ label: "Size", value: fillComponent.variants.size });
                    return (_jsxs("div", { className: `${ui.softPanel} p-5 md:col-span-2`, children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsx("p", { className: `text-sm font-semibold ${ui.headingText}`, children: "Button" }), _jsxs("span", { className: `text-[11px] uppercase tracking-[0.18em] ${ui.mutedText}`, children: [realVariants.length, " ", realVariants.length === 1 ? "variant found" : "variants found"] })] }), _jsxs("div", { className: `mt-4 p-4 ${ui.previewPanel} space-y-5`, children: [_jsx("div", { className: "flex flex-wrap items-center gap-8", children: realVariants.map(({ component }) => (_jsxs("div", { className: "flex flex-col items-center gap-2", children: [_jsx(ComponentPreview, { component: component, tokens: result.tokens, theme: theme, showSpecs: false }), _jsx("p", { className: `text-[10px] capitalize ${ui.mutedText}`, children: component.variants.style })] }, component.id))) }), specs.length > 0 && (_jsx("div", { className: `border-t pt-4 ${ui.rule} grid grid-cols-2 gap-x-8 gap-y-1.5`, children: specs.map((spec) => (_jsxs("div", { className: "grid grid-cols-[56px_1fr] gap-3 text-xs", children: [_jsx("span", { className: `font-medium ${ui.mutedText}`, children: spec.label }), _jsx("span", { className: ui.bodyText, children: spec.value })] }, spec.label))) }))] })] }));
                })(), !baseCard && (buttonVariants.length > 0 || otherCurated.length > 0) && (_jsxs("div", { className: `${ui.softPanel} p-5 md:col-span-2 opacity-50`, children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsx("p", { className: `text-sm font-semibold ${ui.headingText}`, children: "Card" }), _jsx("span", { className: `text-[11px] uppercase tracking-[0.18em] ${ui.mutedText}`, children: "not detected" })] }), _jsx("div", { className: `mt-4 p-4 ${ui.previewPanel}`, children: _jsx("div", { className: "flex h-28 items-center justify-center rounded-xl border-2 border-dashed", style: { borderColor: "currentColor" }, children: _jsx("p", { className: `text-xs ${ui.mutedText}`, children: "No card pattern found on this page" }) }) })] })), baseCard && (() => {
                    const cardType = result.tokens.typography.find((t) => baseCard.tokens.typography.includes(t.id));
                    const cardPad = baseCard.padding ?? baseCard.autoLayout?.padding;
                    const cardSpecs = [];
                    if (cardType)
                        cardSpecs.push({ label: "Font", value: `${cardType.fontFamily} · ${cardType.fontSize}px · ${cardType.fontWeight}` });
                    if (cardPad)
                        cardSpecs.push({ label: "Padding", value: `${cardPad.top} · ${cardPad.right} · ${cardPad.bottom} · ${cardPad.left} px` });
                    if (baseCard.cornerRadius !== undefined)
                        cardSpecs.push({ label: "Corner", value: `${baseCard.cornerRadius}px` });
                    cardSpecs.push({ label: "Size", value: baseCard.variants.size });
                    return (_jsxs("div", { className: `${ui.softPanel} p-5 md:col-span-2`, children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsx("p", { className: `text-sm font-semibold ${ui.headingText}`, children: "Card" }), _jsx("span", { className: `text-[11px] uppercase tracking-[0.18em] ${ui.mutedText}`, children: baseCard.source })] }), _jsxs("div", { className: `mt-4 p-4 ${ui.previewPanel} space-y-5`, children: [_jsx("div", { className: "max-w-[220px]", children: _jsx(ComponentPreview, { component: baseCard, tokens: result.tokens, theme: theme, showSpecs: false }) }), cardSpecs.length > 0 && (_jsx("div", { className: `border-t pt-4 ${ui.rule} grid grid-cols-2 gap-x-8 gap-y-1.5`, children: cardSpecs.map((spec) => (_jsxs("div", { className: "grid grid-cols-[64px_1fr] gap-3 text-xs", children: [_jsx("span", { className: `font-medium ${ui.mutedText}`, children: spec.label }), _jsx("span", { className: ui.bodyText, children: spec.value })] }, spec.label))) }))] })] }));
                })(), otherCurated.map((component) => (_jsxs("div", { className: `${ui.softPanel} p-5`, children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: `text-sm font-semibold ${ui.headingText}`, children: component.type }), _jsxs("p", { className: `mt-1 text-xs ${ui.bodyText}`, children: [component.variants.style, " \u00B7 ", component.variants.size, " \u00B7 ", component.variants.state] })] }), _jsx("span", { className: `text-[11px] uppercase tracking-[0.18em] ${ui.mutedText}`, children: component.name })] }), _jsx("div", { className: `mt-4 p-4 ${ui.previewPanel}`, children: _jsx(ComponentPreview, { component: component, tokens: result.tokens, theme: theme }) })] }, component.id))), buttonVariants.length === 0 && !baseCard && otherCurated.length === 0 ? _jsx(EmptyState, { message: "No curated component families were found.", theme: theme }) : null] }) }));
}
function ComponentPreview({ component, tokens, theme, showSpecs = true }) {
    const ui = getThemeClasses(theme);
    const fill = tokens.colors.find((token) => component.tokens.fills.includes(token.id))?.value;
    const stroke = tokens.colors.find((token) => component.tokens.strokes.includes(token.id))?.value;
    const text = tokens.colors.find((token) => component.tokens.text.includes(token.id))?.value;
    const type = tokens.typography.find((token) => component.tokens.typography.includes(token.id));
    const variantStyle = component.variants.style;
    // For fill buttons with no captured background, fall back to the primary brand color
    const primaryBrandColor = tokens.colors.find((t) => t.role === "fill" && !isNeutralColor(t.value))?.value;
    const resolvedBackground = variantStyle === "outline" || variantStyle === "ghost"
        ? "transparent"
        : (fill ?? primaryBrandColor ?? (theme === "light" ? "#6366f1" : "#4f46e5"));
    const resolvedBorder = stroke ?? fill ?? primaryBrandColor ?? (theme === "light" ? "#d4d4d8" : "#334155");
    const previewTextColor = getReadableTextColor(variantStyle === "outline" || variantStyle === "ghost"
        ? (theme === "light" ? "#ffffff" : "#0f172a")
        : resolvedBackground, text ?? (variantStyle !== "fill" ? (fill ?? stroke) : undefined), theme);
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
        const specs = [];
        if (type)
            specs.push({ label: "Font", value: `${type.fontFamily} · ${type.fontSize}px · ${type.fontWeight}` });
        if (pad)
            specs.push({ label: "Space", value: `${pad.top} · ${pad.right} · ${pad.bottom} · ${pad.left} px` });
        if (component.cornerRadius !== undefined)
            specs.push({ label: "Corner", value: `${component.cornerRadius}px` });
        specs.push({ label: "Size", value: component.variants.size });
        return (_jsxs("div", { className: "space-y-4", children: [_jsx("button", { type: "button", className: `w-fit ${variantStyle === "ghost" ? "border-0" : "border"}`, style: { ...style, borderRadius }, children: "Button" }), showSpecs && specs.length > 0 && (_jsx("div", { className: "space-y-1.5", children: specs.map((spec) => (_jsxs("div", { className: "grid grid-cols-[56px_1fr] gap-3 text-xs", children: [_jsx("span", { className: `font-medium ${ui.mutedText}`, children: spec.label }), _jsx("span", { className: ui.bodyText, children: spec.value })] }, spec.label))) }))] }));
    }
    if (component.type === "Card") {
        const borderRadius = component.cornerRadius !== undefined ? `${component.cornerRadius}px` : "8px";
        const pad = component.padding ?? component.autoLayout?.padding;
        const specs = [];
        if (pad)
            specs.push({ label: "Padding", value: `${pad.top} · ${pad.right} · ${pad.bottom} · ${pad.left} px` });
        if (component.cornerRadius !== undefined)
            specs.push({ label: "Corner", value: `${component.cornerRadius}px` });
        if (type)
            specs.push({ label: "Font", value: `${type.fontFamily} · ${type.fontSize}px · ${type.fontWeight}` });
        specs.push({ label: "Size", value: component.variants.size });
        const cardBg = fill ?? (theme === "light" ? "#ffffff" : "#1e293b");
        const cardBorder = stroke ?? (theme === "light" ? "#e2e8f0" : "#334155");
        const cardTextColor = getReadableTextColor(cardBg, text, theme);
        return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "border", style: {
                        backgroundColor: cardBg,
                        borderColor: cardBorder,
                        borderRadius,
                        color: cardTextColor,
                        fontFamily: type ? `"${type.fontFamily}", sans-serif` : undefined,
                        ...(pad
                            ? { paddingTop: `${pad.top}px`, paddingRight: `${pad.right}px`, paddingBottom: `${pad.bottom}px`, paddingLeft: `${pad.left}px` }
                            : { padding: "16px" })
                    }, children: component.textContent ? (_jsx("p", { className: "text-sm font-semibold leading-snug", children: component.textContent })) : (_jsx("p", { className: `text-xs ${ui.mutedText}`, children: component.source })) }), showSpecs && specs.length > 0 && (_jsx("div", { className: "space-y-1.5", children: specs.map((spec) => (_jsxs("div", { className: "grid grid-cols-[64px_1fr] gap-3 text-xs", children: [_jsx("span", { className: `font-medium ${ui.mutedText}`, children: spec.label }), _jsx("span", { className: ui.bodyText, children: spec.value })] }, spec.label))) }))] }));
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
    const accentColors = result.tokens.colors.filter((token) => !primaryColors.includes(token) && !neutralColors.includes(token));
    const familyCounts = result.components.reduce((accumulator, component) => {
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
            .map(([type, count]) => ({ type: type, count }))
            .sort((left, right) => right.count - left.count),
        colorGroups: {
            primary: primaryColors.slice(0, 4),
            neutral: neutralColors.slice(0, 5),
            accent: accentColors.slice(0, 6)
        }
    };
}
function isNeutralColor(value) {
    const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!match)
        return false;
    const [r, g, b] = [Number(match[1]), Number(match[2]), Number(match[3])];
    return Math.abs(r - g) < 12 && Math.abs(g - b) < 12;
}
function getReadableTextColor(backgroundColor, preferredTextColor, theme) {
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
        return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    }
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!match) {
        return null;
    }
    const [r, g, b] = [Number(match[1]), Number(match[2]), Number(match[3])];
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
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
function buildCopyText(key, summary, tokens) {
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
function buildOverviewCopy(summary) {
    return [
        "Overview",
        `- Most common fill: ${summary.primaryColor?.value ?? "Unknown"}`,
        `- Typefaces: ${summary.fontFamilies.length > 0 ? summary.fontFamilies.join(", ") : "Unknown"}`,
        `- Largest text: ${summary.h1 ? `${summary.h1.fontSize}px / ${summary.h1.lineHeight}px / ${summary.h1.fontWeight}` : "Unknown"}`,
        `- Body range: ${summary.body ? `${summary.body.fontSize}px / ${summary.body.lineHeight}px / ${summary.body.fontWeight}` : "Unknown"}`,
        `- Main component families: ${summary.componentFamilies.slice(0, 3).map((family) => family.type).join(", ") || "Unknown"}`
    ].join("\n");
}
function buildColorCopy(tokens, summary) {
    return [
        "Color",
        ...summary.colorGroups.primary.map((token) => `- Primary: ${token.name} = ${token.value}`),
        ...summary.colorGroups.neutral.map((token) => `- Neutral: ${token.name} = ${token.value}`),
        ...summary.colorGroups.accent.map((token) => `- Accent: ${token.name} = ${token.value}`)
    ].join("\n");
}
function buildTypographyCopy(summary) {
    const lines = ["Typography"];
    if (summary.fontFamilies.length > 0) {
        lines.push(`- Typefaces: ${summary.fontFamilies.join(", ")}`);
        lines.push(`  Note: The preview above uses a system fallback font, not the actual typeface. Source ${summary.fontFamilies.join(", ")} separately to match the original.`);
    }
    if (summary.h1)
        lines.push(`- Largest: ${summary.h1.fontSize}px / ${summary.h1.lineHeight}px / weight ${summary.h1.fontWeight} / ls ${summary.h1.letterSpacing}px`);
    if (summary.h2)
        lines.push(`- 2nd Largest: ${summary.h2.fontSize}px / ${summary.h2.lineHeight}px / weight ${summary.h2.fontWeight} / ls ${summary.h2.letterSpacing}px`);
    if (summary.h3)
        lines.push(`- 3rd Largest: ${summary.h3.fontSize}px / ${summary.h3.lineHeight}px / weight ${summary.h3.fontWeight} / ls ${summary.h3.letterSpacing}px`);
    if (summary.body)
        lines.push(`- Body range (14-20px): ${summary.body.fontSize}px / ${summary.body.lineHeight}px / weight ${summary.body.fontWeight} / ls ${summary.body.letterSpacing}px`);
    if (summary.caption)
        lines.push(`- Small text (<14px): ${summary.caption.fontSize}px / ${summary.caption.lineHeight}px / weight ${summary.caption.fontWeight} / ls ${summary.caption.letterSpacing}px`);
    return lines.join("\n");
}
function buildLayoutCopy(_summary) {
    return "Spacing & Layout — see extension for spacing scale, content width, and grid details.";
}
function buildComponentsCopy(summary) {
    return [
        "Components",
        ...summary.componentFamilies.slice(0, 6).map((family) => `- ${family.type}: ${family.count} detected variant${family.count !== 1 ? "s" : ""}`)
    ].join("\n");
}
