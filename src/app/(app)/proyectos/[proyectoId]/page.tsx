import { PageContainer } from "@/components/shell/page-header";
import {
  AvisoSoloLectura,
  EstadoNoDisponible,
} from "@/components/states/ui-states";
import {
  DatosProyecto,
  ActividadesConfiguradas,
  MetricasConfiguradas,
} from "@/features/projects/components/consulta-proyecto";
import {
  listarActividadesIniciales,
  listarMetricasIniciales,
  consultarProyecto,
} from "@/features/projects/server/queries";
import { obtenerUsuarioActual } from "@/lib/session";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ proyectoId: string }>;
  searchParams: Promise<{ cursor?: string }>;
}) {
  await obtenerUsuarioActual();
  const { proyectoId } = await params;
  const proyecto = await consultarProyecto(proyectoId);
  if (!proyecto)
    return (
      <PageContainer>
        <EstadoNoDisponible />
      </PageContainer>
    );
  const { cursor } = await searchParams;
  const [actividades, metricas] = await Promise.all([
    listarActividadesIniciales(proyectoId, { cursor }),
    listarMetricasIniciales(proyectoId),
  ]);
  return (
    <PageContainer className="space-y-6">
      {proyecto.cerradoEn ? <AvisoSoloLectura /> : null}
      <DatosProyecto proyecto={proyecto} />
      <ActividadesConfiguradas
        pagina={actividades}
        proyecto={proyecto}
        base={`/proyectos/${proyectoId}`}
        cursor={cursor}
      />
      <MetricasConfiguradas metricas={metricas} />
    </PageContainer>
  );
}
