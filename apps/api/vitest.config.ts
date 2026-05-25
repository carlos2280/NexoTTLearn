import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", "**/dist/**"],
    // setup-env fuerza AI_PROVIDER=mock antes del import de AppModule, para
    // que los e2e no toquen Anthropic real (lento, no determinista, requiere
    // API key). Override con E2E_USE_REAL_CLAUDE=1 si hace falta.
    setupFiles: ["./test/setup-env.ts"],
  },
})
