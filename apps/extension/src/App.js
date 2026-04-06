import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { extractDesignSystem } from "@extractor/parser";
import DesignSystemReview from "./DesignSystemReview";
import { getExtensionApi, openReviewPage, saveReviewResult } from "./review-data";
const browserApi = getExtensionApi();
export default function App() {
    const [result, setResult] = useState(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [view, setView] = useState("review");
    const handleExtract = async () => {
        setIsExtracting(true);
        setErrorMessage(null);
        try {
            const nodes = await captureSerializedStyles();
            const nextResult = extractDesignSystem(nodes);
            await saveReviewResult(nextResult);
            setResult(nextResult);
        }
        catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Extraction failed.");
            setResult(null);
        }
        finally {
            setIsExtracting(false);
        }
    };
    return (_jsx("main", { className: "min-h-screen bg-panel-grid bg-[size:24px_24px] p-5 text-slate-100", children: _jsxs("section", { className: "mx-auto flex min-h-[520px] max-w-md flex-col rounded-[28px] border border-white/10 bg-slate-900/80 p-6 shadow-panel backdrop-blur", children: [_jsxs("div", { className: "mb-8", children: [_jsx("p", { className: "mb-3 inline-flex rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-100", children: "Manifest V3" }), _jsx("h1", { className: "text-3xl font-semibold tracking-tight text-white", children: "Design System Extractor" }), _jsx("p", { className: "mt-3 text-sm leading-6 text-slate-300", children: "Run a token extraction pass against the active page and inspect the shared parser output directly in the popup." })] }), _jsx("button", { type: "button", onClick: handleExtract, disabled: isExtracting, className: "inline-flex items-center justify-center rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:ring-offset-2 focus:ring-offset-slate-900", children: isExtracting ? "Extracting..." : "Extract" }), _jsx("button", { type: "button", onClick: () => void openReviewPage(), disabled: !result, className: "mt-3 inline-flex items-center justify-center rounded-2xl border border-white/15 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/30 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50", children: "Open Review Page" }), _jsxs("div", { className: "mt-6 flex-1 rounded-2xl border border-white/10 bg-slate-950/80 p-4", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-sm font-semibold text-white", children: "Extraction Preview" }), _jsx("p", { className: "mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-400", children: "active tab" })] }), _jsxs("div", { className: "inline-flex rounded-full border border-white/10 bg-slate-900/80 p-1 text-xs", children: [_jsx("button", { type: "button", onClick: () => setView("review"), className: `rounded-full px-3 py-1.5 transition ${view === "review"
                                                ? "bg-white text-slate-950"
                                                : "text-slate-300 hover:text-white"}`, children: "Review" }), _jsx("button", { type: "button", onClick: () => setView("raw"), className: `rounded-full px-3 py-1.5 transition ${view === "raw" ? "bg-white text-slate-950" : "text-slate-300 hover:text-white"}`, children: "Raw" })] })] }), errorMessage ? (_jsx("p", { className: "rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm leading-6 text-rose-100", children: errorMessage })) : result ? (view === "review" ? (_jsx(DesignSystemReview, { result: result, layout: "stacked" })) : (_jsx("pre", { className: "max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-xs leading-6 text-slate-300", children: JSON.stringify(result, null, 2) }))) : (_jsx("p", { className: "rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-sm leading-6 text-slate-300", children: "Click Extract to scan the active tab and review tokens plus inferred components." }))] })] }) }));
}
async function captureSerializedStyles() {
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
    return result?.result ?? [];
}
function captureSerializedStylesFromDocument() {
    const GENERIC_TAGS = new Set(["html", "body", "main", "section", "div", "span"]);
    const parsePx = (value) => {
        const numeric = Number.parseFloat(value);
        return Number.isFinite(numeric) ? Math.round(numeric * 100) / 100 : undefined;
    };
    const getElementSource = (element) => {
        const tagName = element.tagName.toLowerCase();
        if (element.id) {
            return `${tagName}#${element.id}`;
        }
        const classes = Array.from(element.classList);
        // Prefer semantic class names (CSS modules, BEM) over obfuscated short ones.
        // Semantic classes tend to be longer and contain underscores or capital letters.
        const semantic = classes.find((c) => c.length > 6 && /[_A-Z]/.test(c));
        const picked = semantic ? [semantic, ...classes.filter((c) => c !== semantic).slice(0, 1)] : classes.slice(0, 2);
        const className = picked.join(".");
        return className ? `${tagName}.${className}` : tagName;
    };
    const normalizeTextTransform = (value) => {
        if (value === "uppercase" ||
            value === "lowercase" ||
            value === "capitalize" ||
            value === "none") {
            return value;
        }
        return "none";
    };
    const hasMeaningfulStyles = (node) => Boolean(node.textColor ||
        node.backgroundColor ||
        node.borderColor ||
        node.boxShadow ||
        node.filter ||
        node.backdropFilter ||
        node.fontFamily);
    const getPriority = (element, style, rect) => {
        let score = 0;
        const tagName = element.tagName.toLowerCase();
        const text = element.textContent?.trim() ?? "";
        if (tagName === "button") {
            score += 12;
        }
        if (tagName === "a" && Boolean(element.getAttribute("href"))) {
            score += 10;
        }
        if (["input", "textarea", "select", "nav"].includes(tagName)) {
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
    const maxNodes = 300;
    const elements = Array.from(document.querySelectorAll("*"));
    return elements
        .map((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const tagName = element.tagName.toLowerCase();
        const hasVisibleArea = rect.width > 0 || rect.height > 0;
        const hasText = Boolean(element.textContent?.trim());
        if (style.display === "none" ||
            style.visibility === "hidden" ||
            (!hasVisibleArea && !hasText)) {
            return null;
        }
        // If the element itself is transparent, check direct children for the real fill.
        // Buttons on sites like Gusto apply background via a child wrapper or pseudo-element.
        let backgroundColor = style.backgroundColor;
        if ((backgroundColor === "rgba(0, 0, 0, 0)" || backgroundColor === "transparent") && element.children.length > 0) {
            for (const child of Array.from(element.children).slice(0, 3)) {
                const childBg = window.getComputedStyle(child).backgroundColor;
                if (childBg !== "rgba(0, 0, 0, 0)" && childBg !== "transparent") {
                    backgroundColor = childBg;
                    break;
                }
            }
        }
        const borderColor = style.borderStyle !== "none" &&
            (parseFloat(style.borderTopWidth) > 0 || parseFloat(style.borderRightWidth) > 0)
            ? style.borderColor
            : undefined;
        const boxShadow = style.boxShadow !== "none" ? style.boxShadow : undefined;
        const filter = style.filter !== "none" ? style.filter : undefined;
        const backdropFilter = style.backdropFilter !== "none" ? style.backdropFilter : undefined;
        const fontSize = parsePx(style.fontSize);
        const lineHeight = style.lineHeight === "normal" ? "normal" : parsePx(style.lineHeight);
        const letterSpacing = style.letterSpacing === "normal" ? "normal" : parsePx(style.letterSpacing);
        const snapshot = {
            source: getElementSource(element),
            tagName,
            classNames: Array.from(element.classList),
            textContent: element.textContent?.trim().slice(0, 120),
            childCount: element.children.length,
            width: parsePx(String(rect.width)),
            height: parsePx(String(rect.height)),
            display: style.display,
            gap: parsePx(style.gap),
            gridTemplateColumns: style.display === "grid" ? style.gridTemplateColumns : undefined,
            maxWidth: style.maxWidth !== "none" ? parsePx(style.maxWidth) : undefined,
            // Read padding from the element itself. If every side is zero, fall back to the first
            // child — button label spans often carry the real padding (e.g. Gusto-style wrappers).
            // We use a single source (self or child) so we never mix values from both.
            ...(() => {
                const pt = parsePx(style.paddingTop) ?? 0;
                const pr = parsePx(style.paddingRight) ?? 0;
                const pb = parsePx(style.paddingBottom) ?? 0;
                const pl = parsePx(style.paddingLeft) ?? 0;
                if (pt + pr + pb + pl > 0) {
                    return { paddingTop: pt, paddingRight: pr, paddingBottom: pb, paddingLeft: pl };
                }
                const firstChild = element.children[0];
                if (!firstChild)
                    return { paddingTop: undefined, paddingRight: undefined, paddingBottom: undefined, paddingLeft: undefined };
                const cs = window.getComputedStyle(firstChild);
                return {
                    paddingTop: parsePx(cs.paddingTop),
                    paddingRight: parsePx(cs.paddingRight),
                    paddingBottom: parsePx(cs.paddingBottom),
                    paddingLeft: parsePx(cs.paddingLeft)
                };
            })(),
            justifyContent: style.justifyContent,
            alignItems: style.alignItems,
            flexWrap: style.flexWrap,
            borderRadius: parsePx(style.borderRadius),
            role: element.getAttribute("role") ?? undefined,
            href: element instanceof HTMLAnchorElement ? element.href : undefined,
            inputType: element instanceof HTMLInputElement
                ? element.type
                : element instanceof HTMLTextAreaElement
                    ? "textarea"
                    : element instanceof HTMLSelectElement
                        ? "select"
                        : undefined,
            disabled: element instanceof HTMLButtonElement ||
                element instanceof HTMLInputElement ||
                element instanceof HTMLSelectElement ||
                element instanceof HTMLTextAreaElement
                ? element.disabled
                : undefined,
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
        .filter((entry) => entry !== null)
        .sort((left, right) => right.priority - left.priority)
        .slice(0, maxNodes)
        .map((entry) => entry.snapshot);
}
