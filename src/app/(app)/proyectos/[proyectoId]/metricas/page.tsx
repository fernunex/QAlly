import { PageContainer } from "@/components/shell/page-header";
import { EstadoNoDisponible } from "@/components/states/ui-states";
import { MetricasVista } from "@/features/metrics/components/metricas-vista";
import { listarMetricas } from "@/features/metrics/server/queries";
import {
  consultarProyecto,
  listarCatalogos,
} from "@/features/projects/server/queries";
import { obtenerUsuarioActual } from "@/lib/session";

export default async function Page({
  params,
}: PageProps<"/proyectos/[proyectoId]/metricas">) {
  const usuario = await obtenerUsuarioActual();
  const { proyectoId } = await params;
  const proyecto = await consultarProyecto(proyectoId);
  if (!proyecto)
    return (
      <PageContainer>
        <EstadoNoDisponible />
      </PageContainer>
    );
  const [metricas, catalogos] = await Promise.all([
    listarMetricas(proyectoId),
    listarCatalogos(),
  ]);
  return (
    <PageContainer>
      <MetricasVista
        proyectoId={proyecto.id}
        metricas={metricas}
        catalogo={catalogos.metricas}
        cerrado={!!proyecto.cerradoEn}
        esQA={usuario.rol === "QA"}
      />
    </PageContainer>
  );
}
