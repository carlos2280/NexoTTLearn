export type TabCatalogo = "areas" | "skills" | "modulos" | "clientes"

export const TABS_CATALOGO: readonly TabCatalogo[] = ["areas", "skills", "modulos", "clientes"]

export const ETIQUETA_TAB: Record<TabCatalogo, string> = {
  areas: "Áreas",
  skills: "Skills",
  modulos: "Módulos",
  clientes: "Clientes",
}
