# `_legacy/` — módulos a reescribir contra schema v2

Este directorio contiene los módulos NestJS que escribieron contra el schema **anterior** a la migración v2 (`AreaCompetencia`, `Contenido`, `Convocatoria`, `Diagnostico`...). El schema v2 (`Area`, `Bloque`, `CursoArea`, `Inscripcion` con nuevo modelo) los rompe a propósito.

Se conservan aquí como **referencia viva** para los PRs que los reescriben. Están **excluidos del typecheck** (`tsconfig.json` → `exclude: ["src/admin/_legacy/**"]`) y **desconectados de `app.module.ts`**, así que no afectan el arranque ni el build.

## Plan de reescritura

| Carpeta legacy | PR que la reescribe | Modelo v2 destino |
|---|---|---|
| ~~`areas-competencia/`~~ | ✅ PR-04 (eliminada) | `Area` (catálogo global con `EstadoArea`) |
| `cursos/` | **PR-05** | `Curso` + `CursoArea` (pesos en pivote) |
| `modulos/` | **PR-06** | `Modulo` (1:1 área, sin slug, sin estado plano) |
| `secciones/` | **PR-06** | `Seccion` (sin cambios estructurales mayores) |
| `contenidos/` | **PR-06** | `Bloque` (renombre + `TipoBloque` + dimensiones CÓDIGO) |
| `dashboard/` | **PR-09** | métricas calculadas desde `Inscripcion`, `EntregaBloque`, `ExpedienteEntry` |

## Qué replicar y qué descartar

- **Replicar**: validaciones, RBAC con guards, paginación, manejo de errores, mappers DTO ↔ entidad. Esta capa está bien hecha.
- **Descartar**: cualquier referencia a campos eliminados en v2 (p. ej. `slug` en módulo, `puntajeObjetivo` en módulo, `RolUsuario`, `Convocatoria`, `Diagnostico`).
- **Trasladar con cambios**: la lógica de negocio (cálculo de pesos, soft delete) cambia de modelo. Releer `DOCUMENTOS/doc/v2/2-datos/INVARIANTES-DB.md` para cada flujo.

## Cuándo se borra esto

Cuando los 6 PRs estén mergeados, este directorio se elimina en un PR de limpieza final.
