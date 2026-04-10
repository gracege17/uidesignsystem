import { useState } from "react";
import { extractDesignSystem } from "@extractor/parser";
import type { ExtractionResult } from "@extractor/types";
import { captureSerializedStyles } from "../features/extraction/captureSerializedStyles";
import { openReviewPage, saveReviewResult } from "../features/storage/review-data";

export default function PopupPage() {
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExtract = async () => {
    setIsExtracting(true);
    setErrorMessage(null);
    try {
      const capture = await captureSerializedStyles();
      const nextResult = extractDesignSystem(capture);
      await saveReviewResult(nextResult);
      setResult(nextResult);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Extraction failed.");
      setResult(null);
    } finally {
      setIsExtracting(false);
    }
  };

  const tokenCount = result
    ? result.tokens.colors.length + result.tokens.typography.length
    : 0;
  const componentCount = result?.components.length ?? 0;

  return (
    <main className="flex min-h-screen flex-col justify-between bg-notion-bg px-6 py-7">

      {/* Top */}
      <div>
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-notion-ink">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="1" width="4" height="4" rx="0.8" fill="white" fillOpacity="0.9"/>
              <rect x="7" y="1" width="4" height="4" rx="0.8" fill="white" fillOpacity="0.5"/>
              <rect x="1" y="7" width="4" height="4" rx="0.8" fill="white" fillOpacity="0.5"/>
              <rect x="7" y="7" width="4" height="4" rx="0.8" fill="white"/>
            </svg>
          </div>
          <span className="text-sm font-semibold text-notion-text">Design Extractor</span>
        </div>

        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-notion-text">
          {result
            ? "Ready to review."
            : isExtracting
              ? "Extracting…"
              : <>Extract any<br />website's design.</>}
        </h1>

        <p className="mt-2.5 text-sm leading-6 text-notion-text-secondary">
          {errorMessage
            ? errorMessage
            : result
              ? `${tokenCount} tokens · ${componentCount} components`
              : "Colors, type, spacing & components — ready for your AI tool."}
        </p>
      </div>

      {/* Bottom */}
      <div>
        <div className="mb-5 h-px bg-notion-border" />

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleExtract}
            disabled={isExtracting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-notion-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-notion-ink-hover active:scale-[0.99] disabled:opacity-40"
          >
            {isExtracting && (
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            )}
            {isExtracting ? "Extracting…" : result ? "Re-extract" : "Extract"}
          </button>

          <button
            type="button"
            onClick={() => void openReviewPage()}
            disabled={!result}
            className="flex w-full items-center justify-center rounded-lg bg-notion-surface px-4 py-2.5 text-sm font-medium text-notion-text transition hover:bg-notion-border disabled:cursor-not-allowed disabled:opacity-35"
          >
            Review & Copy Spec
          </button>
        </div>

        <p className="mt-4 text-xs text-notion-muted">
          by{" "}
          <a
            href="https://gracege.space"
            target="_blank"
            rel="noreferrer"
            className="text-notion-text-secondary underline decoration-1 underline-offset-2 transition hover:text-notion-text"
          >
            Grace Ge
          </a>
        </p>
      </div>

    </main>
  );
}
