import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import DesignSystemReview from "./DesignSystemReview";
import { loadReviewResult } from "./review-data";
export default function ReviewPage() {
    const [result, setResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [theme, setTheme] = useState("light");
    useEffect(() => {
        let cancelled = false;
        void loadReviewResult()
            .then((nextResult) => {
            if (cancelled) {
                return;
            }
            if (!nextResult) {
                setErrorMessage("No extraction data found yet. Run Extract from the popup first.");
                return;
            }
            setResult(nextResult);
        })
            .catch((error) => {
            if (!cancelled) {
                setErrorMessage(error instanceof Error ? error.message : "Unable to load review data.");
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);
    return (_jsx("main", { className: `min-h-screen px-6 py-8 ${theme === "light" ? "bg-slate-100 text-slate-900" : "bg-slate-950 text-slate-100"}`, children: _jsxs("section", { className: "mx-auto max-w-7xl", children: [_jsxs("div", { className: "mb-8", children: [_jsx("div", { className: "mb-6 flex justify-end", children: _jsxs("div", { className: `inline-flex rounded-full border p-1 ${theme === "light" ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-900"}`, children: [_jsx("button", { type: "button", onClick: () => setTheme("light"), className: `rounded-full px-3 py-1.5 text-sm transition ${theme === "light" ? "bg-slate-900 text-white" : "text-slate-300"}`, children: "Light" }), _jsx("button", { type: "button", onClick: () => setTheme("dark"), className: `rounded-full px-3 py-1.5 text-sm transition ${theme === "dark" ? "bg-white text-slate-950" : "text-slate-500"}`, children: "Dark" })] }) }), _jsx("p", { className: `inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${theme === "light"
                                ? "border-slate-300 bg-white text-slate-700"
                                : "border-slate-800 bg-slate-900 text-slate-300"}`, children: "Review Page" }), _jsx("h1", { className: `mt-4 text-4xl font-semibold tracking-tight ${theme === "light" ? "text-slate-900" : "text-white"}`, children: "Extracted Design System" }), _jsx("p", { className: `mt-3 max-w-2xl text-sm leading-6 ${theme === "light" ? "text-slate-600" : "text-slate-300"}`, children: "Review the extracted system as a style guide with navigation on the left and the active design surface on the right." })] }), errorMessage ? (_jsx("div", { className: "rounded-[28px] border border-rose-300 bg-rose-50 p-6 text-sm leading-6 text-rose-700", children: errorMessage })) : result ? (_jsx(DesignSystemReview, { result: result, layout: "split", theme: theme })) : (_jsx("div", { className: `rounded-[28px] border p-6 text-sm leading-6 ${theme === "light"
                        ? "border-slate-200 bg-white text-slate-600"
                        : "border-slate-800 bg-slate-900 text-slate-300"}`, children: "Loading review data..." }))] }) }));
}
