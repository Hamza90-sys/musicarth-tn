import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";

// Standalone TanStack Start config (no Lovable/Cloudflare wrapper).
// Deploy target is driven by Nitro's preset — defaults to Vercel.
const tanstackStartOptions = {
  importProtection: {
    behavior: "error" as const,
    client: { files: ["**/server/**"], specifiers: ["server-only"] },
  },
  // Keep our SSR error-wrapper entry (src/server.ts).
  server: { entry: "server" },
};

export default defineConfig(({ command }) => ({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart(tanstackStartOptions),
    // Nitro produces the deployable build. Vercel preset emits `.vercel/output`,
    // which Vercel auto-detects. Override with NITRO_PRESET if needed.
    ...(command === "build" ? [nitro({ preset: process.env.NITRO_PRESET ?? "vercel" })] : []),
    viteReact(),
  ],
}));
