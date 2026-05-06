import { BandejaAdminPage } from "@/pages/admin/bandeja/bandeja-admin.page"
import { MantenedoresPage } from "@/pages/admin/mantenedores/mantenedores.page"
import { BandejaPage } from "@/pages/bandeja/bandeja.page"
import { CambiarPasswordPage } from "@/pages/cambiar-password/cambiar-password.page"
import { LoginPage } from "@/pages/login/login.page"
import { MfaPage } from "@/pages/login/mfa.page"
import { RecuperarPasswordPage } from "@/pages/recuperar-password/recuperar-password.page"
import { RUTAS } from "@/shared/constants/rutas"
import { Navigate, Route, Routes } from "react-router-dom"
import { GuardCambioPassword } from "./guards/guard-cambio-password"
import { GuardRol } from "./guards/guard-rol"
import { GuardSesion } from "./guards/guard-sesion"
import { LayoutAdmin } from "./layouts/layout-admin"
import { LayoutParticipante } from "./layouts/layout-participante"

// Migración v2 en curso. Pantallas admin de cursos/módulos/secciones se
// reescriben PR a PR contra el nuevo modelo y viven temporalmente en
// `pages/admin/_legacy/`. Mantenedores (PR-04F) es la primera pantalla admin
// completa contra v2.

export function AppRoutes() {
  return (
    <Routes>
      {/* Publicas */}
      <Route path={RUTAS.login} element={<LoginPage />} />
      <Route path={RUTAS.loginMfa} element={<MfaPage />} />
      <Route path={RUTAS.recuperarPassword} element={<RecuperarPasswordPage />} />

      {/* Protegidas: requieren sesion */}
      <Route element={<GuardSesion />}>
        {/* Cambio de password obligatorio (no pasa por GuardCambioPassword) */}
        <Route path={RUTAS.cambiarPassword} element={<CambiarPasswordPage />} />

        {/* Rutas que se bloquean si debeCambiarPassword=true */}
        <Route element={<GuardCambioPassword />}>
          {/* Participante */}
          <Route element={<LayoutParticipante />}>
            <Route path={RUTAS.bandeja} element={<BandejaPage />} />
          </Route>

          {/* Admin */}
          <Route element={<GuardRol rol="ADMIN" />}>
            <Route element={<LayoutAdmin />}>
              <Route path={RUTAS.admin.bandeja} element={<BandejaAdminPage />} />

              {/* Mantenedores · /admin/mantenedores redirige al tab Áreas
                  (default durante la migración v2; cambia a Usuarios cuando
                  ese tab esté implementado). */}
              <Route
                path={RUTAS.admin.mantenedores}
                element={<Navigate to={RUTAS.admin.mantenedoresAreas} replace={true} />}
              />
              <Route path={RUTAS.admin.mantenedoresAreas} element={<MantenedoresPage />} />
              <Route path={RUTAS.admin.mantenedoresUsuarios} element={<MantenedoresPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      {/* Catch-all: redirigir a bandeja (que a su vez requiere sesion) */}
      <Route path="*" element={<Navigate to={RUTAS.bandeja} replace={true} />} />
    </Routes>
  )
}
