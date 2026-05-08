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

    centroRevision: "/admin/centro-revision",
    seguimiento: "/admin/seguimiento",
    seguimientoParticipante: (id: string): string => `/admin/seguimiento/p/${id}`,
    mantenedores: "/admin/mantenedores",
    configuracion: "/admin/configuracion",
  },

  // Participante
  participante: {
    bandeja: "/",
    misCursos: "/cursos",
    cursoDetalle: (id: string): string => `/cursos/${id}`,
    cursoModulo: (slug: string, moduloId: string): string => `/cursos/${slug}/modulo/${moduloId}`,
    catalogo: "/catalogo",
    catalogoCurso: (slug: string): string => `/catalogo/${slug}`,
    expediente: "/expediente",
  },
} as const
