/**
 * Body de `POST /api/v1/cursos/:cursoId/auto-inscripcion` (D24, D25).
 * El participante elige el origen de su voluntariado:
 *  - INICIATIVA: el colaborador detecta el curso y se inscribe motu proprio.
 *  - REUTILIZACION: el colaborador esta replicando un curso que ya hizo otro.
 *
 * El service crea la fila con rol=VOLUNTARIO y estado=INSCRITO. El curso debe
 * estar ACTIVO y con toggleVoluntarios=true (403 en caso contrario).
 */

import { z } from "zod"
import { origenVoluntarioSchema } from "./asignacion.types"

export const autoInscripcionRequestSchema = z
  .object({
    origenVoluntario: origenVoluntarioSchema,
  })
  .strict()

export type AutoInscripcionRequest = z.infer<typeof autoInscripcionRequestSchema>
