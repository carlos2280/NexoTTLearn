# Seeds — Curso destacado "Frontend para devs backend"

Modulos del seed. La orquestacion real vive en `apps/api/prisma/seed.ts`
(no aqui). Ejecutar con `pnpm db:seed` o `make db-seed`.

## Archivos

- `_config.ts` — constantes inmutables (prefijos UUID, passwords, dias, ids
  fijos del transversal y de la entrevista IA).
- `_utils.ts` — helpers comunes: pad, id-builders, `log`, `validarOExplotar`
  y los `buildX` que crean cada tipo de bloque pedagogico validado con Zod.
- `catalogo.ts` — datos canonicos de actores + helpers de estado, mas las
  funciones `seedAdmins`, `seedParticipantes`, `seedAreas`, `seedCliente` y
  `seedSkillsFrontend`. Incluye tambien los IDs preasignados de bloques
  CODIGO_PREGUNTAS / CODIGO_TESTS para resolver sus dependencias internas.
- `modulos/index.ts` — array `MODULOS_FRONTEND` con los 10 modulos reales
  (Git, IA, HTML, CSS, JS, TS, Disciplina, React, Tanstack Query, Testing).
  Contenido pedagogico inline.
- `curso.ts` — `seedModulos` (inserta modulos + secciones + bloques) y
  `seedCurso` (curso destacado, areas y skills exigidas, transversal,
  entrevista IA, rubricas).
- `progreso.ts` — `seedAsignacionesFrontend`, `seedHistoriaParticipante` y
  `seedNotasSkill`.

## Orden de orquestacion (de `seed.ts`)

1. `seedAdmins`
2. `seedParticipantes`
3. `seedAreas` → devuelve `Map<nombreArea, areaId>`
4. `seedCliente` → devuelve `clienteId`
5. `seedSkillsFrontend(areaIdByNombre)` → devuelve `Map<etiquetaSkill, skillId>`
6. `seedModulos(skillIdByEtiqueta)` → devuelve `ModuloPersistido[]`
7. `seedCurso(clienteId, modulos, skillIdByEtiqueta)` → devuelve `cursoId`
8. `seedAsignacionesFrontend(cursoId, modulos)` (esto invoca
   `seedHistoriaParticipante` por participante)
9. `seedNotasSkill(cursoId, skillIdByEtiqueta)`

## Anadir contenido pedagogico real a un modulo

Edita el `MODULOS_FRONTEND` en `modulos/index.ts`. Cada seccion puede
declarar su array `bloques` con `BloqueRealDef[]`; si lo omites, el seed
genera 1 PARRAFO + 1 QUIZ placeholder a partir de `temas`. Los builders
(`buildParrafo`, `buildTip`, `buildQuiz`, `buildCodigoPreguntas`,
`buildCodigoTests`, `buildCodigoIlustrativo`, `buildRecurso`) validan el
contenido con Zod del `shared-types` antes de insertarlo.

Para bloques `CODIGO_PREGUNTAS` con su `CODIGO_TESTS` asociado, usa los
IDs preasignados de `catalogo.ts` (`ID_M{N}_S2_PREG`, `ID_M{N}_S2_TEST`)
para que el test apunte al `codigoPreguntasId` correcto.

Si un modulo crece demasiado y dificulta la edicion del archivo unico,
muevelo a `modulos/m{N}-{slug}.ts` exportando `MODULO_{N}_{SLUG}` y
reexportalo desde `modulos/index.ts`.

## Fix critico aplicado

`progreso.ts → seedAsignacionesFrontend`: ahora aprueba TODOS los bloques
evaluables de cada seccion (no solo el primero). El avance del
participante requiere mejor-intento aprobado en cada bloque evaluable; si
quedara alguno fuera, la seccion no se contaria como completada aunque
el quiz principal estuviera aprobado.
