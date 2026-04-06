import { useState } from "react";
import { extractDesignSystem } from "@extractor/parser";
import type { ExtractionResult } from "@extractor/types";
import { captureSerializedStyles } from "../features/extraction/captureSerializedStyles";
import DesignSystemReview from "../features/review/DesignSystemReview";
import { openReviewPage, saveReviewResult } from "../features/storage/review-data";

export default function PopupPage() {
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [view, setView] = useState<"review" | "raw">("review");

  const handleExtract = async () => {
    setIsExtracting(true);
    setErrorMessage(null);

    try {
      const nodes = await captureSerializedStyles();
      const nextResult = extractDesignSystem(nodes);
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
    <main className="min-h-screen bg-panel-grid bg-[size:24px_24px] p-5 text-slate-100">
      <section className="mx-auto flex min-h-[520px] max-w-md flex-col rounded-[28px] border border-white/10 bg-slate-900/80 p-6 shadow-panel backdrop-blur">
        <div className="mb-8">
          <p className="mb-3 inline-flex rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-100">
            Manifest V3
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Design System Extractor
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Run a token extraction pass against the active page and inspect the
            shared parser output directly in the popup.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExtract}
          disabled={isExtracting}
          className="inline-flex items-center justify-center rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          {isExtracting ? "Extracting..." : "Extract"}
        </button>

        <button
          type="button"
          onClick={() => void openReviewPage()}
          disabled={!result}
          className="mt-3 inline-flex items-center justify-center rounded-2xl border border-white/15 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/30 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Open Review Page
        </button>

        <div className="mt-6 flex-1 rounded-2xl border border-white/10 bg-slate-950/80 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Extraction Preview</h2>
              <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                active tab
              </p>
            </div>

            <div className="inline-flex rounded-full border border-white/10 bg-slate-900/80 p-1 text-xs">
              <button
                type="button"
                onClick={() => setView("review")}
                className={`rounded-full px-3 py-1.5 transition ${
                  view === "review"
                    ? "bg-white text-slate-950"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Review
              </button>
              <button
                type="button"
                onClick={() => setView("raw")}
                className={`rounded-full px-3 py-1.5 transition ${
                  view === "raw" ? "bg-white text-slate-950" : "text-slate-300 hover:text-white"
                }`}
              >
                Raw
              </button>
            </div>
          </div>

          {errorMessage ? (
            <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm leading-6 text-rose-100">
              {errorMessage}
            </p>
          ) : result ? (
            view === "review" ? (
              <DesignSystemReview result={result} layout="stacked" />
            ) : (
              <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-xs leading-6 text-slate-300">
                {JSON.stringify(result, null, 2)}
              </pre>
            )
          ) : (
            <p className="rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-sm leading-6 text-slate-300">
              Click Extract to scan the active tab and review tokens plus inferred components.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
