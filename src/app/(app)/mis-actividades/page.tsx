import { redirect } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/shell/page-header";
import { MisActividadesLista } from "@/features/activities/components/mis-actividades-lista";
import { listarMisActividades } from "@/features/evidences/server/queries";
import { obtenerUsuarioActual } from "@/lib/session";

export default async function MisActividadesPage() {
  const usuario = await obtenerUsuarioActual();
  // Solo el Miembro tiene actividades asignadas; QA gestiona desde cada proyecto.
  if (usuario.rol === "QA") redirect("/proyectos");
  const { actividades, nombres } = await listarMisActividades();

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        titulo="Mis actividades"
        descripcion="Actividades SQA asignadas a ti en los proyectos donde participas."
      />
      <MisActividadesLista actividades={actividades} nombres={nombres} />
    </PageContainer>
  );
}
