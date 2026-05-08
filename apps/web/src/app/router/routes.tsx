import { BandejaAdminPage } from "@/pages/admin/bandeja/bandeja-admin.page"
import { CentroRevisionPage } from "@/pages/admin/centro-revision/centro-revision.page"
import { CursoDetallePage } from "@/pages/admin/cursos/detalle/curso-detalle.page"
import { CursoEditorPage } from "@/pages/admin/cursos/editor/curso-editor.page"
import { ListaCursosPage } from "@/pages/admin/cursos/lista-cursos.page"
import { CursoCandidatosPage } from "@/pages/admin/diagnostico/candidatos.page"
import { HubDiagnosticoPage } from "@/pages/admin/diagnostico/hub.page"
import { MantenedoresPage } from "@/pages/admin/mantenedores/mantenedores.page"
import { FichaParticipantePage } from "@/pages/admin/seguimiento/ficha-participante.page"
import { HubSeguimientoPage } from "@/pages/admin/seguimiento/hub.page"
import { CambiarPasswordPage } from "@/pages/cambiar-password/cambiar-password.page"
import { LoginPage } from "@/pages/login/login.page"
import { MfaPage } from "@/pages/login/mfa.page"
import { BandejaParticipantePage } from "@/pages/participante/bandeja/bandeja-participante.page"
import { MisCursosPage } from "@/pages/participante/mis-cursos/mis-cursos.page"
import { VistaCursoPage } from "@/pages/participante/vista-curso/vista-curso.page"
import { RecuperarPasswordPage } from "@/pages/recuperar-password/recuperar-password.page"
import { RUTAS } from "@/shared/constants/rutas"
import { Navigate, Route, Routes } from "react-router-dom"
import { GuardCambioPassword } from "./guards/guard-cambio-password"
import { GuardRol } from "./guards/guard-rol"
import { GuardSesion } from "./guards/guard-sesion"
import { LayoutAdmin } from "./layouts/layout-admin"
import { LayoutParticipante } from "./layouts/layout-participante"

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
          <Route element={<GuardRol rol="ADMIN" />}>
            {/* Editor inmersivo · full-screen sin LayoutAdmin (sin sidebar). */}
            <Route path="/admin/cursos/:id/editor" element={<CursoEditorPage />} />

            <Route element={<LayoutAdmin />}>
              <Route path={RUTAS.admin.bandeja} element={<BandejaAdminPage />} />
              <Route path={RUTAS.admin.cursos} element={<ListaCursosPage />} />
              <Route path="/admin/cursos/:id" element={<CursoDetallePage />} />
              <Route path="/admin/cursos/:id/candidatos" element={<CursoCandidatosPage />} />
              <Route path={RUTAS.admin.diagnosticos} element={<HubDiagnosticoPage />} />
              <Route path={RUTAS.admin.centroRevision} element={<CentroRevisionPage />} />
              <Route path={RUTAS.admin.seguimiento} element={<HubSeguimientoPage />} />
              <Route path="/admin/seguimiento/p/:id" element={<FichaParticipantePage />} />
              <Route path={RUTAS.admin.mantenedores} element={<MantenedoresPage />} />
            </Route>
          </Route>

          <Route element={<GuardRol rol="PARTICIPANTE" />}>
            <Route element={<LayoutParticipante />}>
              <Route path={RUTAS.participante.bandeja} element={<BandejaParticipantePage />} />
              <Route path={RUTAS.participante.misCursos} element={<MisCursosPage />} />
              <Route path="/cursos/:slug" element={<VistaCursoPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      {/* Catch-all: redirigir a login */}
      <Route path="*" element={<Navigate to={RUTAS.login} replace={true} />} />
    </Routes>
  )
}
