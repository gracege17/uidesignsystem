import type { ExtractionResult } from "@extractor/types";
type ThemeMode = "light" | "dark";
export default function DesignSystemReview({ result, layout, theme }: {
    result: ExtractionResult;
    layout?: "stacked" | "split";
    theme?: ThemeMode;
}): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=DesignSystemReview.d.ts.map