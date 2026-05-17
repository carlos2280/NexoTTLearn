# Backend pendiente — Viaje del colaborador

> **Audiencia:** dev backend que implementa los endpoints faltantes para
> que la rama `feature/viaje-colaborador` pueda ir a staging con
> `VITE_USE_MOCKS=false`.
>
> **Estado al 2026-05-17:** 9 deudas (B-1 … B-26 + B-extra). 21 referencias
> en código frontend.
>
> **Sprint 1 COMPLETO ✅:** B-2, B-extra.1 (`GET /me/cursos`), B-3
> (`GET /me/ficha/resumen`), B-6 (`motivoBloqueo` en disponibilidades),
> B-extra.2 (`esPrimeraAprobacion` + `preguntasFalladas` en intento
> bloque).
>
> **Sprint 2 COMPLETO ✅:** B-4, B-26.
>
> **Sprint 3 COMPLETO ✅:** B-1, B-24, B-25.
>
> **🎉 Todos los tickets backend del viaje del colaborador implementados.**
> Los 3 sprints cierran el contrato necesario para llevar
> `feature/viaje-colaborador` a staging con `VITE_USE_MOCKS=false`.
>
> **Convenciones API:** todas las rutas bajo `/api/v1/...`. Autenticación
> por sesión (`req.session`, cookie `nexott.sid`). CSRF doble token
> (`XSRF-TOKEN` cookie + `X-XSRF-TOKEN` header) en métodos no-GET.
> Identidad del usuario SIEMPRE de `req.session` vía `@CurrentUser` —
> jamás del body. Respuestas paginadas siguen el envelope
> `{ data, meta: { page, pageSize, total, totalPages } }` (ver
> `packages/shared-types/src/catalogo/paginacion.ts`).
>
> **Para cada deuda**: ruta exacta, request, response (con ejemplo
> literal), validaciones, errores, persistencia, y dónde mirar el
> mock como spec ejecutable.

---

## Índice

- [B-1 · Nuevo caso `ESPERANDO_REVISION` en bandeja](#b-1)
- [B-2 · `skillsPendientesCount` en `MeCursoResumen`](#b-2)
- [B-3 · `GET /me/ficha/resumen` (nuevo endpoint)](#b-3)
- [B-4 · `caminoHaciaApto` en `MeAvanceCursoResponse`](#b-4)
- [B-6 · `motivoBloqueo` en disponibilidades](#b-6)
- [B-24 · `GET /me/ficha/historial` (nuevo endpoint)](#b-24)
- [B-25 · `GET /me/ficha/exportar` (nuevo endpoint binario)](#b-25)
- [B-26 · `GET /me/cursos/:cursoId/resumen-cierre` (nuevo endpoint)](#b-26)
- [B-extra · varios](#b-extra)

---

<a id="b-1"></a>

## B-1 · Nuevo caso `ESPERANDO_REVISION` en `siguienteAccion` — ✅ HECHO (2026-05-17)

**Origen:** `apps/web/src/pages/bandeja/types.ts:10-21`.

**Endpoint afectado:** `GET /api/v1/me/bandeja` (ya existe, devuelve
`MeBandejaResponse`).

**Qué cambia:** la unión discriminada `SiguienteAccion` en
`packages/shared-types/src/colaboradores/me-bandeja.types.ts:112-120` debe
admitir un **noveno** caso `ESPERANDO_REVISION`. Hoy el frontend lo
extiende localmente (`SiguienteAccionConRevision`) — al implementarlo en
backend, mover el tipo a `shared-types` y borrar la extensión local.

**Shape del nuevo caso:**

```ts
interface SiguienteAccionEsperandoRevision {
  readonly tipo: "ESPERANDO_REVISION"
  readonly asignacionId: string         // UUID
  readonly cursoId: string              // UUID
  readonly cursoTitulo: string
  readonly enRevision: "transversal" | "entrevistaIa"
  readonly fechaEnvio: string           // ISO 8601, cuándo se envió a revisión
}
```

**Cuándo emitirlo (heurística sugerida):** el participante tiene un
intento `EN_EVALUACION` (transversal) o `EN_EVALUACION_IA` (entrevista
IA) de su asignación activa más urgente, y todavía no hay resultado.
Prioridad relativa al resto de casos del `SiguienteAccion`: por debajo
de `RESULTADO_CIERRE_LISTO` y `CASO_REABIERTO`, por encima de
`CONTINUAR_CURSO`. Coordinar con el servicio que ya prioriza los 8 casos
actuales.

**Ejemplo de response (bandeja con esperando revisión):**

```json
{
  "siguienteAccion": {
    "tipo": "ESPERANDO_REVISION",
    "asignacionId": "01J7...-...-...",
    "cursoId": "01J7...-...-...",
    "cursoTitulo": "Java Senior",
    "enRevision": "transversal",
    "fechaEnvio": "2026-05-15T18:42:00.000Z"
  },
  "pendientes": [],
  "novedades": [],
  "contadores": {
    "notificacionesNoLeidas": 3,
    "cursosVoluntariadoAbiertos": 8,
    "cursosActivos": 5
  }
}
```

**Atmósfera UX:** `calmada` (sin sombra ni borde fuerte). El frontend ya
está preparado para renderizarla.

---

<a id="b-2"></a>

## B-2 · `skillsPendientesCount` en `MeCursoResumen` — ✅ HECHO (2026-05-17)

**Origen:** `apps/web/src/pages/bandeja/types.ts:58-69`,
`apps/web/src/shared/api/mocks/handlers-participante.ts:181`.

**Endpoint afectado:** `GET /api/v1/me/cursos` (ya existe). Cada item
devuelto es un `MeCursoResumen`
(`packages/shared-types/src/colaboradores/me-cursos.types.ts:23`).

**Qué cambia:** añadir el campo `skillsPendientesCount` al shape de
respuesta. Lo consume la **card destacada de la bandeja** cuando hay un
solo curso activo (frase tipo *"Te faltan 4 capacidades para apto"*).

**Shape final:**

```ts
interface MeCursoResumen {
  // ... campos actuales
  readonly skillsPendientesCount: number   // ≥ 0
}
```

**Cómo calcularlo:** número de skills del catálogo del curso que el
participante aún no ha demostrado al umbral del curso (`Curso.umbralLogro`).
Equivalente a: `caminoHaciaApto.porArea.reduce((acc, a) => acc + (a.skillsExigidas - a.skillsDemostradas), 0)`.
Devolver `0` cuando todas demostradas (no `null`).

**Ejemplo:**

```json
{
  "data": [
    {
      "asignacionId": "01J7...",
      "cursoId": "01J7...",
      "cursoTitulo": "Java Senior",
      "cursoEstado": "ACTIVO",
      "rol": "ASIGNADO",
      "estadoAsignado": "EN_PROGRESO",
      "estadoVoluntario": null,
      "fechaInscripcion": "2026-04-17T00:00:00.000Z",
      "fechaDeadline": "2026-05-29T23:59:59.000Z",
      "porcentajeAvance": 62,
      "skillsPendientesCount": 4
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 13, "totalPages": 1 }
}
```

---

<a id="b-3"></a>

## B-3 · `GET /me/ficha/resumen` (nuevo endpoint) — ✅ HECHO (2026-05-17)

**Origen:** `apps/web/src/features/me/api/obtener-ficha-resumen.api.ts`,
`apps/web/src/shared/api/mocks/handlers-participante.ts:1072-1102`.

**Ruta:** `GET /api/v1/me/ficha/resumen`.
**Auth:** sesión requerida (rol PARTICIPANTE).
**Query:** ninguna.
**Body:** N/A.

**Response shape:**

```ts
interface FichaResumenResponse {
  readonly totalAreasConActividad: number
  readonly topAreas: readonly {
    readonly areaId: string                 // UUID
    readonly areaNombre: string
    readonly areaCodigo: string             // slug — debe coincidir con --color-area-{codigo}
    readonly nivelCualitativo: "solido" | "enDesarrollo" | "inicial"
  }[]
  readonly ultimaSkillDemostrada: {
    readonly skillNombre: string
    readonly fecha: string                  // ISO 8601
  } | null
}
```

**Lógica esperada:**
- `totalAreasConActividad` = número de áreas distintas donde el
  colaborador tiene **al menos 1 skill con nota** (no nulo).
- `topAreas` = top 3 áreas por nivel cualitativo (orden: solido →
  enDesarrollo → inicial; dentro de cada nivel por nombre alfa).
- `ultimaSkillDemostrada` = última entrada de `historico_notas_skill`
  para este colaborador (más reciente). `null` si nunca demostró nada.

**Ejemplo:**

```json
{
  "totalAreasConActividad": 6,
  "topAreas": [
    { "areaId": "01J7...", "areaNombre": "Backend",  "areaCodigo": "backend",  "nivelCualitativo": "solido" },
    { "areaId": "01J7...", "areaNombre": "Frontend", "areaCodigo": "frontend", "nivelCualitativo": "enDesarrollo" },
    { "areaId": "01J7...", "areaNombre": "Cloud",    "areaCodigo": "cloud",    "nivelCualitativo": "solido" }
  ],
  "ultimaSkillDemostrada": {
    "skillNombre": "Spring Boot",
    "fecha": "2026-05-14T10:30:00.000Z"
  }
}
```

**Errores:** 401 si sin sesión. 200 con `totalAreasConActividad: 0,
topAreas: [], ultimaSkillDemostrada: null` si el colaborador nunca tuvo
actividad (no devolver 404).

**Documentación adicional:** tipos ya definidos como extensión local
en `apps/web/src/pages/bandeja/types.ts:39-56`. Al implementar,
**mover a `packages/shared-types/`** y borrar la extensión local.

---

<a id="b-4"></a>

## B-4 · `caminoHaciaApto` en `MeAvanceCursoResponse` — ✅ HECHO (2026-05-17)

**Origen:** `apps/web/src/pages/curso-inmersivo/types.ts:16-35`,
`apps/web/src/shared/api/mocks/handlers-curso-detalle.ts:439-469`,
`apps/web/src/shared/api/mocks/handlers-curso-detalle.ts:491-521`.

**Endpoint afectado:** `GET /api/v1/me/cursos/:cursoId/avance` (ya
existe, devuelve `MeAvanceCursoResponse` —
`packages/shared-types/src/reportes/autoservicio.types.ts:26-36`).

**Qué cambia:** añadir el bloque agregado `caminoHaciaApto` con vista
**por área** (sin skills granulares — decisión 03-R2 del viaje: las
skills son maquinaria interna, el participante solo ve áreas).

**Shape final:**

```ts
interface MeAvanceCursoResponse {
  // ... campos actuales
  readonly caminoHaciaApto: {
    readonly faltantesParaApto: number          // total skills faltantes sumadas
    readonly estaListo: boolean                 // true si faltantesParaApto === 0
    readonly porArea: readonly {
      readonly areaId: string                   // UUID
      readonly areaCodigo: string               // slug del área
      readonly areaNombre: string
      readonly skillsExigidas: number           // del catálogo del curso para esa área
      readonly skillsDemostradas: number        // que ya pasaron el umbral
      readonly nivelCualitativo: "solido" | "enDesarrollo" | "porExplorar"
    }[]
  }
}
```

**Lógica esperada:**
- Por cada **área que el curso evalúa** (derivado de las skills
  declaradas en `Curso.skillsObjetivo` o equivalente), agregar:
  - `skillsExigidas`: cuántas skills del catálogo del curso pertenecen
    a esa área.
  - `skillsDemostradas`: cuántas de esas skills el colaborador ya tiene
    por encima del `umbralLogro` del curso.
  - `nivelCualitativo`:
    - `solido` → `demostradas === exigidas` (área completa).
    - `enDesarrollo` → al menos 1 demostrada pero no todas.
    - `porExplorar` → 0 demostradas.
- `faltantesParaApto`: suma de `(exigidas - demostradas)` en todas las
  áreas. Cuando es 0, `estaListo: true`.

**Ejemplo:**

```json
{
  "cursoId": "01J7...",
  "estaCerrado": false,
  "porcentajeAvance": 62,
  "seccionesCompletadas": 6,
  "seccionesObligatorias": 9,
  "porSkill": [ /* ... ya existente ... */ ],
  "siguienteSeccion": { /* ... ya existente ... */ },
  "caminoHaciaApto": {
    "faltantesParaApto": 4,
    "estaListo": false,
    "porArea": [
      { "areaId": "01J7...", "areaCodigo": "backend", "areaNombre": "Backend", "skillsExigidas": 5, "skillsDemostradas": 3, "nivelCualitativo": "enDesarrollo" },
      { "areaId": "01J7...", "areaCodigo": "data",    "areaNombre": "Data",    "skillsExigidas": 3, "skillsDemostradas": 1, "nivelCualitativo": "porExplorar" },
      { "areaId": "01J7...", "areaCodigo": "cloud",   "areaNombre": "Cloud",   "skillsExigidas": 4, "skillsDemostradas": 4, "nivelCualitativo": "solido" }
    ]
  }
}
```

Al implementar, **mover el tipo a `shared-types`** y borrar
`MeAvanceCursoConCamino` en `apps/web/src/pages/curso-inmersivo/types.ts`.

---

<a id="b-6"></a>

## B-6 · `motivoBloqueo` en disponibilidades — ✅ HECHO (2026-05-17)

**Origen:** `apps/web/src/pages/curso-inmersivo/types.ts:37-46`,
`apps/web/src/shared/api/mocks/handlers-curso-detalle.ts:802` y `:849`.

**Endpoints afectados:**
- `GET /api/v1/asignaciones/:asignacionId/transversal/disponibilidad`
  (devuelve `DisponibilidadTransversalResponse` —
  `packages/shared-types/src/transversal/transversal-response.types.ts:68-74`).
- `GET /api/v1/asignaciones/:asignacionId/entrevista-ia/disponibilidad`
  (devuelve `DisponibilidadEntrevistaIaResponse` —
  `packages/shared-types/src/entrevista-ia/types.ts:54-61`).

**Qué cambia:** añadir un campo `motivoBloqueo: string | null` a ambos
schemas. Hoy el frontend hardcodea copy a partir del `razon` (enum), lo
que mezcla i18n/UX con el backend. El motivo debe ser una **frase
amable lista para mostrar**, no un código.

**Shape final (ambos):**

```ts
{
  readonly disponible: boolean
  readonly razon: ...                        // enum existente (no cambia)
  readonly motivoBloqueo: string | null      // NUEVO
  // ... campos existentes
}
```

**Reglas:**
- `disponible === true` → `motivoBloqueo: null` siempre.
- `disponible === false` → `motivoBloqueo` es string no vacío. Ejemplos:
  - Transversal `BLOQUEADO_PLAN_INCOMPLETO` → `"Completa tu plan de estudio antes de empezar el transversal."`
  - Entrevista IA `TRANSVERSAL_NO_APROBADO` → `"Aprueba primero el transversal."`
  - Entrevista IA `RATE_LIMIT_HORA` → `"Has usado tus 5 intentos de esta hora. Vuelve en {N} minutos."` (el backend resuelve el `{N}` con el rate-limiter).
  - Entrevista IA `FECHA_NO_ALCANZADA` → `"Disponible desde el {fecha}."`

**Quién mantiene el copy:** el backend (en un service o constante de
i18n, no en el controller). Esto permite cambiar el copy sin tocar
frontend y mantenerlo consistente entre clientes (web, móvil futuro).

**Errores:** `motivoBloqueo` jamás `undefined` — siempre presente como
`null` o string. Si el razón es nueva y no hay copy → devolver `null`
(el frontend ya tiene fallback genérico).

Al implementar, **borrar las extensiones locales** en
`apps/web/src/pages/curso-inmersivo/types.ts:40-46`.

---

<a id="b-24"></a>

## B-24 · `GET /me/ficha/historial` (nuevo endpoint) — ✅ HECHO (2026-05-17)

**Origen:** `packages/shared-types/src/evaluacion-inicial/ficha.schema.ts:81-128`
(tipo `EventoHistorialFicha` ya definido),
`apps/web/src/shared/api/mocks/handlers-participante.ts:815-939`.

**Ruta:** `GET /api/v1/me/ficha/historial`.
**Auth:** sesión requerida (rol PARTICIPANTE).
**Query (cursor-based, recomendada):**
- `cursor?: string` — ID del último evento de la página anterior.
- `limite?: number` — entre 1 y 100. Default 50.

**Response shape:** array ordenado por `fecha DESC` de
`EventoHistorialFicha` (unión discriminada). Frontend hoy lo recibe
como array plano y pagina en memoria; cuando este endpoint exista con
paginación, ajustar el hook `useMeFichaHistorial`.

```ts
type EventoHistorialFicha =
  | {
      readonly tipo: "SKILL_DEMOSTRADA"
      readonly id: string                        // UUID, único en el listado
      readonly fecha: string                     // ISO 8601
      readonly skillId: string
      readonly skillNombre: string
      readonly areaId: string
      readonly areaNombre: string
      readonly nivelCualitativo: "excelencia" | "solido" | "enDesarrollo" | "inicial" | "sinTocar"
      readonly origenNarrativo: string           // frase humanizada: 'Curso "Java Senior"'
      readonly origen?: "ENTREVISTA_INICIAL" | "BLOQUE" | "TRANSVERSAL" | "ENTREVISTA_IA" | "MANUAL"
      readonly referenciaIntentoIaId?: string    // UUID, solo si origen === "ENTREVISTA_IA"
    }
  | {
      readonly tipo: "CURSO_INICIADO"
      readonly id: string
      readonly fecha: string
      readonly cursoId: string
      readonly cursoTitulo: string
    }
  | {
      readonly tipo: "CURSO_COMPLETADO"
      readonly id: string
      readonly fecha: string
      readonly cursoId: string
      readonly cursoTitulo: string
    }
```

**Lógica esperada:** UNION ordenado por fecha DESC de:
- Cada entrada de `historico_notas_skill` del colaborador donde
  `valor !== null` → evento `SKILL_DEMOSTRADA` (origen + referencia
  reconstruyen `origenNarrativo` con un servicio i18n).
- Cada `asignacion` del colaborador → evento `CURSO_INICIADO` con
  `fecha = fechaInscripcion`.
- Cada `asignacion` con `cursoEstado = CERRADO` o `estadoAsignado =
  APTO/NO_APTO/COMPLETADO` → evento `CURSO_COMPLETADO` con
  `fecha = fechaCierre`.

**Ejemplo:**

```json
[
  {
    "tipo": "SKILL_DEMOSTRADA",
    "id": "evt-0",
    "fecha": "2026-05-14T12:00:00.000Z",
    "skillId": "01J7...",
    "skillNombre": "Arquitectura backend",
    "areaId": "01J7...",
    "areaNombre": "Backend",
    "nivelCualitativo": "excelencia",
    "origenNarrativo": "Entrevista IA · Curso \"Java Senior\"",
    "origen": "ENTREVISTA_IA",
    "referenciaIntentoIaId": "01J7..."
  },
  {
    "tipo": "CURSO_INICIADO",
    "id": "evt-3",
    "fecha": "2026-05-10T09:30:00.000Z",
    "cursoId": "01J7...",
    "cursoTitulo": "Fundamentos Full-Stack & DevOps"
  }
]
```

**Performance:** colaboradores activos pueden tener cientos de eventos.
Indexar `(usuarioId, fecha DESC)` en `historico_notas_skill`. Para
escalar a miles, mover a cursor real (`fecha + id` para evitar empates).

---

<a id="b-25"></a>

## B-25 · `GET /me/ficha/exportar` (nuevo endpoint binario) — ✅ HECHO (2026-05-17)

**Origen:** `apps/web/src/pages/mi-ficha/components/hero-viaje.tsx:78`,
`apps/web/src/pages/cuenta/components/tab-privacidad.tsx` (botones CSV
y PDF marcados como "Próximamente").

**Ruta:** `GET /api/v1/me/ficha/exportar?formato=csv|pdf`.
**Auth:** sesión requerida (rol PARTICIPANTE).
**Query:** `formato: "csv" | "pdf"` (requerido). Schema ya definido en
`packages/shared-types/src/colaboradores/me-cursos.types.ts:54-60` —
`formatoExportFichaSchema` y `exportarFichaQuerySchema`.

**Response:** **binario** con headers de descarga.
- `Content-Type`:
  - CSV → `text/csv; charset=utf-8`.
  - PDF → `application/pdf`.
- `Content-Disposition`: `attachment; filename="ficha-{slug-nombre}-{YYYYMMDD}.csv|pdf"`.
- Body: el archivo. NO devolver JSON envelope.

**Contenido recomendado:**
- **Columnas (CSV)** / **secciones (PDF)**: Área, Skill, Nota actual,
  Etiqueta cualitativa, Origen último cambio, Fecha último cambio,
  Cursos asociados.
- Encoding CSV: UTF-8 con BOM (Excel ESP friendly). Separador `;` o `,`
  — decidir y documentar.
- PDF: cabecera con nombre + email + fecha generación; sección por
  área; pie con disclaimer RGPD.

**Errores:**
- 422 si `formato` no es `csv` ni `pdf`.
- 401 si sin sesión.
- 429 si rate-limit (sugerido: 5 export/hora por colaborador para no
  saturar al generador PDF).

**Decisión RGPD:** exportar TODO lo que el colaborador puede ver — no
secretos internos (sin pesos de skills internos, sin notas crudas por
capa de transversal, sin payload completo de intentos). Solo lo que
ya consume `/me/ficha` y `/me/ficha/historial`.

**Frontend ya preparado:** cuando el endpoint exista, cablear en:
- `apps/web/src/pages/mi-ficha/components/hero-viaje.tsx:78` — botón
  "Exportar" del hero.
- `apps/web/src/pages/cuenta/components/tab-privacidad.tsx` — botones
  "Exportar como CSV" / "Exportar como PDF".

---

<a id="b-26"></a>

## B-26 · `GET /me/cursos/:cursoId/resumen-cierre` — ✅ HECHO (2026-05-17)

**Origen:** `apps/web/src/shared/api/mocks/handlers-participante.ts:686-813`.

**Ruta:** `GET /api/v1/me/cursos/:cursoId/resumen-cierre`.
**Auth:** sesión + ownership (el colaborador debe estar asignado al
curso, o haberse inscrito como voluntario).
**Params:** `cursoId: string` (UUID).
**Query:** ninguna.

**Response shape:** ya definido en
`packages/shared-types/src/reportes/autoservicio.types.ts:66-76`
(`ResumenCierreCurso`):

```ts
interface ResumenCierreCurso {
  readonly cursoId: string
  readonly cursoTitulo: string
  readonly fechaCierre: string                          // ISO 8601
  readonly resultado: "APTO" | "NO_APTO" | "COMPLETADO"
  readonly etiquetaCualitativaFinal: "excelencia" | "solido" | "enDesarrollo" | "noCumple"
  readonly notaGlobalFinal: number                      // 0-100
  readonly skillsDemostradasNuevas: readonly {
    readonly skillId: string
    readonly skillNombre: string
    readonly areaCodigo: string
    readonly areaNombre: string
  }[]
  readonly areasPorTrabajar: readonly {
    readonly areaId: string
    readonly areaNombre: string
    readonly areaCodigo: string
    readonly nivelCualitativo: "enDesarrollo" | "inicial"
  }[]
  readonly comentarioAdmin: string | null
}
```

**Lógica esperada:**
- `skillsDemostradasNuevas`: skills donde la nota subió por encima del
  umbral del curso **durante este curso** (delta vs nota previa al
  inicio). NO incluir skills que ya estaban demostradas antes.
- `areasPorTrabajar`: **solo cuando `resultado === "NO_APTO"`**.
  Áreas con `skillsDemostradas < skillsExigidas` al cerrar. Si APTO o
  COMPLETADO → array vacío.
- `comentarioAdmin`: texto libre del admin al cerrar (max 2000 chars).
  `null` si no escribió.
- `etiquetaCualitativaFinal` y `notaGlobalFinal` siempre presentes en
  este endpoint (a diferencia de `MeAvanceCursoResponse` donde son
  opcionales mientras el curso no esté cerrado).

**Errores:**
- 404 si el curso no existe o el colaborador no tiene acceso.
- 409 si el curso aún no está cerrado (`estaCerrado === false`) —
  devolver `{ code: "cursoNoCerrado", message: "..." }`.
- 401 si sin sesión.

**Ejemplo APTO:**

```json
{
  "cursoId": "01J7...",
  "cursoTitulo": "Fundamentos Full-Stack & DevOps",
  "fechaCierre": "2026-05-16T18:00:00.000Z",
  "resultado": "APTO",
  "etiquetaCualitativaFinal": "excelencia",
  "notaGlobalFinal": 88,
  "skillsDemostradasNuevas": [
    { "skillId": "...", "skillNombre": "React Hooks", "areaCodigo": "frontend", "areaNombre": "Frontend" },
    { "skillId": "...", "skillNombre": "Django REST Framework", "areaCodigo": "backend", "areaNombre": "Backend" }
  ],
  "areasPorTrabajar": [],
  "comentarioAdmin": null
}
```

**Ejemplo NO_APTO:**

```json
{
  "cursoId": "01J7...",
  "cursoTitulo": "AMS Frontend + Backend Django",
  "fechaCierre": "2026-05-16T18:00:00.000Z",
  "resultado": "NO_APTO",
  "etiquetaCualitativaFinal": "enDesarrollo",
  "notaGlobalFinal": 62,
  "skillsDemostradasNuevas": [
    { "skillId": "...", "skillNombre": "Django REST Framework", "areaCodigo": "backend", "areaNombre": "Backend" }
  ],
  "areasPorTrabajar": [
    { "areaId": "...", "areaNombre": "Backend", "areaCodigo": "backend", "nivelCualitativo": "enDesarrollo" },
    { "areaId": "...", "areaNombre": "Testing", "areaCodigo": "qa",      "nivelCualitativo": "inicial" }
  ],
  "comentarioAdmin": "Buenas bases en backend, pero falta consolidar testing..."
}
```

---

<a id="b-extra"></a>

## B-extra · Varios pequeños

### B-extra.1 · `areaPrincipal` en `MeCursoResumen` — ✅ HECHO (2026-05-17)

**Origen:** `apps/web/src/pages/bandeja/types.ts:62-68`.

**Endpoint afectado:** `GET /api/v1/me/cursos` (mismo que B-2).

**Qué falta:** además de `skillsPendientesCount` (B-2), añadir el área
principal del curso para que la UI pinte la barra superior y eyebrow
del card con el color del área.

```ts
interface MeCursoResumen {
  // ... + B-2
  readonly areaCodigo: string | null   // slug → mapea a --color-area-{codigo}
  readonly areaNombre: string | null
}
```

**Cómo derivarlo:** área más representada en las skills del catálogo
del curso (si hay empate, alfabético). `null` si el curso aún no
declara skills (defensivo).

---

### B-extra.2 · Corrección server-side del QUIZ + persistencia del mejor intento — ✅ HECHO (2026-05-17)

**Estado al implementar:** puntos 1 (corrección server-side) y 2 (persistencia
mejor intento) ya existían en el backend (`calcularNotaQuiz` +
`recalcularMejorIntento`). Implementados los dos "recomendados":
- **Punto 3 (`esPrimeraAprobacion`):** `crear()` ahora calcula y emite el
  campo en la respuesta del POST. Solo presente para QUIZ
  (`CODIGO_PREGUNTAS` no tiene `notaMinima`). El frontend ya no necesita
  snapshotear `mejor.data` antes del POST.
- **Punto 4 (`preguntasFalladas`):** `calcularNotaQuiz` devuelve la lista de
  ids fallidos; se persiste en nueva columna `intentos_bloque.preguntas_falladas`
  (migración `20260517122625_intentos_bloque_preguntas_falladas`) y viaja en
  todas las respuestas (POST + GET mejor-intento + listados). El frontend
  borra `lib-correccion-cliente.ts` y consume el set del server.

**Origen:** `apps/web/src/shared/api/mocks/handlers-intentos-bloque.ts`.

Hoy el mock implementa la corrección real del quiz comparando
respuestas contra `Bloque.contenido` y persistiendo el mejor intento
por (colaboradorId, bloqueId). **El backend real debe hacer
exactamente lo mismo.** Si no, los refinamientos R5/R6/R7 de la
pantalla 04 dejan de funcionar al pasar a API real.

**Endpoints involucrados:**
- `POST /api/v1/intentos-bloque` (`crearIntentoBloque`).
- `GET /api/v1/colaboradores/:colaboradorId/bloques/:bloqueId/mejor-intento`.

**Cosas que el backend tiene que respetar:**

1. **Corrección del quiz** (función `corregirQuiz` en el mock,
   líneas 38-58):
   - Parsea `Bloque.contenido` con `contenidoQuizSchema` (ya en
     `shared-types`).
   - Por cada pregunta del payload, compara con la correcta según el
     subtipo discriminado:
     - `OPCION_UNICA`: id de opción elegida == id de la opción
       marcada `esCorrecta: true`.
     - `OPCION_MULTIPLE`: **set exacto** (mismas opciones, ni de más
       ni de menos). Si `puntuacionParcial: true`, premia aciertos
       parciales (no implementado aún ni en mock ni en frontend).
     - `VERDADERO_FALSO`: `valor === pregunta.correcta`.
     - `RESPUESTA_CORTA`: normalizar texto (trim, lowercase, NFD sin
       diacríticos, espacios dobles colapsados) y comparar contra
       `respuestasAceptadas`. Respetar la config `normalizacion` de
       la pregunta si difiere del default.
   - Nota = `(pesoAcertado / pesoTotal) * 100` redondeado.
   - Si `notaMinima` se cruza → `aprobado` en la respuesta.

2. **Persistencia del mejor intento**:
   - Guardar **todos** los intentos en `historico_intentos_bloque`
     (auditoría).
   - Mantener `mejor_intento_bloque` indexado por
     `(usuarioId, bloqueId)` con la nota más alta.
   - El POST devuelve `esMejorIntento: true` solo si la nota nueva
     supera la previa.
   - `GET .../mejor-intento` devuelve la fila actual o `null` si
     nunca intentó.

3. **(Recomendado) `esPrimeraAprobacion` en `IntentoBloqueResponse`**:
   - Hoy el frontend lo deriva snapshoteando `mejor.data` antes del
     POST — funciona pero es frágil.
   - Sugerido: el server marca `esPrimeraAprobacion: true` cuando
     este intento aprueba y el mejor previo NO aprobaba. Con ese
     campo el frontend elimina el snapshot manual y la lógica queda
     en un solo lado.

4. **(Recomendado) `preguntasFalladas` en `IntentoBloqueResponse`
   para QUIZ**:
   - Array de `preguntaId[]` con las falladas. Permite al frontend
     mostrar "Por qué esto es correcto" solo donde falló sin
     recomputar localmente.
   - Si no se incluye, el frontend mantiene su helper
     `esPreguntaAcertada` en `lib-correccion-cliente.ts` como
     espejo de la lógica del server (riesgo de divergir).

---

## Resumen ejecutivo

| ID | Tipo | Esfuerzo aprox | Bloquea pantalla |
|---|---|---|---|
| **B-1** | Extensión enum + lógica priorización | S | Bandeja (escenario "esperando revisión") |
| **B-2** | Campo nuevo en endpoint existente | S | Bandeja (card destacada) + Mis cursos |
| **B-3** | Endpoint nuevo (read-only) | M | Bandeja (panel resumen) |
| **B-4** | Bloque nuevo en endpoint existente | M | Curso inmersivo (panel "Camino hacia apto") |
| **B-6** | Campo nuevo en 2 endpoints existentes | S | Curso inmersivo (mensajes de bloqueo de transversal/entrevista IA) |
| **B-24** | Endpoint nuevo con paginación | M | Mi ficha (timeline historial) |
| **B-25** | Endpoint nuevo binario (CSV+PDF) | L | Mi ficha + Cuenta (botones exportar) |
| **B-26** | Endpoint nuevo (read-only) | M | Curso cerrado (ceremonia veredicto) |
| **B-extra** | Variado | M | Mis cursos (color área) + Canvas evaluables (refinamientos 04) |

**Total estimado:** ~3 sprints backend (15-20 días/dev) si se hacen
secuencial; reducible a 2 si se paralelizan B-1+B-2+B-6 (pequeños) y
B-3+B-24+B-26 (endpoints nuevos read-only similares).

**Orden sugerido:**
1. **Sprint 1**: B-2, B-6, B-extra.1, B-extra.2 (lo más bloqueante para
   la UX del curso día a día).
2. **Sprint 2**: B-3, B-4, B-26 (cierra el "viaje" del participante).
3. **Sprint 3**: B-1, B-24, B-25 (lo de menor impacto si tarda más).

**Después de cada B-N implementado:**
1. Borrar la extensión local en `apps/web/src/...` y mover el tipo a
   `packages/shared-types/`.
2. Probar el frontend con `VITE_USE_MOCKS=false` apuntando al backend
   local.
3. Marcar el TODO como resuelto en el spec del viaje
   (`el_viaje_colaborador.md`).

---

## Bugs y deudas detectadas durante la implementación

Hallazgos que no estaban en el inventario original. Se documentan aquí
para retomarlos cuando corresponda.

### BUG-VOL-1 · Voluntarios sin plan personal — UI muestra "2 de 0 secciones, 0% avance, SÓLIDO" — ✅ RESUELTO (2026-05-17)

**Detectado:** 2026-05-17 durante validación frontend del B-4 con
`camila.soto@amsa.demo` inscrita como voluntaria al curso BHP
"Seguridad OWASP para devs".

**Fix aplicado** (opcion B + defensa B-4, sin romper D-AS-1):

- `MeAvanceService.obtenerAvance` distingue rol VOLUNTARIO: denominador
  pasa a ser total de secciones del curso (catalogo via
  `CursoModuloHabilitado`), porcentaje calculado desde aperturas,
  `siguienteSeccion` = primera no abierta del catalogo. NO se genera
  `PlanEstudio` artificial — D-AS-1 sigue intacto.
- `construirCaminoHaciaApto`: si `skillsExigidas.length === 0` ahora
  devuelve `catalogoIncompleto: true, estaListo: false` (antes
  `estaListo: true` daba un falso SOLIDO).
- `MeAvanceCursoResponse` gana `seccionesAbiertasIds: string[]` y
  `CaminoHaciaApto.catalogoIncompleto?: boolean` en `shared-types`.
- Sidebar inmersivo: marca checkmark verde cuando hay apertura, incluso
  sin plan personal (voluntarios). Contador `X/Y` ahora aparece en
  modo voluntario.

**Lo que sigue igual** (no es bug, es contrato):
- Cuando admin promueve a ASIGNADO via
  `POST /asignaciones/:id/convertir-a-asignado`, las aperturas previas
  se conservan y cuentan contra el plan recien calculado.
- Voluntarios no tienen plan personal ni deadline ni APTO/NO_APTO
  (D-AS-1, D-AS-10).

**Síntomas:**
- Panel derecho: `"2 de 0 secciones completadas. 0% avance."`
  (matemáticamente imposible).
- `caminoHaciaApto` muestra `"Has demostrado todas las capacidades
  exigidas"` y nivel `SÓLIDO` sin que el participante haya demostrado
  nada.
- Los checkmarks del sidebar de secciones no se marcan aunque las
  aperturas sí se persisten en `AperturaSeccion`.
- Sin avance perceptible para el participante.

**Causa raíz:** los **voluntarios no tienen `PlanEstudio` generado** al
inscribirse — el sistema está diseñado para que el plan personal
aplique solo a `RolAsignacion.ASIGNADO`. Sin plan:
- `MeAvanceService.contarSeccionesObligatorias` devuelve 0 (defensivo
  documentado en `me-avance.service.ts:123-128`).
- `PlanPersonalService.obtenerPorcentajeAvance` devuelve 0 (defensivo
  documentado en `plan-personal.service.ts:1135-1138`).
- Pero `AperturaSeccion.count` sí cuenta las aperturas → numerador
  positivo con denominador 0 = "2 de 0".

El falso "SÓLIDO" del `caminoHaciaApto` es consecuencia del seed
incompleto: el curso BHP no tiene `CursoSkillExigida` cargadas, así que
`skillsExigidas.length === 0` → `faltantesParaApto = 0 → estaListo:
true → nivelCualitativo: solido`. **Caso borde no contemplado en
B-4.**

**Opciones de fix (no implementadas todavía):**

1. **Backend (correcto)**: al ejecutar `POST
   /asignaciones/voluntarios` (auto-inscripción) generar también un
   `PlanEstudio` con TODAS las secciones del curso marcadas como
   OBLIGATORIA. Esto alinea voluntarios con asignados en métricas.
   Riesgo: toca el flow de inscripción y puede afectar contratos del
   admin.

2. **Frontend defensivo**: cuando `rol === VOLUNTARIO`, ocultar el
   contador "X de Y secciones" y el panel "Camino hacia apto" — solo
   mostrar `"Secciones abiertas: N"` sin meta. Parche cosmético rápido
   que no resuelve la base.

3. **B-4 defensivo (mínimo)**: en `construirCaminoHaciaApto`, si
   `exigidas.length === 0` devolver un shape distinto que el frontend
   pueda interpretar como "este curso aún no declara catálogo de
   skills" en lugar del falso `estaListo: true`. Evita el SÓLIDO
   engañoso sin tocar voluntarios.

**Recomendación:** 1 + 2 combinados. Fuera del scope de los Sprints
B-N. Crear ticket nuevo cuando se priorice.

**Pistas para retomar:**
- Flow inscripción voluntario: buscar `POST` que crea
  `AsignacionCurso` con `rol: VOLUNTARIO`. Verificar si hay rama que
  llame a `PlanPersonalService.calcularPlanPersonal` o similar.
- Componente del sidebar del inmersivo que dibuja el check de
  "sección completada": probablemente lee del plan (no de
  `AperturaSeccion`). Confirmar al implementar.

---

### DEUDA-B26-1 · `notaGlobalFinal` no se persiste en el snapshot de cierre

**Detectado:** 2026-05-17 implementando B-26.

`CursoFotografiaCierre.snapshot` (construido por
`cursos/cierre-curso.helpers.ts::construirSnapshotCierre`) NO incluye
`notaGlobalFinal` por asignación. Esto fuerza dos hacks aguas abajo:

1. `MeAvanceService.extraerNotaFinal` (línea ~398) busca
   `fila.notaGlobalFinal` que **nunca está presente** → siempre
   devuelve `null` → el campo nunca se emite en `/me/avance/cursos/:id`
   aunque el curso esté CERRADO. El comportamiento parece intencional
   pero no lo es.

2. `MeResumenCierreService` cae a `resolverNotaGlobalFinal` (promedio
   simple de notas obligatorias del snapshot). Es una aproximación
   razonable pero **no respeta la fórmula ponderada** del curso
   (`pesoBloques` + `pesoTransversal` + `pesoEntrevista`).

**Fix correcto:** modificar `construirSnapshotCierre` para incluir
`notaGlobalFinal` por asignación calculada con la fórmula completa
(mirar cómo `calcularResultadoFinal` decide APTO/NO_APTO — la nota
ponderada vive cerca de ahí). Backfillear snapshots existentes vía
migración o aceptar que solo nuevos cierres tendrán la nota correcta.

**Pistas:**
- `apps/api/src/cursos/cierre-curso.helpers.ts` función
  `construirSnapshotCierre` (líneas 400-466).
- Fórmula ponderada: revisar dónde se calcula el "promedio global" del
  curso. Probablemente en `cursos.service.ts` o
  `calcular-resultado-final.ts`.
- Borrar el fallback `resolverNotaGlobalFinal` en
  `me-resumen-cierre.service.ts` cuando el snapshot lo traiga.

---

### DEUDA-B24-1 · `origenNarrativo` genérico — falta lookup de curso/bloque

**Detectado:** 2026-05-17 implementando B-24.

`MeFichaHistorialService::narrarOrigen` devuelve frases sin contexto
(`"Bloque evaluable"`, `"Proyecto transversal"`) cuando la spec del
inventario pedía `'Curso "Java Senior"'`. Decisión MVP: no introducir
N+1 con lookup cruzado a `Curso`/`Bloque`/`Transversal`.

**Fix recomendado:** una sola query batched a las tablas referenciadas
desde `HistoricoNotaSkill.referencia` para enriquecer la frase:
- `BLOQUE`: `referencia.cursoId` → `Curso.titulo`.
- `TRANSVERSAL`: `referencia.intentoTransversalId` →
  `IntentoTransversal.transversal.curso.titulo`.
- `ENTREVISTA_IA`: `referencia.intentoEntrevistaIaId` →
  `IntentoEntrevistaIA.entrevistaIA.curso.titulo`.

**Pistas:** los mocks en `handlers-participante.ts` (commits previos)
muestran el formato esperado de las frases.

---

### DEUDA-B24-2 · Paginación cursor real

**Detectado:** 2026-05-17 implementando B-24.

`historialFichaQuerySchema` define `cursor: string` opcional pero el
service **no lo interpreta** — siempre devuelve hasta `limite=100`
desde el inicio. El frontend pagina en memoria de 5 en 5, así que
funciona para colaboradores normales; un colaborador con cientos de
hitos puede ser lento al cargar.

**Fix recomendado:** cursor compuesto `(fecha + id)` para evitar
empates. Aplicar filtros `fecha < cursor.fecha OR (fecha = cursor.fecha
AND id < cursor.id)` a las dos queries fuente (`historicoNotaSkill` y
`asignacionCurso`).

---

### DEUDA-SEED-1 · Curso AMSA tiene dos bloques QUIZ idénticos visualmente

**Detectado:** 2026-05-17 al revisar la pantalla del curso "AMS
Frontend + Backend Django" sección "Vertical Slice Architecture".

En `apps/api/prisma/seed-amsa.local.ts` (líneas ~1336 y ~1369) hay dos
bloques `TipoBloque.QUIZ` consecutivos con preguntas distintas pero
mismo nombre visible. Cuando ambos están aprobados, el participante ve
dos "Quiz · Aprobado · Tu mejor intento cuenta" indistinguibles.

**No es bug del render** — el componente `EvaluableConColapso` está
correcto. Es un seed que se podría:

1. **Fusionar** ambos quizzes en uno solo con 6 preguntas.
2. **Diferenciar** el título colapsado con un descriptor (p.ej.
   `"Quiz · 3 preguntas · 100/100"`). Cambio en
   `BloqueEvaluableColapsado` para aceptar subtítulo más rico.

Confirmado como aceptable por el usuario el 2026-05-17 (no urgente).

---

### BUG-CIERRE-1 · Pantalla `/cursos/:id/cerrado` no maneja 409 `CONFLICT_CURSO_NO_CERRADO` — ✅ RESUELTO (2026-05-17)

**Detectado:** 2026-05-17 navegando a
`/cursos/dd000000-0000-0000-0000-000000000002/cerrado` desde el
viaje del colaborador.

**Fix aplicado:**
- `useResumenCierre` deshabilita el retry para 4xx (el estado del
  curso no cambia reintentando).
- `CursoCerradoPage` captura `ApiError(409, CONFLICT_CURSO_NO_CERRADO)`
  y redirige a `RUTAS.participante.cursoDetalle(cursoId)` (la vista
  activa del inmersivo).
- Defensa primaria upstream ya estaba correcta: `topbar-inmersivo` y
  `siguiente-accion-copy` solo enlazan a `/cerrado` cuando el curso
  efectivamente esta cerrado.

**Síntomas:**
- El backend responde correctamente `409 CONFLICT_CURSO_NO_CERRADO`
  cuando la pantalla "cierre" se abre para un curso que aún no está
  cerrado (`GET /me/cursos/:cursoId/resumen-cierre`).
- El frontend muestra el banner genérico
  `"No pudimos cargar el cierre del curso. Reintenta en un momento."`
  — mensaje engañoso (reintentar no cambia el estado, el curso
  literalmente no está cerrado todavía).

**Causa raíz:** la pantalla `curso-cerrado.page.tsx` (o el hook que
consume `/me/cursos/:cursoId/resumen-cierre`) trata cualquier error
de la query como "fallo de carga reintenta", sin diferenciar el caso
semántico de "el curso no está cerrado".

**Opciones de fix:**

1. **Redirigir** a `/cursos/:cursoId` (vista activa) cuando el error
   sea `CONFLICT_CURSO_NO_CERRADO`. El usuario llegó por un link
   stale o un bookmark y debe ver el curso normal.
2. **Mensaje específico** en lugar del genérico: "Este curso aún no
   está cerrado. Vuelve cuando el cierre esté disponible." + CTA
   "Ir al curso".
3. **Defensa upstream**: el componente/link que lleva a `/cerrado`
   debería gatearse por `curso.estado === CERRADO` y nunca enviar al
   usuario aquí si no aplica.

**Recomendación:** 3 (defensa primaria) + 1 (defensa secundaria si
alguien llega de igual). Mensaje genérico actual = bug.

**Pistas para retomar:**
- `apps/web/src/pages/curso-cerrado/curso-cerrado.page.tsx`.
- Hook que consume el endpoint — buscar `useResumenCierre` o similar.
- El backend YA distingue el caso (`CONFLICT_CURSO_NO_CERRADO`); el
  frontend solo necesita capturarlo.

---

## Para el próximo agente de QA / refactor

Después de cerrar el sprint B-N, hay material para un pase de calidad:

1. **Bugs documentados arriba** (BUG-VOL-1, DEUDA-B26-1, DEUDA-B24-1,
   DEUDA-B24-2, DEUDA-SEED-1). Priorizar según impacto en UX.
2. **Drift de tipos**: confirmar que `apps/web/src/**/types.ts` ya no
   tienen extensiones locales. Los archivos del Sprint borraron
   `pages/bandeja/types.ts` (parcialmente) y
   `pages/curso-inmersivo/types.ts` (completo). Hacer un barrido
   global por `// TODO B-N` huérfanos.
3. **Antipatrones residuales**: buscar `as unknown as`, `// @ts-ignore`,
   `any` explícito, `import type` para inyectables Nest, fetch directo
   sin pasar por `httpClient`. El proyecto los prohíbe pero pueden
   haberse colado.
4. **Mocks divergentes del backend real**: los mocks de
   `handlers-participante.ts` y `handlers-curso-detalle.ts` se han ido
   simplificando al implementar cada B-N. Validar que aún cubren los
   escenarios de desarrollo (`VITE_USE_MOCKS=true`) sin contradecir el
   contrato del backend.
5. **Tests E2E ausentes**: cada B-N tiene tests unitarios pero
   `obtenerBandeja` integral, `/me/ficha/historial` integral, etc., no
   tienen tests de integración contra BD real. Considerar añadirlos
   antes del PR a `develop`.
