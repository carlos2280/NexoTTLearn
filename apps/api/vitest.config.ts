import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    // Migración v2 en curso. Los módulos en `src/admin/_legacy/` corresponden al
    // schema viejo y se reescriben PR a PR. Los tests viven mockeando Prisma,
    // así que aún pasan, pero se excluyen de la suite "viva" para no falsear
    // la cobertura del nuevo modelo.
    exclude: ["**/node_modules/**", "**/dist/**", "src/admin/_legacy/**"],
    // P2: los e2e ejercitan bcrypt 12 (auth) sobre Nest+DB reales. Con varios
    // archivos e2e corriendo en paralelo (auth + auth-mfa + catalogo) el
    // default de 5s queda corto bajo contencion de CPU. 15s da slack sin ocultar
    // problemas: tests sanos siguen tardando <5s, los marginales (bloqueo tras
    // 5 fallos = 5 bcrypt seguidos) dejan de ser flaky.
    testTimeout: 15_000,
  },
})
