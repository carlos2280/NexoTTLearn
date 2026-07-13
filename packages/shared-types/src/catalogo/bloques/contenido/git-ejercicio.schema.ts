import { z } from "zod"

/**
 * Objetivo declarativo de un ejercicio de git. Se evalua sobre el estado final
 * del repositorio simulado (el motor de git en memoria del navegador). Todos
 * los campos presentes deben cumplirse para dar el ejercicio por logrado.
 *
 * Declarativo a proposito: distintos ejercicios expresan su meta con datos
 * (no con codigo), y el mismo evaluador sirve para todos. Deja la puerta
 * abierta al futuro modo evaluable (nota = 100 cuando el objetivo se cumple)
 * sin cambiar el modelo de datos.
 */
export const objetivoGitSchema = z
  .object({
    /** Rama en la que debe quedar HEAD al final (p. ej. "main"). */
    ramaActiva: z.string().min(1).max(60).optional(),
    /** Ramas que deben existir en el repo al final. */
    ramasExisten: z.array(z.string().min(1).max(60)).max(20).optional(),
    /** Debe existir un commit de merge (2 padres) alcanzable desde main. */
    hayMergeEnMain: z.boolean().optional(),
    /** Numero minimo de commits ademas del commit raiz. */
    commitsMinimos: z.number().int().min(0).max(100).optional(),
  })
  .strict()

export type ObjetivoGit = z.infer<typeof objetivoGitSchema>

/**
 * Contenido (jsonb) de un bloque GIT_EJERCICIO: un terminal de git interactivo
 * sobre un repo simulado en memoria. Hoy es autocontenido (no registra intento
 * ni nota); su `objetivo` declarativo permite marcar "logrado" en el cliente y
 * habilita el futuro modo evaluable sin migrar datos.
 *
 * - `enunciado`: consigna del ejercicio. Admite HTML (se renderiza), igual que
 *   el enunciado de los bloques SQL y de codigo.
 * - `objetivo`: condicion de exito declarativa (ver `objetivoGitSchema`).
 * - `pista`: ayuda opcional que el alumno puede desplegar.
 */
export const contenidoGitEjercicioSchema = z
  .object({
    enunciado: z.string().min(1).max(4_000),
    objetivo: objetivoGitSchema,
    pista: z.string().max(2_000).default(""),
  })
  .strict()

export type ContenidoGitEjercicio = z.infer<typeof contenidoGitEjercicioSchema>
