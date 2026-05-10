// Mapeo de los nombres de icono que emite el back (catalogo Lucide) a los
// componentes React. El contrato shared-types deja el campo `icon` como
// z.string() porque el catalogo vive aqui (el back no conoce React).
//
// Si el back emite un nombre no mapeado, devolvemos null y el componente
// renderiza sin icono (degradacion suave en vez de crash).

import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Archive,
  Award,
  BookOpen,
  CheckCircle,
  Compass,
  Edit3,
  Layers,
  List,
  type LucideIcon,
  PlusCircle,
  ShieldCheck,
  TrendingUp,
  UserMinus,
  Users,
} from "lucide-react"

const MAPA: Record<string, LucideIcon> = {
  "alert-octagon": AlertOctagon,
  "alert-triangle": AlertTriangle,
  archive: Archive,
  award: Award,
  "book-open": BookOpen,
  "check-circle": CheckCircle,
  compass: Compass,
  "edit-3": Edit3,
  layers: Layers,
  list: List,
  "plus-circle": PlusCircle,
  "shield-check": ShieldCheck,
  "trending-up": TrendingUp,
  "user-minus": UserMinus,
  users: Users,
}

export function resolverIcono(nombre: string): LucideIcon {
  return MAPA[nombre] ?? Activity
}
