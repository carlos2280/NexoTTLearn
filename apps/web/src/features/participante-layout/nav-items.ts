import { RUTAS } from "@/shared/constants/rutas"
import { BookOpen, Compass, Inbox, UserSquare2 } from "lucide-react"
import type { ParticipanteNavItem } from "./types"

export const NAV_ITEMS: readonly ParticipanteNavItem[] = [
  { id: "bandeja", etiqueta: "Mi bandeja", ruta: RUTAS.bandeja, icono: Inbox },
  { id: "mis-cursos", etiqueta: "Mis cursos", ruta: RUTAS.participante.misCursos, icono: BookOpen },
  { id: "mi-ficha", etiqueta: "Mi ficha", ruta: RUTAS.participante.miFicha, icono: UserSquare2 },
  { id: "catalogo", etiqueta: "Catálogo", ruta: RUTAS.participante.catalogo, icono: Compass },
]
