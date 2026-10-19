import { PageContainer, PageHeader } from "@/components/shell/page-header";
import {
  EstadoNoDisponible,
  NotaPendiente,
} from "@/components/states/ui-states";
import { obtenerContextoProyecto } from "@/lib/project-context";
export default async function Page({
  params,
}: PageProps<"/proyectos/[proyectoId]/reportes">) {
  const { proyectoId } = await params;
  const { proyecto, esQA } = await obtenerContextoProyecto(proyectoId);
  if (!proyecto || !esQA)
    return (
      <PageContainer>
        <EstadoNoDisponible />
      </PageContainer>
    );
  return (
    <PageContainer>
      <PageHeader titulo="Reportes" />
      <NotaPendiente>
        Los reportes estarán disponibles en una próxima versión. Puedes
        consultar la información actual del proyecto.
      </NotaPendiente>
    </PageContainer>
  );
}
