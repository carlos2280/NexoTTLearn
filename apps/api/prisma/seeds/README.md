# Seeds — Curso vivo "Frontend desde Cero: Mentalidad, Codigo y Confianza"

Modulos del seed. La orquestacion real vive en `apps/api/prisma/seed.ts`
(no aqui). Ejecutar con `pnpm db:seed` o `make db-seed`.

Estado actual (post-simplificacion): la plataforma siembra UN solo curso
vivo, con 3 admins y 1 participante de prueba inscrito. Pensado para QA
manual y demos.

## Archivos

- `_config.ts` — constantes inmutables (prefijos UUID, passwords, dias).
- `_utils.ts` — helpers comunes: pad, id-builders, `log`,
  `validarOExplotar` y los `buildX` que crean cada tipo de bloque
  pedagogico validado con Zod.
- `catalogo.ts` — datos canonicos de actores + `seedAdmins`,
  `seedParticipantes`, `seedAreas`, `seedCliente`. Sin tipos de
  transversal/entrevista (no aplican al curso actual).
- `modulos/soporte-react.ts` — array `MODULOS_SOPORTE_REACT` con los 9
  modulos pedagogicos del curso (Bienvenida, Git, Web, JavaScript,
  TypeScript, React, Datos del servidor, IA, Calidad).
- `modulos/types.ts` — tipos compartidos `BloqueRealDef`, `SeccionDef`,
  `ModuloDef`, `ModuloPersistido`.
- `curso-soporte-react.ts` — `seedSkillsSoporteReact`,
  `seedModulosSoporteReact`, `seedCursoSoporteReact` (curso + areas /
  skills exigidas + proyecto transversal "Mini Centro de Tickets") y
  `seedInscripcionSoporte` (asignacion del participante de prueba).

## Orden de orquestacion (de `seed.ts`)

1. `seedAdmins`
2. `seedParticipantes`
3. `seedAreas` → devuelve `Map<nombreArea, areaId>`
4. `seedCliente` → devuelve `clienteId`
5. `seedSkillsSoporteReact(areaIdByNombre)` → devuelve
   `Map<etiquetaSkill, skillId>`
6. `seedModulosSoporteReact(skillIdByEtiqueta)` → devuelve
   `ModuloPersistido[]`
7. `seedCursoSoporteReact(clienteId, modulos, skillIdByEtiqueta)` →
   devuelve `cursoId`
8. `seedInscripcionSoporte(cursoId)` — inscribe al participante de prueba

## Anadir o editar contenido pedagogico

Edita `MODULOS_SOPORTE_REACT` en `modulos/soporte-react.ts`. Cada seccion
puede declarar su array `bloques` con `BloqueRealDef[]`; si lo omites, el
seed genera 1 PARRAFO + 1 QUIZ placeholder a partir de `temas`. Los
builders (`buildParrafo`, `buildTip`, `buildQuiz`,
`buildCodigoPreguntas`, `buildCodigoTests`, `buildCodigoIlustrativo`,
`buildRecurso`) validan el contenido con Zod del `shared-types` antes de
insertarlo.

Para bloques `CODIGO_PREGUNTAS` con su `CODIGO_TESTS` asociado, usa los
IDs preasignados declarados al inicio de `modulos/soporte-react.ts`
(`ID_SOP_M{N}_S{S}_PREG`, `ID_SOP_M{N}_S{S}_TEST`) para que el test
apunte al `codigoPreguntasId` correcto.

## Credenciales

| Rol | Email | Password | Cambio pwd al primer login |
|---|---|---|---|
| Admin | `royarzun@emeal.nttdata.com` | `Cambiar2026!` | Si |
| Admin | `carlos.fuentes.fuentes@emeal.nttdata.com` | `Cambiar2026!` | Si |
| Admin | `qa-admin@nexott.local` | `Cambiar2026!` | No (atajo QA) |
| Participante | `participante@nexott.local` | `Qa1234!` | No |

Overrides via entorno: `QA_ADMIN_PASSWORD`, `QA_USER_PASSWORD`.
