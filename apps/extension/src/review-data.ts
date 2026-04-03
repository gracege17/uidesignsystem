import type { ExtractionResult } from "@extractor/types";

const STORAGE_KEY = "latest-extraction-result";

type ChromeLike = typeof globalThis & {
  chrome?: {
    scripting?: {
      executeScript: (options: {
        target: { tabId: number };
        func: (...args: never[]) => unknown;
      }) => Promise<Array<{ result?: unknown }>>;
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
      query?: (queryInfo: { active: boolean; currentWindow: boolean }) => Promise<
        Array<{ id?: number }>
      >;
      create: (createProperties: { url: string }) => Promise<unknown>;
    };
  };
};

export function getExtensionApi() {
  return (globalThis as ChromeLike).chrome;
}

export async function saveReviewResult(result: ExtractionResult): Promise<void> {
  const extensionApi = getExtensionApi();
  if (extensionApi?.storage?.local) {
    await extensionApi.storage.local.set({ [STORAGE_KEY]: result });
    return;
  }

  globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
}

export async function loadReviewResult(): Promise<ExtractionResult | null> {
  const extensionApi = getExtensionApi();
  if (extensionApi?.storage?.local) {
    const stored = await extensionApi.storage.local.get(STORAGE_KEY);
    return (stored[STORAGE_KEY] as ExtractionResult | undefined) ?? null;
  }

  const raw = globalThis.localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as ExtractionResult) : null;
}

export async function openReviewPage(): Promise<void> {
  const extensionApi = getExtensionApi();
  const url = extensionApi?.runtime?.getURL("review.html") ?? "/review.html";

  if (extensionApi?.tabs?.create) {
    await extensionApi.tabs.create({ url });
    return;
  }

  globalThis.open(url, "_blank", "noopener,noreferrer");
}
