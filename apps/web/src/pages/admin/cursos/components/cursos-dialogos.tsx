import { ConfirmDialog } from "@/shared/components/ui/confirm-dialog"
import { ConfirmMotivoDialog } from "@/shared/components/ui/confirm-motivo-dialog"
import type { ClienteResponse } from "@nexott-learn/shared-types"
import type { CursosOrquestacion } from "../hooks/use-cursos-orquestacion"
import { CursoDuplicarDialog } from "./curso-duplicar-dialog"
import { CursoNuevoDialog } from "./curso-nuevo-dialog"

interface CursosDialogosProps {
  readonly orq: CursosOrquestacion
  readonly clientes: readonly ClienteResponse[]
  readonly cargandoClientes: boolean
}

export function CursosDialogos({ orq, clientes, cargandoClientes }: CursosDialogosProps) {
  const { dialog, cerrar, ejecutar, estado } = orq

  return (
    <>
      <CursoNuevoDialog
        abierto={dialog.modo === "crear"}
        onCambiarAbierto={(a) => (a ? null : cerrar())}
        clientes={clientes}
        cargandoClientes={cargandoClientes}
        enviando={estado.enviandoCrear}
        onCrear={ejecutar.crear}
      />
      <ConfirmMotivoDialog
        abierto={dialog.modo === "publicar"}
        onCambiarAbierto={(a) => (a ? null : cerrar())}
        titulo={`Publicar curso «${dialog.curso?.titulo ?? ""}»`}
        descripcion="Al publicar, el curso pasa a ACTIVO y queda abierto a asignaciones. Esta acción se puede revertir cerrando el curso."
        textoConfirmar="Publicar"
        enviando={estado.enviandoPublicar}
        onConfirmar={ejecutar.publicar}
        placeholderMotivo="Motivo opcional para el log…"
      />
      <ConfirmMotivoDialog
        abierto={dialog.modo === "archivar"}
        onCambiarAbierto={(a) => (a ? null : cerrar())}
        titulo={`Archivar curso «${dialog.curso?.titulo ?? ""}»`}
        descripcion="El curso pasará a ARCHIVADO. Sólo se podrá consultar, ya no editar."
        textoConfirmar="Archivar"
        variante="danger"
        enviando={estado.enviandoArchivar}
        onConfirmar={ejecutar.archivar}
      />
      <ConfirmDialog
        abierto={dialog.modo === "desarchivar"}
        onCambiarAbierto={(a) => (a ? null : cerrar())}
        titulo={`Desarchivar curso «${dialog.curso?.titulo ?? ""}»`}
        descripcion="El curso volverá a estado CERRADO y podrá consultarse o reactivarse según convenga."
        textoConfirmar="Desarchivar"
        enviando={estado.enviandoDesarchivar}
        onConfirmar={() => ejecutar.desarchivar()}
      />
      <CursoDuplicarDialog
        abierto={dialog.modo === "duplicar"}
        onCambiarAbierto={(a) => (a ? null : cerrar())}
        curso={dialog.curso}
        enviando={estado.enviandoDuplicar}
        onConfirmar={ejecutar.duplicar}
      />
    </>
  )
}
