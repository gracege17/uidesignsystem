import { useEffect, useState } from "react";
import type { ExtractionResult } from "@extractor/types";
import DesignSystemReview from "../features/review/DesignSystemReview";
import { loadReviewResult } from "../features/storage/review-data";

export default function ReviewPage() {
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

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

  return (
    <main
      className={`min-h-screen px-6 py-8 ${
        theme === "light" ? "bg-slate-100 text-slate-900" : "bg-slate-950 text-slate-100"
      }`}
    >
      <section className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="mb-6 flex justify-end">
            <div className={`inline-flex rounded-full border p-1 ${theme === "light" ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-900"}`}>
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  theme === "light" ? "bg-slate-900 text-white" : "text-slate-300"
                }`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  theme === "dark" ? "bg-white text-slate-950" : "text-slate-500"
                }`}
              >
                Dark
              </button>
            </div>
          </div>
          <p
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${
              theme === "light"
                ? "border-slate-300 bg-white text-slate-700"
                : "border-slate-800 bg-slate-900 text-slate-300"
            }`}
          >
            Review Page
          </p>
          <h1 className={`mt-4 text-4xl font-semibold tracking-tight ${theme === "light" ? "text-slate-900" : "text-white"}`}>
            Extracted Design System
          </h1>
          <p className={`mt-3 max-w-2xl text-sm leading-6 ${theme === "light" ? "text-slate-600" : "text-slate-300"}`}>
            Review the extracted system as a style guide with navigation on the left and the
            active design surface on the right.
          </p>
        </div>

        {errorMessage ? (
          <div className="rounded-[28px] border border-rose-300 bg-rose-50 p-6 text-sm leading-6 text-rose-700">
            {errorMessage}
          </div>
        ) : result ? (
          <DesignSystemReview result={result} layout="split" theme={theme} />
        ) : (
          <div
            className={`rounded-[28px] border p-6 text-sm leading-6 ${
              theme === "light"
                ? "border-slate-200 bg-white text-slate-600"
                : "border-slate-800 bg-slate-900 text-slate-300"
            }`}
          >
            Loading review data...
          </div>
        )}
      </section>
    </main>
  );
}
