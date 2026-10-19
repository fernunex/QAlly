import { redirect } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/shell/page-header";
import { MisActividadesLista } from "@/features/activities/components/mis-actividades-lista";
import type { MiActividad, Nombres } from "@/features/activities/utils";
import { nombreEtapa } from "@/lib/catalogs";
import { listarProyectos, misActividades, nombreUsuario } from "@/lib/mock/queries";
import { obtenerUsuarioActual } from "@/lib/session";

export default async function MisActividadesPage() {
  const usuario = await obtenerUsuarioActual();
  // Solo el Miembro tiene actividades asignadas; QA gestiona desde cada proyecto.
  if (usuario.rol === "QA") redirect("/proyectos");

  const proyectos = listarProyectos(usuario.id);
  const actividades: MiActividad[] = misActividades(usuario.id).map(({ proyectoNombre, ...a }) => ({
    ...a,
    proyectoNombre,
    etapaNombre: nombreEtapa(a.tipo.etapaCodigo),
    proyectoCerrado: proyectos.find((p) => p.id === a.proyectoId)?.cerradoEn != null,
  }));

  const nombres: Nombres = {};
  for (const a of actividades) {
    for (const e of a.entregas) {
      nombres[e.autorId] = nombreUsuario(e.autorId);
      if (e.revision) nombres[e.revision.qaId] = nombreUsuario(e.revision.qaId);
    }
  }

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        titulo="Mis actividades"
        descripcion="Actividades SQA asignadas a ti en los proyectos donde participas."
      />
      <MisActividadesLista
        actividades={actividades}
        nombres={nombres}
        usuarioId={usuario.id}
        usuarioNombre={usuario.nombre}
      />
    </PageContainer>
  );
}
