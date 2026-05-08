import type {
  ActualizarBloqueAdminInput,
  ActualizarModuloAdminInput,
  ActualizarSeccionAdminInput,
  BloqueDetalleAdmin,
  BloqueListAdminResponse,
  CrearBloqueAdminInput,
  CrearModuloAdminInput,
  CrearSeccionAdminInput,
  ModuloDetalleAdmin,
  ModuloListAdminResponse,
  PublicarResponse,
  ReordenarBloquesAdminInput,
  ReordenarModulosAdminInput,
  ReordenarSeccionesAdminInput,
  SeccionListAdminResponse,
} from "@nexott-learn/shared-types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  actualizarBloque,
  crearBloque,
  eliminarBloque,
  listarBloques,
  reordenarBloques,
} from "../api/bloques.api"
import {
  actualizarModulo,
  archivarModulo,
  crearModulo,
  desarchivarModulo,
  eliminarModulo,
  listarModulos,
  reordenarModulos,
} from "../api/modulos.api"
import { publicarCurso } from "../api/publicar-curso.api"
import {
  actualizarSeccion,
  archivarSeccion,
  crearSeccion,
  desarchivarSeccion,
  eliminarSeccion,
  listarSecciones,
  reordenarSecciones,
} from "../api/secciones.api"
import { ADMIN_CURSOS_KEY } from "./use-cursos"

// ─── Keys ────────────────────────────────────────────────────────────

export const editorKeys = {
  modulos: (cursoId: string) => [...ADMIN_CURSOS_KEY, "editor", cursoId, "modulos"] as const,
  secciones: (cursoId: string, moduloId: string) =>
    [...ADMIN_CURSOS_KEY, "editor", cursoId, "modulos", moduloId, "secciones"] as const,
  bloques: (cursoId: string, moduloId: string, seccionId: string) =>
    [
      ...ADMIN_CURSOS_KEY,
      "editor",
      cursoId,
      "modulos",
      moduloId,
      "secciones",
      seccionId,
      "bloques",
    ] as const,
  publicarChecklist: (cursoId: string) =>
    [...ADMIN_CURSOS_KEY, "editor", cursoId, "publicar-checklist"] as const,
}

// Lectura reactiva de la cache del checklist. No dispara red por si solo
// (queryFn que rechaza + enabled false): el banner solo refleja lo que ya
// se verifico, evitando publicar el curso por accidente.
export function useChecklistCacheado(cursoId: string | undefined) {
  const query = useQuery<PublicarResponse>({
    queryKey: editorKeys.publicarChecklist(cursoId ?? ""),
    queryFn: () => Promise.reject(new Error("checklist no verificado")),
    enabled: false,
  })
  return query.data ?? null
}

// ─── Queries ─────────────────────────────────────────────────────────

export function useModulos(cursoId: string | undefined) {
  return useQuery<ModuloListAdminResponse>({
    queryKey: editorKeys.modulos(cursoId ?? ""),
    queryFn: () => listarModulos(cursoId as string),
    enabled: Boolean(cursoId),
    staleTime: 30_000,
  })
}

export function useSecciones(cursoId: string | undefined, moduloId: string | undefined) {
  return useQuery<SeccionListAdminResponse>({
    queryKey: editorKeys.secciones(cursoId ?? "", moduloId ?? ""),
    queryFn: () => listarSecciones({ cursoId: cursoId as string, moduloId: moduloId as string }),
    enabled: Boolean(cursoId) && Boolean(moduloId),
    staleTime: 30_000,
  })
}

export function useBloques(
  cursoId: string | undefined,
  moduloId: string | undefined,
  seccionId: string | undefined,
) {
  return useQuery<BloqueListAdminResponse>({
    queryKey: editorKeys.bloques(cursoId ?? "", moduloId ?? "", seccionId ?? ""),
    queryFn: () =>
      listarBloques({
        cursoId: cursoId as string,
        moduloId: moduloId as string,
        seccionId: seccionId as string,
      }),
    enabled: Boolean(cursoId) && Boolean(moduloId) && Boolean(seccionId),
    staleTime: 30_000,
  })
}

// ─── Mutations ───────────────────────────────────────────────────────

export function useActualizarModulo(cursoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { moduloId: string; input: ActualizarModuloAdminInput }) =>
      actualizarModulo(cursoId, vars.moduloId, vars.input),
    onSuccess: (data: ModuloDetalleAdmin) => {
      qc.setQueryData<ModuloListAdminResponse>(editorKeys.modulos(cursoId), (prev) =>
        prev?.map((m) => (m.id === data.id ? data : m)),
      )
      qc.invalidateQueries({ queryKey: ADMIN_CURSOS_KEY })
    },
  })
}

export function useCrearModulo(cursoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CrearModuloAdminInput) => crearModulo(cursoId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: editorKeys.modulos(cursoId) })
      qc.invalidateQueries({ queryKey: ADMIN_CURSOS_KEY })
    },
  })
}

export function useArchivarModulo(cursoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { moduloId: string; archivar: boolean }) =>
      vars.archivar
        ? archivarModulo(cursoId, vars.moduloId)
        : desarchivarModulo(cursoId, vars.moduloId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: editorKeys.modulos(cursoId) })
      qc.invalidateQueries({ queryKey: ADMIN_CURSOS_KEY })
    },
  })
}

export function useEliminarModulo(cursoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (moduloId: string) => eliminarModulo(cursoId, moduloId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: editorKeys.modulos(cursoId) })
      qc.invalidateQueries({ queryKey: ADMIN_CURSOS_KEY })
    },
  })
}

export function useActualizarSeccion(cursoId: string, moduloId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { seccionId: string; input: ActualizarSeccionAdminInput }) =>
      actualizarSeccion({ cursoId, moduloId }, vars.seccionId, vars.input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: editorKeys.secciones(cursoId, moduloId) })
      qc.invalidateQueries({ queryKey: editorKeys.modulos(cursoId) })
    },
  })
}

export function useArchivarSeccion(cursoId: string, moduloId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { seccionId: string; archivar: boolean }) =>
      vars.archivar
        ? archivarSeccion({ cursoId, moduloId }, vars.seccionId)
        : desarchivarSeccion({ cursoId, moduloId }, vars.seccionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: editorKeys.secciones(cursoId, moduloId) })
      qc.invalidateQueries({ queryKey: editorKeys.modulos(cursoId) })
    },
  })
}

export function useEliminarSeccion(cursoId: string, moduloId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (seccionId: string) => eliminarSeccion({ cursoId, moduloId }, seccionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: editorKeys.secciones(cursoId, moduloId) })
      qc.invalidateQueries({ queryKey: editorKeys.modulos(cursoId) })
    },
  })
}

export function useCrearSeccion(cursoId: string, moduloId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CrearSeccionAdminInput) => crearSeccion({ cursoId, moduloId }, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: editorKeys.secciones(cursoId, moduloId) })
      qc.invalidateQueries({ queryKey: editorKeys.modulos(cursoId) })
    },
  })
}

export function useCrearBloque(cursoId: string, moduloId: string, seccionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CrearBloqueAdminInput) =>
      crearBloque({ cursoId, moduloId, seccionId }, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: editorKeys.bloques(cursoId, moduloId, seccionId) })
      qc.invalidateQueries({ queryKey: editorKeys.secciones(cursoId, moduloId) })
    },
  })
}

export function useActualizarBloque(cursoId: string, moduloId: string, seccionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { bloqueId: string; input: ActualizarBloqueAdminInput }) =>
      actualizarBloque({ cursoId, moduloId, seccionId }, vars.bloqueId, vars.input),
    onSuccess: (data: BloqueDetalleAdmin) => {
      qc.setQueryData<BloqueListAdminResponse>(
        editorKeys.bloques(cursoId, moduloId, seccionId),
        (prev) => prev?.map((b) => (b.id === data.id ? data : b)),
      )
    },
  })
}

export function useEliminarBloque(cursoId: string, moduloId: string, seccionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (bloqueId: string) => eliminarBloque({ cursoId, moduloId, seccionId }, bloqueId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: editorKeys.bloques(cursoId, moduloId, seccionId) })
    },
  })
}

export function useReordenarBloques(cursoId: string, moduloId: string, seccionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ReordenarBloquesAdminInput) =>
      reordenarBloques({ cursoId, moduloId, seccionId }, input),
    onSuccess: (data: BloqueListAdminResponse) => {
      qc.setQueryData(editorKeys.bloques(cursoId, moduloId, seccionId), data)
    },
  })
}

export function useReordenarSecciones(cursoId: string, moduloId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ReordenarSeccionesAdminInput) =>
      reordenarSecciones({ cursoId, moduloId }, input),
    onSuccess: (data: SeccionListAdminResponse) => {
      qc.setQueryData(editorKeys.secciones(cursoId, moduloId), data)
    },
  })
}

export function useReordenarModulos(cursoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ReordenarModulosAdminInput) => reordenarModulos(cursoId, input),
    onSuccess: (data: ModuloListAdminResponse) => {
      qc.setQueryData(editorKeys.modulos(cursoId), data)
    },
  })
}

export function usePublicarCurso(cursoId: string) {
  const qc = useQueryClient()
  return useMutation<PublicarResponse>({
    mutationFn: () => publicarCurso(cursoId),
    onSuccess: (resp) => {
      qc.setQueryData(editorKeys.publicarChecklist(cursoId), resp)
      if (resp.caso === "B_OK") {
        qc.invalidateQueries({ queryKey: ADMIN_CURSOS_KEY })
      }
    },
  })
}
