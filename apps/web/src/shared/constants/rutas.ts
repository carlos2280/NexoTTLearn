export const RUTAS = {
  login: "/login",
  logout: "/logout",
  bandeja: "/bandeja",
  cuenta: "/cuenta",
  participante: {
    misCursos: "/mis-cursos",
    miFicha: "/mi-ficha",
    catalogo: "/catalogo",
    cursoDetalle: (cursoId: string) => `/cursos/${cursoId}`,
  },
  admin: {
    inicio: "/admin",
    cursos: "/admin/cursos",
    cursoDetalle: (id: string) => `/admin/cursos/${id}`,
    cursoAsignaciones: (id: string) => `/admin/cursos/${id}/asignaciones`,
    personas: "/admin/personas",
    clientes: "/admin/clientes",
    catalogo: "/admin/catalogo",
    // El detalle de módulo abre directamente el builder inmersivo.
    catalogoModuloDetalle: (id: string) => `/admin/catalogo/modulos/${id}`,
    reportes: "/admin/reportes",
    sistema: "/admin/sistema",
  },
} as const
