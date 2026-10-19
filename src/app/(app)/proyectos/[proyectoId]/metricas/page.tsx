import { PageContainer } from "@/components/shell/page-header";
import {
  AvisoSoloLectura,
  EstadoNoDisponible,
  NotaPendiente,
} from "@/components/states/ui-states";
import { MetricasConfiguradas } from "@/features/projects/components/consulta-proyecto";
import {
  listarMetricasIniciales,
  consultarProyecto,
} from "@/features/projects/server/queries";
import { obtenerUsuarioActual } from "@/lib/session";
export default async function Page({
  params,
}: PageProps<"/proyectos/[proyectoId]/metricas">) {
  await obtenerUsuarioActual();
  const { proyectoId } = await params;
  const proyecto = await consultarProyecto(proyectoId);
  if (!proyecto)
    return (
      <PageContainer>
        <EstadoNoDisponible />
      </PageContainer>
    );
  const metricas = await listarMetricasIniciales(proyectoId);
  return (
    <PageContainer className="space-y-5">
      {proyecto.cerradoEn ? <AvisoSoloLectura /> : null}
      <MetricasConfiguradas metricas={metricas} />
      <NotaPendiente>
        El seguimiento de mediciones y objetivos estará disponible en una
        próxima versión.
      </NotaPendiente>
    </PageContainer>
  );
}
