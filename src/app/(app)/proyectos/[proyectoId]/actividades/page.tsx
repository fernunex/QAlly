import { PageContainer } from "@/components/shell/page-header";
import {
  AvisoSoloLectura,
  EstadoNoDisponible,
  NotaPendiente,
} from "@/components/states/ui-states";
import { TableroActividades } from "@/features/activities/components/tablero-actividades";
import { consultarTablero } from "@/features/activities/server/queries";
import { etapaSchema } from "@/features/activities/validation";
import {
  consultarProyecto,
  listarCatalogos,
} from "@/features/projects/server/queries";
import { obtenerUsuarioActual } from "@/lib/session";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ proyectoId: string }>;
  searchParams: Promise<{ etapa?: string; responsable?: string }>;
}) {
  const usuario = await obtenerUsuarioActual();
  const { proyectoId } = await params;
  const proyecto = await consultarProyecto(proyectoId);
  if (!proyecto)
    return (
      <PageContainer>
        <EstadoNoDisponible />
      </PageContainer>
    );
  const sp = await searchParams;
  const miembros = proyecto.participantes
    .filter((p) => p.rol === "Miembro")
    .map((p) => ({ usuarioId: p.usuarioId, nombre: p.nombre }));
  // Filtros desconocidos se ignoran; el responsable debe ser «sin» o un miembro del proyecto.
  const etapa = etapaSchema.safeParse(sp.etapa).data;
  const responsable =
    sp.responsable === "sin" ||
    miembros.some((m) => m.usuarioId === sp.responsable)
      ? sp.responsable
      : undefined;
  const esQA = usuario.rol === "QA";
  const [tablero, catalogos] = await Promise.all([
    consultarTablero(proyecto, { etapa, responsable }),
    listarCatalogos(),
  ]);
  return (
    <PageContainer className="space-y-5">
      {proyecto.cerradoEn ? <AvisoSoloLectura /> : null}
      <TableroActividades
        proyectoId={proyecto.id}
        tablero={tablero}
        filtros={{
          etapa: etapa ?? "todas",
          responsable: responsable ?? "todos",
        }}
        participantes={miembros}
        tipos={catalogos.actividades}
        puedeGestionar={esQA && !proyecto.cerradoEn}
      />
      {!esQA ? (
        <NotaPendiente>
          Puedes iniciar y entregar tus actividades asignadas desde Mis actividades.
        </NotaPendiente>
      ) : null}
    </PageContainer>
  );
}
