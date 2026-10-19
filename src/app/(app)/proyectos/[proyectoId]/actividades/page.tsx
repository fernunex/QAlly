import { PageContainer } from "@/components/shell/page-header";
import {
  AvisoSoloLectura,
  EstadoNoDisponible,
  NotaPendiente,
} from "@/components/states/ui-states";
import { ActividadesConfiguradas } from "@/features/projects/components/consulta-proyecto";
import {
  listarActividadesIniciales,
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
  const pagina = await listarActividadesIniciales(proyectoId, { cursor });
  return (
    <PageContainer className="space-y-5">
      {proyecto.cerradoEn ? <AvisoSoloLectura /> : null}
      <ActividadesConfiguradas
        pagina={pagina}
        proyecto={proyecto}
        base={`/proyectos/${proyectoId}/actividades`}
        cursor={cursor}
      />
      <NotaPendiente>
        La gestión y entrega de actividades estará disponible en una próxima
        versión.
      </NotaPendiente>
    </PageContainer>
  );
}
