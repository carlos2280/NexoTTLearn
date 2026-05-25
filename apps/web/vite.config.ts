import { URL, fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // sandbox.worker importa Pyodide con code-splitting (dynamic imports). El
  // default 'iife' de Vite para workers no soporta multi-chunk; 'es' si.
  // Workers ES son soportados por todos los browsers evergreen (Chrome >=80,
  // Firefox >=114, Safari >=15).
  worker: {
    format: "es",
  },
  server: {
    port: 5173,
    // Si 5173 esta ocupado, fallar en vez de saltar a 5174 (que rompe el CORS del API).
    // Si esto falla, mata el proceso fantasma: lsof -ti :5173 | xargs -r kill -9
    strictPort: true,
    // WSL2: los file events nativos a veces no llegan al watcher. Polling
    // garantiza que cambios en src/ se detecten sin demora.
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
