// Single source of truth de rutas. NUNCA hardcodear strings de rutas en componentes.
// Importar siempre desde aqui: navigate(RUTAS.bandeja), <Link to={RUTAS.login} />.

export const RUTAS = {
  // Publicas
  login: "/login",
  loginMfa: "/login/mfa",
  recuperarPassword: "/recuperar-password",

  // Compartidas (requieren sesion)
  cambiarPassword: "/cambiar-password",

  // Participante
  bandeja: "/bandeja",
  misCursos: "/mis-cursos",
  catalogo: "/catalogo",
  perfil: "/perfil",
  cursoDetalle: (id: string): string => `/cursos/${id}`,
  moduloDetalle: (cursoId: string, moduloId: string): string => `/cursos/${cursoId}/${moduloId}`,

  // Administrador
  admin: {
    bandeja: "/admin",
    cursos: "/admin/cursos",
    cursoEditar: (id: string): string => `/admin/cursos/${id}`,
    seguimiento: "/admin/seguimiento",
    centroRevision: "/admin/centro-revision",
    personas: "/admin/personas",
  },
} as const
