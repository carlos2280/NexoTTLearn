/**
 * Setup file ejecutado por Vitest antes de cualquier import de la app.
 *
 * Los e2e instancian `AppModule` real desde `dist/`, que lee `AI_PROVIDER`
 * desde el entorno. En dev el `.env` apunta a `claude` (Anthropic real), lo
 * que rompe los tests: introduce latencia, requiere API key y no es
 * determinista. Forzamos `mock` siempre — `ConfigModule.forRoot()` por
 * default no sobrescribe variables ya presentes en `process.env`, asi que
 * gana este setup sobre el `.env`.
 *
 * Para correr e2e contra Claude real (caso raro, ej. validar prompt antes
 * de release), pasa `E2E_USE_REAL_CLAUDE=1`.
 */
if (process.env.E2E_USE_REAL_CLAUDE !== "1") {
  process.env.AI_PROVIDER = "mock"
}
