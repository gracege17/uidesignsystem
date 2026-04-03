const STORAGE_KEY = "latest-extraction-result";
export function getExtensionApi() {
    return globalThis.chrome;
}
export async function saveReviewResult(result) {
    const extensionApi = getExtensionApi();
    if (extensionApi?.storage?.local) {
        await extensionApi.storage.local.set({ [STORAGE_KEY]: result });
        return;
    }
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
}
export async function loadReviewResult() {
    const extensionApi = getExtensionApi();
    if (extensionApi?.storage?.local) {
        const stored = await extensionApi.storage.local.get(STORAGE_KEY);
        return stored[STORAGE_KEY] ?? null;
    }
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
}
export async function openReviewPage() {
    const extensionApi = getExtensionApi();
    const url = extensionApi?.runtime?.getURL("review.html") ?? "/review.html";
    if (extensionApi?.tabs?.create) {
        await extensionApi.tabs.create({ url });
        return;
    }
    globalThis.open(url, "_blank", "noopener,noreferrer");
}
