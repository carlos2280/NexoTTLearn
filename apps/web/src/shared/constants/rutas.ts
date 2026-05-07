// Single source of truth de rutas. NUNCA hardcodear strings de rutas en componentes.
// Importar siempre desde aqui: navigate(RUTAS.login), <Link to={RUTAS.admin.cursos} />.

export const RUTAS = {
  // Publicas
  login: "/login",
  loginMfa: "/login/mfa",
  recuperarPassword: "/recuperar-password",

  // Compartidas (requieren sesion)
  cambiarPassword: "/cambiar-password",

  // Administrador
  admin: {
    bandeja: "/admin",

    cursos: "/admin/cursos",
    cursoDetalle: (id: string): string => `/admin/cursos/${id}`,
    cursoEditor: (id: string): string => `/admin/cursos/${id}/editor`,
    cursoCandidatos: (id: string): string => `/admin/cursos/${id}/candidatos`,

    diagnosticos: "/admin/diagnostico",

    // Pendientes — items deshabilitados en el sidebar.
    centroRevision: "/admin/centro-revision",
    seguimiento: "/admin/seguimiento",
    configuracion: "/admin/configuracion",
  },
} as const
