export const RUTAS = {
  login: "/login",
  logout: "/logout",
  bandeja: "/bandeja",
  cuenta: "/cuenta",
  admin: {
    inicio: "/admin",
    cursos: "/admin/cursos",
    cursoDetalle: (id: string) => `/admin/cursos/${id}`,
    personas: "/admin/personas",
    clientes: "/admin/clientes",
    catalogo: "/admin/catalogo",
    catalogoModuloDetalle: (id: string) => `/admin/catalogo/modulos/${id}`,
    reportes: "/admin/reportes",
    sistema: "/admin/sistema",
  },
} as const
