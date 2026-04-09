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

  return (
    <main className="flex min-h-screen items-center justify-center bg-panel-grid bg-[size:24px_24px] p-5">
      <section className="flex w-72 flex-col gap-3 rounded-[28px] border border-white/10 bg-slate-900/80 p-6 shadow-panel backdrop-blur">
        <h1 className="text-base font-semibold tracking-tight text-white">
          Design System Extractor
        </h1>
        <p className="text-xs leading-5 text-slate-400">
          Extract the current page, then copy a compact spec for Claude, Cursor, or any AI coding tool.
        </p>

        {errorMessage && (
          <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs leading-5 text-rose-200">
            {errorMessage}
          </p>
        )}

        {result && !errorMessage && (
          <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            Extraction complete. Open the review page and copy the prompt-ready spec.
          </p>
        )}

        <button
          type="button"
          onClick={handleExtract}
          disabled={isExtracting}
          className="inline-flex items-center justify-center rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          {isExtracting ? "Extracting…" : "Extract"}
        </button>

        <button
          type="button"
          onClick={() => void openReviewPage()}
          disabled={!result}
          className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/30 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Review & Copy Spec
        </button>

        <p className="text-center text-[11px] leading-5 text-slate-500">
          Fast flow: Extract, check the overview, then use <span className="font-medium text-slate-300">Copy Prompt-Ready Spec</span>.
        </p>

        <p className="pt-1 text-center text-xs text-slate-400">
          Created by{" "}
          <a
            href="https://gracege.space"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-slate-200 underline decoration-1 underline-offset-4 transition hover:text-white"
          >
            Grace Ge
          </a>
        </p>
      </section>
    </main>
  );
}
