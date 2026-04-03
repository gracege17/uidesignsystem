import type { ExtractionResult } from "@extractor/types";
export declare function getExtensionApi(): {
    scripting?: {
        executeScript: (options: {
            target: {
                tabId: number;
            };
            func: (...args: never[]) => unknown;
        }) => Promise<Array<{
            result?: unknown;
        }>>;
    };
    storage?: {
        local?: {
            get: (keys: string | string[]) => Promise<Record<string, unknown>>;
            set: (items: Record<string, unknown>) => Promise<void>;
        };
    };
    runtime?: {
        getURL: (path: string) => string;
    };
    tabs?: {
        query?: (queryInfo: {
            active: boolean;
            currentWindow: boolean;
        }) => Promise<Array<{
            id?: number;
        }>>;
        create: (createProperties: {
            url: string;
        }) => Promise<unknown>;
    };
} | undefined;
export declare function saveReviewResult(result: ExtractionResult): Promise<void>;
export declare function loadReviewResult(): Promise<ExtractionResult | null>;
export declare function openReviewPage(): Promise<void>;
//# sourceMappingURL=review-data.d.ts.map