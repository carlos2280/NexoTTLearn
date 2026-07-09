import { QueryClient } from "@tanstack/react-query"
import { describe, expect, it, vi } from "vitest"
import { invalidarQueriesTrasApertura } from "./invalidar-tras-apertura"

describe("invalidarQueriesTrasApertura", () => {
  it("invalida el plan del participante para repintar el check verde de lecturas al instante", () => {
    const queryClient = new QueryClient()
    const spy = vi.spyOn(queryClient, "invalidateQueries")

    invalidarQueriesTrasApertura(queryClient)

    const clavesInvalidadas = spy.mock.calls.map(([arg]) => JSON.stringify(arg?.queryKey))
    // Regresion del bug "el check verde de una lectura no aparece hasta
    // recargar": la apertura DEBE invalidar el plan del participante (el
    // sidebar del inmersivo lee `completada` de ["plan-personal", ...]).
    expect(clavesInvalidadas).toContain(JSON.stringify(["plan-personal"]))
  })

  it("tambien invalida asignaciones, avance y bandeja", () => {
    const queryClient = new QueryClient()
    const spy = vi.spyOn(queryClient, "invalidateQueries")

    invalidarQueriesTrasApertura(queryClient)

    const clavesInvalidadas = spy.mock.calls.map(([arg]) => JSON.stringify(arg?.queryKey))
    expect(clavesInvalidadas).toEqual(
      expect.arrayContaining([
        JSON.stringify(["asignaciones"]),
        JSON.stringify(["me", "avance"]),
        JSON.stringify(["me", "bandeja"]),
      ]),
    )
  })

  it("invalida transversal y entrevista IA por si la lectura cierra el plan al 100%", () => {
    const queryClient = new QueryClient()
    const spy = vi.spyOn(queryClient, "invalidateQueries")

    invalidarQueriesTrasApertura(queryClient)

    const clavesInvalidadas = spy.mock.calls.map(([arg]) => JSON.stringify(arg?.queryKey))
    expect(clavesInvalidadas).toEqual(
      expect.arrayContaining([JSON.stringify(["transversal"]), JSON.stringify(["entrevista-ia"])]),
    )
  })
})
