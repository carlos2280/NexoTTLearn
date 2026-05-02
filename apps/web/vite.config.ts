import { URL, fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // Excluir nexott-ui del pre-bundling: como es una dep local linkeada via file:,
  // queremos que Vite la trate como codigo fuente (sin cache). Asi cualquier
  // recompilacion de la lib se refleja sin tener que limpiar .vite/deps.
  optimizeDeps: {
    exclude: ["@carlos2280/nexott-ui"],
  },
  server: {
    port: 5173,
    // Si 5173 esta ocupado, fallar en vez de saltar a 5174 (que rompe el CORS del API).
    // Si esto falla, mata el proceso fantasma: lsof -ti :5173 | xargs -r kill -9
    strictPort: true,
    // WSL2: los file events nativos a veces no llegan al watcher. Polling
    // garantiza que cambios en src/ y en deps locales (file:../nexott-ui)
    // se detecten sin demora.
    watch: {
      usePolling: true,
      interval: 300,
    },
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
})
