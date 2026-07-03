import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon.svg", "icons/apple-touch-icon.png"],
      manifest: {
        name: "mding",
        short_name: "mding",
        description: "A local-first Markdown workspace for iOS, iPadOS, and macOS.",
        theme_color: "#111210",
        background_color: "#111210",
        display: "standalone",
        start_url: "/",
        scope: "/",
        file_handlers: [
          {
            action: "/",
            accept: {
              "text/html": [".html", ".htm"],
              "text/markdown": [".md", ".markdown"],
              "text/plain": [".md", ".markdown"],
            },
          },
        ],
        icons: [
          {
            src: "/icons/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,webmanifest}"],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
