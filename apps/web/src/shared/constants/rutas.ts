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

    // Mantenedores · pantalla unificada con tabs (MAESTRO §14.1).
    // Reemplaza /admin/personas. Default: tab Áreas durante la migración v2,
    // hasta que el tab Usuarios tenga implementación funcional.
    mantenedores: "/admin/mantenedores",
    mantenedoresAreas: "/admin/mantenedores/areas",
    mantenedoresUsuarios: "/admin/mantenedores/usuarios",

    // En migración v2 — pantallas legacy en pages/admin/_legacy/
    // Las constantes se mantienen como referencia y vuelven en PR-05/06/09.
    cursos: "/admin/cursos",
    centroRevision: "/admin/centro-revision",
    seguimiento: "/admin/seguimiento",
    diagnosticos: "/admin/diagnosticos",
    configuracion: "/admin/configuracion",
  },
} as const
