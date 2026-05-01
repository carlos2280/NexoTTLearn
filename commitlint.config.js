/**
 * Conventional Commits — NexoTT Learn
 *
 * Formato: <tipo>(<scope>): <descripcion en espanol>
 *
 * Ejemplos:
 *   feat(auth): agregar pantalla de login con validacion Zod
 *   fix(cursos): corregir calculo de nota proyectada cuando no hay entregas
 *   chore(deps): actualizar Prisma a 6.1.0
 *   docs(arquitectura): documentar trampa de import type en NestJS DI
 *
 * Referencia: docs/CONTRIBUTING.md
 */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // Nueva funcionalidad
        "fix", // Correccion de bug
        "docs", // Solo documentacion
        "style", // Formato (no afecta logica)
        "refactor", // Refactor sin cambio funcional
        "perf", // Mejora de rendimiento
        "test", // Tests nuevos o ajustes
        "build", // Build system, deps externas
        "ci", // CI/CD
        "chore", // Mantenimiento, deps internas
        "revert", // Revertir commit anterior
      ],
    ],
    "scope-enum": [
      2,
      "always",
      [
        // Areas funcionales (alineadas con modulos del MVP)
        "auth",
        "bandeja",
        "cursos",
        "modulos",
        "secciones",
        "contenidos",
        "catalogo",
        "convocatorias",
        "inscripciones",
        "diagnostico",
        "seguimiento",
        "evaluacion",
        "entregas",
        "proyectos",
        "entrevistas",
        "personas",
        "areas",
        "valoraciones",
        "notificaciones",
        "ide",
        "perfil",
        // Capas tecnicas
        "web",
        "api",
        "db",
        "shared-types",
        "ui",
        // Infra / config
        "deps",
        "config",
        "docker",
        "scripts",
        "workflow",
        "hooks",
        "release",
      ],
    ],
    "scope-empty": [1, "never"],
    "subject-case": [0],
    "subject-max-length": [2, "always", 100],
    "body-max-line-length": [1, "always", 120],
    "header-max-length": [2, "always", 120],
  },
}
