import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
    plugins: [react()],
    build: {
        outDir: "dist",
        emptyOutDir: true,
        rollupOptions: {
            input: {
                popup: new URL("./index.html", import.meta.url).pathname,
                review: new URL("./review.html", import.meta.url).pathname
            }
        }
    }
});
