import { PageContainer } from "@/components/shell/page-header";
import { AvisoSoloLectura, EstadoNoDisponible } from "@/components/states/ui-states";
import { TableroActividades } from "@/features/activities/components/tablero-actividades";
import type { Nombres } from "@/features/activities/utils";
import { ETAPAS } from "@/lib/catalogs";
import { listarActividades, nombreUsuario } from "@/lib/mock/queries";
import { obtenerContextoProyecto } from "@/lib/project-context";

export default async function ActividadesPage({ params, searchParams }: PageProps<"/proyectos/[proyectoId]/actividades">) {
  const { proyectoId } = await params;
  const { etapa } = await searchParams;
  const etapaInicial = ETAPAS.some((e) => e.codigo === etapa) ? (etapa as string) : "todas";
  const { usuario, proyecto, cerrado, puedeGestionar } = await obtenerContextoProyecto(proyectoId);

  if (!proyecto) {
    return (
      <PageContainer>
        <EstadoNoDisponible />
      </PageContainer>
    );
  }

  const actividades = listarActividades(proyecto.id);
  const participantes = proyecto.participantes
    .filter((p) => p.rol === "Miembro")
    .map((p) => ({ usuarioId: p.usuarioId, nombre: p.nombre }));

  const nombres: Nombres = { [usuario.id]: usuario.nombre };
  for (const a of actividades) {
    for (const e of a.entregas) {
      nombres[e.autorId] = nombreUsuario(e.autorId);
      if (e.revision) nombres[e.revision.qaId] = nombreUsuario(e.revision.qaId);
    }
  }

  return (
    <PageContainer className="space-y-5">
      {cerrado ? <AvisoSoloLectura /> : null}
      <TableroActividades
        actividades={actividades}
        participantes={participantes}
        nombres={nombres}
        puedeGestionar={puedeGestionar}
        usuarioId={usuario.id}
        usuarioNombre={usuario.nombre}
        etapaInicial={etapaInicial}
      />
    </PageContainer>
  );
}
