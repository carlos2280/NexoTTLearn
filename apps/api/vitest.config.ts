import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    // Migración v2 en curso. Los módulos en `src/admin/_legacy/` corresponden al
    // schema viejo y se reescriben PR a PR. Los tests viven mockeando Prisma,
    // así que aún pasan, pero se excluyen de la suite "viva" para no falsear
    // la cobertura del nuevo modelo.
    exclude: ["**/node_modules/**", "**/dist/**", "src/admin/_legacy/**"],
  },
})
