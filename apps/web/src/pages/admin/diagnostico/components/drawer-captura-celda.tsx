import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/patterns/dialog"
import { Button } from "@/shared/ui/primitives/button"
import type { MatrizDiagnosticoArea, MatrizDiagnosticoFila } from "@nexott-learn/shared-types"
import { useEffect, useState } from "react"
import { CampoObservaciones, CampoPuntaje, semaforoEnVivo } from "./captura-celda-campos"

interface DrawerCapturaCeldaProps {
  readonly fila: MatrizDiagnosticoFila | undefined
  readonly area: MatrizDiagnosticoArea | undefined
  readonly enviando: boolean
  readonly onCerrar: () => void
  readonly onGuardar: (puntaje: number, observaciones: string | undefined) => Promise<void> | void
}

export function DrawerCapturaCelda({
  fila,
  area,
  enviando,
  onCerrar,
  onGuardar,
}: DrawerCapturaCeldaProps) {
  const abierto = fila !== undefined && area !== undefined
  const celda = fila?.celdas.find((c) => c.areaId === area?.id)

  const [puntaje, setPuntaje] = useState<string>("")
  const [observaciones, setObservaciones] = useState<string>("")

  useEffect(() => {
    if (abierto) {
      setPuntaje(celda?.nota != null ? String(celda.nota) : "")
      setObservaciones("")
    }
  }, [abierto, celda?.nota])

  const numero = Number(puntaje)
  const valido = puntaje !== "" && Number.isFinite(numero) && numero >= 0 && numero <= 100
  const semaforo = area && valido ? semaforoEnVivo(numero, area.puntajeObjetivo) : "vacio"

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent size="md">
        <DialogHeader eyebrow="Capturar evaluación inicial">
          <DialogTitle>
            {fila?.participante.nombre} {fila?.participante.apellido} · {area?.nombre}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <CampoPuntaje
            valor={puntaje}
            onChange={setPuntaje}
            objetivo={area?.puntajeObjetivo ?? 0}
            valido={valido}
            semaforo={semaforo}
          />
          <CampoObservaciones valor={observaciones} onChange={setObservaciones} />
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button
            disabled={!valido || enviando}
            loading={enviando}
            onClick={() => onGuardar(numero, observaciones.trim() || undefined)}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
